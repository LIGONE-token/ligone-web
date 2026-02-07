import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  // 1) Teilnehmer laden
  const { data: participants, error: pErr } = await supabase
    .from("participants")
    .select("id, wallet");

  if (pErr) throw pErr;
  if (!participants || participants.length === 0) {
    console.log("Keine Teilnehmer – Abbruch.");
    return;
  }

  // 2) Fairer Zufall
  const seed = `${Date.now()}|${participants.length}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const idx = parseInt(hash.slice(0, 8), 16) % participants.length;
  const winner = participants[idx];

  // 3) Ergebnis speichern
  const { error: dErr } = await supabase.from("draws").insert([{
    draw_time: new Date().toISOString(),
    winner_wallet: winner.wallet,
    participant_count: participants.length
  }]);
  if (dErr) throw dErr;

  // 4) Reset: Teilnehmer leeren
  const { error: delErr } = await supabase
    .from("participants")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all workaround
  if (delErr) throw delErr;

  console.log("Ziehung OK:", winner.wallet);
}

main().catch(e => {
  console.error("Ziehung FEHLER:", e);
  process.exit(1);
});
