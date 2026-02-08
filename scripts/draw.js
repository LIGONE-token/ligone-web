import fs from "fs";

/* ======================================
   CONFIG
====================================== */
const AMOUNT_PATH = "data/amount.json";
const BASE_AMOUNT = 10;   // Reset bei Gewinner
const DAILY_INC = 10;     // Erhöhung ohne Gewinner

/* ======================================
   ZIEHUNGS-ERGEBNIS (JETZT NOCH MANUELL)
   👉 false = kein Gewinner
   👉 true  = Gewinner
   (später automatisierbar)
====================================== */
const winnerFound = false;   // ← HEUTE HIER ÄNDERN, WENN GEWINNER

/* ======================================
   LOAD CURRENT STATE
====================================== */
let data;
if (fs.existsSync(AMOUNT_PATH)) {
  data = JSON.parse(fs.readFileSync(AMOUNT_PATH, "utf8"));
} else {
  data = { amount: BASE_AMOUNT };
}

/* ======================================
   JACKPOT-ENTSCHEIDUNG (EINZIGE LOGIK)
====================================== */
if (winnerFound === true) {
  data.amount = BASE_AMOUNT;
  console.log("🎉 Gewinner → Jackpot RESET auf", BASE_AMOUNT);
} else {
  data.amount = Number(data.amount || BASE_AMOUNT) + DAILY_INC;
  console.log("➕ Kein Gewinner → Jackpot ERHÖHT auf", data.amount);
}

/* ======================================
   SAVE STATE (DAS IST ENTSCHEIDEND)
====================================== */
data.updatedAt = new Date().toISOString();

fs.writeFileSync(AMOUNT_PATH, JSON.stringify(data, null, 2));
console.log("💾 Jackpot gespeichert:", data.amount);
