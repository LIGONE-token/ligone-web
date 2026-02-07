import fs from "fs";
import path from "path";
import { createCanvas, loadImage, registerFont } from "canvas";

// -------- CONFIG --------
const AMOUNT_PATH = "data/amount.json";
const HTML_PATH = "gewinnspiel.html";
const OG_DIR = "og";
const WIDTH = 1200;
const HEIGHT = 630;

// optional: eigene Schrift
// registerFont("assets/Inter-Bold.ttf", { family: "Inter" });

function formatEUR(v){
  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(v) + " €";
}

// -------- LOAD AMOUNT --------
if (!fs.existsSync(AMOUNT_PATH)) {
  throw new Error("amount.json fehlt");
}
const { amount } = JSON.parse(fs.readFileSync(AMOUNT_PATH, "utf8"));

// -------- RENDER OG --------
fs.mkdirSync(OG_DIR, { recursive: true });
const ts = new Date().toISOString().slice(0,10); // YYYY-MM-DD
const fileName = `jackpot-${ts}.png`;
const outPath = path.join(OG_DIR, fileName);

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// Hintergrund
ctx.fillStyle = "#0f172a";
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Akzent
ctx.fillStyle = "#f59e0b";
ctx.fillRect(0, HEIGHT-140, WIDTH, 140);

// Titel
ctx.fillStyle = "#ffffff";
ctx.font = "700 48px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.fillText("LIGONE Gewinnspiel", 80, 120);

// Jackpot
ctx.font = "900 120px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.fillText(formatEUR(amount), 80, 300);

// Subline
ctx.font = "600 36px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.fillText("Tägliche Ziehung · 18:00 (Zürich)", 80, 380);

// Footer
ctx.fillStyle = "#0f172a";
ctx.font = "600 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.fillText(`Aktualisiert: ${ts}`, 80, HEIGHT - 60);

// schreiben
fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
console.log("OG erzeugt:", outPath);

// -------- UPDATE HTML --------
let html = fs.readFileSync(HTML_PATH, "utf8");

// og:image ersetzen (oder setzen)
const ogTag = `<meta property="og:image" content="https://ligone-token.github.io/ligone-web/og/${fileName}">`;
if (html.includes('property="og:image"')) {
  html = html.replace(
    /<meta property="og:image"[^>]*>/i,
    ogTag
  );
} else {
  html = html.replace("</head>", `  ${ogTag}\n</head>`);
}

// Zusatzfelder (optional, aber empfohlen)
const extras = [
  `<meta property="og:image:type" content="image/png">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`
];
extras.forEach(t => {
  if (!html.includes(t)) {
    html = html.replace("</head>", `  ${t}\n</head>`);
  }
});

fs.writeFileSync(HTML_PATH, html);
console.log("gewinnspiel.html aktualisiert");
