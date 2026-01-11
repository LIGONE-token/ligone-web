(async function () {
  const el = document.getElementById("buyValue");
  if (!el) return;

  try {
    const res = await fetch(
      "https://ligone-token.github.io/ligone-web/data/buy-price.json",
      { cache: "no-store" }
    );
    const data = await res.json();

    el.textContent =
      `Für 1 € erhältst du aktuell ca. ${data.ligPerEuro.toLocaleString("de-CH")} LIG1`;
  } catch (e) {
    el.textContent = "Preis derzeit nicht verfügbar";
  }
})();

