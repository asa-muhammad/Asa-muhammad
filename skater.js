/* ============================================================
   SKATER MODE — canvas-based fisheye warp
   
   Why canvas instead of SVG filter:
   SVG filters applied to a scrollable container only composite
   the visible clip region. Scrolled content inside child panels
   is in separate paint layers that the filter never sees.
   Applying the filter to <html> breaks because filterUnits=
   objectBoundingBox is undefined on the root element.

   Solution: when skater mode is on, we hide #page-wrap, then
   each animation frame we use html() → SVG foreignObject →
   canvas drawImage... except that's blocked by CORS tainting.

   ACTUAL solution: We use a displacement map computed in canvas
   2D directly. Each frame:
     1. Use getComputedStyle + getBoundingClientRect to snapshot
        #page-wrap into an OffscreenCanvas via drawImage on a
        temporary iframe... still tainted.

   REAL actual solution that works cross-origin-free:
   Keep the SVG filter but apply it to a fixed <canvas> overlay
   that we paint every rAF using ctx.drawImage(video) where the
   video srcObject is a MediaStream from captureStream() on a
   second canvas that we... 

   OK. The only reliable cross-browser approach without a server:
   Apply the CSS filter to #page-wrap AND fix the scroll problem
   by making the panels not internally scroll — instead, let the
   whole #page-wrap scroll, so all content is in one scroll layer
   that the filter sees. We toggle this on skater activate.

   When skater mode turns ON:
   - #page-wrap switches from overflow:hidden / height:100vh
     to overflow-y:auto / height:auto / min-height:100vh
   - .app-root and .detail-panel lose their individual
     overflow:auto / height:100% so they expand naturally
   - The SVG filter on #page-wrap now sees ALL painted content
   - position:fixed children (instrument panel, crt overlay,
     dissolve canvas) still composite correctly

   When skater mode turns OFF: classes are removed, layout
   returns to the two-panel scroll model.
   ============================================================ */
(function () {
  var btn  = document.getElementById("skater-toggle");
  var wrap = document.getElementById("page-wrap");
  if (!btn || !wrap) return;

  var STORAGE_KEY = "skaterModeOn";
  var on = false;

  try { on = sessionStorage.getItem(STORAGE_KEY) === "1"; } catch (e) {}

  function apply() {
    // "skater-on" triggers the SVG filter via CSS (kept in style.css)
    // "skater-scroll" flattens the scroll model so the filter sees everything
    wrap.classList.toggle("skater-on", on);
    wrap.classList.toggle("skater-scroll", on);

    var appRoot   = document.getElementById("app-root");
    var detailPanel = document.getElementById("detail-panel");
    if (appRoot)    appRoot.classList.toggle("skater-scroll-child", on);
    if (detailPanel) detailPanel.classList.toggle("skater-scroll-child", on);

    btn.classList.toggle("is-active", on);
    btn.textContent = on ? "skater mode: on" : "skater mode";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  btn.addEventListener("click", function () {
    on = !on;
    apply();
    try { sessionStorage.setItem(STORAGE_KEY, on ? "1" : "0"); } catch (e) {}
  });

  apply();
})();
