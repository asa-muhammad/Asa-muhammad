/* ============================================================
   ROUTER
   Tiny hash-based router. On every navigation it triggers the
   pixel dissolve: cover screen -> swap #app-root content while
   fully covered -> uncover. Falls back to an instant swap if
   the dissolve script failed to load for any reason.
   ============================================================ */
(function () {
  var root = document.getElementById("app-root");
  var navLinks = document.querySelectorAll(".site-nav a[data-page]");

  function routeFromHash() {
    var hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash) return "home";
    if (window.PAGES[hash]) return hash;
    return "home";
  }

  function setActiveNav(pageKey) {
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-page") === pageKey);
    });
  }

  function renderPage(pageKey, opts) {
    opts = opts || {};
    var page = window.PAGES[pageKey] || window.PAGES.home;

    var renderNow = function () {
      root.innerHTML =
        '<p class="page-kicker">' + page.kicker + '</p>' +
        '<h1 class="page-title">' + page.title + '</h1>' +
        '<hr class="page-rule">' +
        '<div class="prose-wrap">' + page.html + '</div>';
      setActiveNav(pageKey);
      if (typeof window.__onPageChange === "function") window.__onPageChange(pageKey);
      if (!opts.skipScroll) window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    };

    if (typeof window.__pixelDissolve === "function" && !opts.noDissolve) {
      window.__pixelDissolve(renderNow);
    } else {
      renderNow();
    }
  }

  function handleHashChange() {
    var pageKey = routeFromHash();
    renderPage(pageKey);
  }

  window.addEventListener("hashchange", handleHashChange);

  // initial load — no dissolve on first paint, just show it
  document.addEventListener("DOMContentLoaded", function () {
    var pageKey = routeFromHash();
    renderPage(pageKey, { noDissolve: true });
  });
})();
