import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";

// -------- CONFIG --------
const AMOUNT_PATH = "data/amount.json";
const HTML_PATH = "gewinnspiel.html";
const OG_DIR = "og";
const WIDTH = 1200;
const HEIGHT = 630;

// -------- HELPER --------
function formatEUR(v) {
  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(v) + " €";
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// -------- LOAD AMOUNT --------
if (!fs.existsSync(AMOUNT_PATH)) {
  throw new Error("amount.json fehlt");
}
const { amount } = JSON.parse(fs.readFileSync(AMOUNT_PATH, "utf8"));

// -------- RENDER OG (IDENTISCH ZUR WEBSEITE) --------
fs.mkdirSync(OG_DIR, { recursive: true });
const ts = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const fileName = `jackpot-${ts}.png`;
const outPath = path.join(OG_DIR, fileName);

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// --- Hintergrund (1:1 wie Webseite) ---
ctx.fillStyle = "#fff6df";
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Hintergrundbild (wie im CSS)
const bg = await loadImage("./bg-city.jpg");
ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

// Overlay (wie im CSS)
ctx.fillStyle = "rgba(255,255,255,0.82)";
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// --- Jackpot-Box (1:1 CSS-Werte) ---
const boxWidth = 900;
const boxHeight = 320;
const boxX = (WIDTH - boxWidth) / 2;
const boxY = (HEIGHT - boxHeight) / 2;

ctx.shadowColor = "rgba(0,0,0,0.08)";
ctx.shadowBlur = 20;
ctx.shadowOffsetY = 8;

ctx.fillStyle = "#ffffff";
roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 16);
ctx.fill();

ctx.shadowColor = "transparent";

// --- Label ---
ctx.textAlign = "center";
ctx.fillStyle = "#6b6b6b";
ctx.font = "600 15px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.fillText("Aktueller Jackpot", WIDTH / 2, boxY + 70);

// --- Betrag ---
ctx.fillStyle = "#ff9f1c";
ctx.font = "900 140px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.fillText(formatEUR(amount), WIDTH / 2, boxY + 200);

// --- Schreiben ---
fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
console.log("OG erzeugt:", outPath);

// -------- UPDATE HTML (UNVERÄNDERTES PRINZIP) --------
let html = fs.readFileSync(HTML_PATH, "utf8");

const ogTag = `<meta property="og:image" content="https://ligone-token.github.io/ligone-web/og/${fileName}">`;

if (html.includes('property="og:image"')) {
  html = html.replace(
    /<meta property="og:image"[^>]*>/i,
    ogTag
  );
} else {
  html = html.replace("</head>", `  ${ogTag}\n</head>`);
}

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
