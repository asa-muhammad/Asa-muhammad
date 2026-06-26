/* ============================================================
   CLOCK + TRIPLE CALENDAR TICKER
   Uses native Intl.DateTimeFormat calendar support — no deps.
   ============================================================ */
(function () {
  var timeEl = document.getElementById("ip-time");
  var gregEl = document.getElementById("ip-greg");
  var hebEl = document.getElementById("ip-heb");
  var islEl = document.getElementById("ip-isl");
  var chinEL = document.getElementById("ip-chin")

  var timeFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  var gregFmt = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  var hebFmt = new Intl.DateTimeFormat("en-US", {
    calendar: "hebrew",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // islamic-civil gives a stable tabular calculation rather than
  // moonsighting-dependent variants; labeled clearly below.
  var islFmt = new Intl.DateTimeFormat("en-US", {
    calendar: "islamic-civil",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  var chinFmt = new Intl.DateTimeFormat("en-US", {
    calendar: "chinese",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  function tick() {
    var now = new Date();
    timeEl.textContent = timeFmt.format(now);
    gregEl.textContent = gregFmt.format(now).toUpperCase();
    hebEl.textContent = hebFmt.format(now).replace(" AM", "").toUpperCase();
    islEl.textContent = islFmt.format(now).replace(" AH", "").toUpperCase();
    chinEL.textContent = chinFmt.format(now).toUpperCase();
  }

  tick();
  setInterval(tick, 1000);

  // footer year + a fake "visitor counter" that increments
  // slowly to sell the bit, persisted per-session only
  var yearEl = document.getElementById("year-now");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var counterEl = document.getElementById("visitor-count");
  if (counterEl) {
    var base = 4127 + Math.floor(Math.random() * 40);
    counterEl.textContent = String(base).padStart(6, "0");
  }
})();
