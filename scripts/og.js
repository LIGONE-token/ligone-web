import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";

/* ======================================
   CONFIG
====================================== */
const AMOUNT_PATH = "data/amount.json";
const HTML_PATH = "gewinnspiel.html";
const OG_DIR = "og";
const WIDTH = 1200;
const HEIGHT = 630;

/* ======================================
   LOAD JACKPOT (NUR LESEN!)
====================================== */
if (!fs.existsSync(AMOUNT_PATH)) {
  throw new Error("amount.json fehlt");
}

const data = JSON.parse(fs.readFileSync(AMOUNT_PATH, "utf8"));
const amount = Number(data.amount);

if (!Number.isFinite(amount)) {
  throw new Error("Ungültiger Jackpot-Wert");
}

console.log("🎯 Aktueller Jackpot:", amount);

/* ======================================
   HELPER
====================================== */
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

/* ======================================
   RENDER OG IMAGE
====================================== */
fs.mkdirSync(OG_DIR, { recursive: true });

const fileName = `jackpot-${amount}.png`;
const outPath = path.join(OG_DIR, fileName);

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// Reset
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.globalAlpha = 1;
ctx.shadowColor = "transparent";

// Background
ctx.fillStyle = "#fff6df";
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Background image
const bg = await loadImage(path.resolve("bg-city.jpg"));

const imgRatio = bg.width / bg.height;
const canvasRatio = WIDTH / HEIGHT;

let drawW, drawH, dx, dy;

if (imgRatio > canvasRatio) {
  drawH = HEIGHT;
  drawW = HEIGHT * imgRatio;
  dx = (WIDTH - drawW) / 2;
  dy = HEIGHT - drawH;
} else {
  drawW = WIDTH;
  drawH = WIDTH / imgRatio;
  dx = 0;
  dy = HEIGHT - drawH;
}

ctx.drawImage(bg, dx, dy, drawW, drawH);

// Overlay
ctx.fillStyle = "rgba(255,255,255,0.82)";
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Card
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

// Text
ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillStyle = "#6b6b6b";
ctx.font = "600 15px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.fillText("Aktueller Jackpot", WIDTH / 2, boxY + boxHeight * 0.30);

ctx.fillStyle = "#ff9f1c";
ctx.font = "900 140px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.fillText(formatEUR(amount), WIDTH / 2, boxY + boxHeight * 0.60);

// Write image
fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
console.log("🖼️ OG erzeugt:", outPath);

/* ======================================
   UPDATE HTML OG TAG
====================================== */
let html = fs.readFileSync(HTML_PATH, "utf8");

const ogTag = `<meta property="og:image" content="https://ligone-token.github.io/ligone-web/og/${fileName}">`;

if (html.includes('property="og:image"')) {
  html = html.replace(/<meta property="og:image"[^>]*>/i, ogTag);
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
console.log("🌐 HTML aktualisiert");
