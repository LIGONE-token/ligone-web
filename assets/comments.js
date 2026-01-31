/* =====================================================
   LIGONE – Page-specific Comments (Giscus)
   One page = one discussion (automatic)
===================================================== */
(function () {
  // 1) Seite eindeutig identifizieren
  const pageKey = window.location.pathname
    .replace(/\/$/, "")
    .toLowerCase();

  // 2) Container finden
  const container = document.currentScript.parentElement;

  // 3) Giscus laden
  const s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.async = true;

  // 4) Repo-spezifische Einstellungen
  s.setAttribute("data-repo", "ligone-token/ligone-web");
  s.setAttribute("data-repo-id", "REPO_ID_HIER_EINTRAGEN");
  s.setAttribute("data-category", "Pages");
  s.setAttribute("data-category-id", "CATEGORY_ID_HIER_EINTRAGEN");

  // 5) ENTSCHEIDEND: Seitenpfad als Diskussions-ID
  s.setAttribute("data-mapping", "specific");
  s.setAttribute("data-term", pageKey);

  // 6) UI / Verhalten
  s.setAttribute("data-lang", "de");
  s.setAttribute("data-theme", "light");
  s.setAttribute("data-reactions-enabled", "1");
  s.setAttribute("data-input-position", "top");
  s.crossOrigin = "anonymous";

  container.appendChild(s);
})();
