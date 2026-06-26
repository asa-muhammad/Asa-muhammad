/* ============================================================
   PIXEL DISSOLVE TRANSITION
   A blocky, deliberately rough pixel-by-pixel wipe between
   page changes. Two phases: dissolve OUT (reveal paper colour
   in random blocks until old content is fully obscured), then
   the router swaps DOM content, then dissolve IN (random
   blocks of the cover disappear until clear).
   ============================================================ */
(function () {
  var canvas = document.getElementById("dissolve-canvas");
  var ctx = canvas.getContext("2d");
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  // block size in CSS px — chunky, deliberately low-res like an
  // old monitor / Windows 3.1 "dissolve" wipe, not a smooth fade
  var BLOCK = 3;

  var cols, rows, order;

  function resize() {
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cols = Math.ceil(window.innerWidth / BLOCK);
    rows = Math.ceil(window.innerHeight / BLOCK);
  }
  resize();
  window.addEventListener("resize", resize);

  function buildShuffledOrder() {
    var total = cols * rows;
    var arr = new Array(total);
    for (var i = 0; i < total; i++) arr[i] = i;
    // Fisher-Yates shuffle for a true "random static" dissolve
    for (var j = arr.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = arr[j];
      arr[j] = arr[k];
      arr[k] = tmp;
    }
    return arr;
  }

  function getPaperColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--paper")
      .trim() || "#EDEAE0";
  }

  //generates random pixel color value
  function randRGB() {
  return Math.floor(Math.random() * 256);
}
  function getRandomColor(){
    return "#"+(randRGB()).toString(16)+(randRGB()).toString(16)+(randRGB()).toString(16);
  }

  // draws `count` blocks (by shuffled order, up to index) filled,
  // simulating pixels turning "on"
  function paintBlocks(orderArr, uptoIndex) {
    for (var i = 0; i < uptoIndex; i++) {
      ctx.fillStyle = getRandomColor();
      var idx = orderArr[i];
      var col = idx % cols;
      var row = Math.floor(idx / cols);
      ctx.fillRect(col * BLOCK, row * BLOCK, BLOCK, BLOCK);
    }
  }

  /**
   * Runs the dissolve OUT phase (cover the screen), calls
   * `onCovered` at full coverage, then runs dissolve IN
   * (reveal). durations are per-phase in ms.
   */
  function runDissolve(onCovered, opts) {
    opts = opts || {};
    var outMs = opts.outMs || 260;
    var inMs = opts.inMs || 340;
    var color = opts.color || getPaperColor();

    order = buildShuffledOrder();
    var total = order.length;

    canvas.style.display = "block";
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    var startOut = null;

    function stepOut(ts) {
      if (!startOut) startOut = ts;
      var p = Math.min(1, (ts - startOut) / outMs);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      paintBlocks(order, Math.floor(p * total), getRandomColor());
      if (p < 1) {
        requestAnimationFrame(stepOut);
      } else {
        // fully covered — swap content now
        if (typeof onCovered === "function") onCovered();
        requestAnimationFrame(function (ts2) {
          stepIn(ts2, true);
        });
      }
    }

    var startIn = null;
    function stepIn(ts, reset) {
      if (reset || !startIn) startIn = ts;
      var p = Math.min(1, (ts - startIn) / inMs);
      // reveal: draw full cover, then "remove" blocks in same
      // shuffled order so pixels turn off individually
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var remaining = total - Math.floor(p * total);
      paintBlocks(order, remaining, color);
      if (p < 1) {
        requestAnimationFrame(stepIn);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        canvas.style.display = "none";
      }
    }

    requestAnimationFrame(stepOut);
  }

  // expose globally for the router to call
  window.__pixelDissolve = runDissolve;
})();
