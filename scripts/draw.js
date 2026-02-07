import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const AMOUNT_PATH = "data/amount.json";

async function main() {

  // ===============================
  // 1) Teilnehmer laden
  // ===============================
  const { data: participants, error: pErr } = await supabase
    .from("participants")
    .select("id, wallet");

  if (pErr) throw pErr;

  let winnerWallet = null;

  // ===============================
  // 2) Ziehung (NUR wenn Teilnehmer)
  // ===============================
  if (participants && participants.length > 0) {

    const seed = `${Date.now()}|${participants.length}`;
    const hash = crypto.createHash("sha256").update(seed).digest("hex");
    const index = parseInt(hash.slice(0, 8), 16) % participants.length;
    const winner = participants[index];
    winnerWallet = winner.wallet;

    // Gewinner speichern
    const { error: dErr } = await supabase
      .from("draws")
      .insert([{
        draw_time: new Date().toISOString(),
        winner_wallet: winner.wallet,
        participant_count: participants.length
      }]);

    if (dErr) throw dErr;

    // NUR Gewinner aus participants entfernen
    const { error: delErr } = await supabase
      .from("participants")
      .delete()
      .eq("id", winner.id);

    if (delErr) throw delErr;

    console.log("✅ Ziehung erfolgreich. Gewinner:", winner.wallet);

  } else {
    console.log("ℹ️ Keine Teilnehmer – keine Ziehung.");
  }

  // ===============================
  // 3) JACKPOT-UPDATE (IMMER!)
  // ===============================
  fs.mkdirSync("data", { recursive: true });

  let amount = 10;
  if (fs.existsSync(AMOUNT_PATH)) {
    amount = Number(JSON.parse(fs.readFileSync(AMOUNT_PATH, "utf8")).amount);
  }

  if (winnerWallet !== null) {
    // erfolgreiche Ziehung
    amount = 10;
    console.log("🎰 Jackpot reset auf 10 (Gewinner vorhanden)");
  } else {
    // KEINE Ziehung → +10
    amount += 10;
    console.log("🎰 Keine Ziehung → Jackpot +10");
  }

  fs.writeFileSync(
    AMOUNT_PATH,
    JSON.stringify({ amount }, null, 2)
  );

  console.log("💾 Neuer Jackpot:", amount);
}

// ===============================
main().catch(err => {
  console.error("❌ Ziehung fehlgeschlagen:", err);
  process.exit(1);
});
