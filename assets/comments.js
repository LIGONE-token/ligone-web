(function () {
  const host = document.currentScript.parentElement;
  if (!host) return;

  const s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.async = true;

  s.setAttribute("data-repo", "ligone-token/ligone-web");
  s.setAttribute("data-mapping", "pathname");
  s.setAttribute("data-input-position", "top");
  s.setAttribute("data-reactions-enabled", "1");
  s.setAttribute("data-theme", "dark");
  s.setAttribute("crossorigin", "anonymous");

  host.appendChild(s);
})();
