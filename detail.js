/* ============================================================
   DETAIL PANEL
   Listens for clicks on .article-link elements anywhere in
   #app-root. Renders the full article into #detail-panel
   without a page navigation. Also clears / resets the panel
   when navigating to a non-writing page.
   ============================================================ */
(function () {
  var panel = document.getElementById("detail-panel");
  if (!panel) return;

  var EMPTY_HTML =
    '<div class="detail-empty">' +
    '<span class="detail-empty-text">select a piece to read</span>' +
    '</div>';

  function showEmpty() {
    panel.innerHTML = EMPTY_HTML;
  }

  function showArticle(slug) {
    var art = window.ARTICLES && window.ARTICLES[slug];
    if (!art) { showEmpty(); return; }

    panel.innerHTML =
      '<div class="detail-content">' +
        '<p class="detail-kicker">' + art.tag + ' &mdash; ' + art.date + '</p>' +
        '<h2 class="detail-title">' + art.title + '</h2>' +
        '<hr class="detail-rule">' +
        '<div class="detail-body">' + art.body + '</div>' +
      '</div>';

    panel.scrollTop = 0;
  }

  // highlight the active listing row
  function setActiveRow(slug) {
    document.querySelectorAll(".listing-row").forEach(function (row) {
      row.classList.toggle("listing-row-active", row.getAttribute("data-article") === slug);
    });
  }

  function showMiscItem(key) {
    var item = window.MISC_ITEMS && window.MISC_ITEMS[key];
    if (!item) { showEmpty(); return; }

    // Reset panel styles for text mode
    panel.style.overflow = '';
    panel.style.padding = '';

    panel.innerHTML =
      '<div class="detail-content" style="padding:24px 20px 56px 24px;">' +
        '<p class="detail-kicker">miscellaneous</p>' +
        '<h2 class="detail-title">' + item.label + '</h2>' +
        '<hr class="detail-rule">' +
        '<div class="detail-body">' + item.body + '</div>' +
      '</div>';

    panel.scrollTop = 0;
  }

  function setActiveMiscCard(key) {
    document.querySelectorAll(".misc-card-btn").forEach(function(card) {
      card.classList.toggle("misc-card-active", card.getAttribute("data-misc") === key);
    });
  }

  // delegate click from app-root (content may be re-rendered by router)
  var root = document.getElementById("app-root");
  root.addEventListener("click", function (e) {
    var link = e.target.closest(".article-link");
    if (link) {
      e.preventDefault();
      var slug = link.getAttribute("data-article");
      showArticle(slug);
      setActiveRow(slug);
      return;
    }
    var miscCard = e.target.closest(".misc-card-btn");
    if (miscCard) {
      e.preventDefault();
      var key = miscCard.getAttribute("data-misc");
      showMiscItem(key);
      setActiveMiscCard(key);
    }
  });

  root.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === " ") {
      var miscCard = e.target.closest(".misc-card-btn");
      if (miscCard) {
        e.preventDefault();
        var key = miscCard.getAttribute("data-misc");
        showMiscItem(key);
        setActiveMiscCard(key);
      }
    }
  });

  function showPhotoGallery() {
  var photos = window.PHOTOS || [];
  if (!photos.length) { showEmpty(); return; }

  // Reset panel styles for gallery mode
  panel.style.overflow = 'hidden';
  panel.style.padding = '5px';

  var PAD = 5;
  var availW = panel.clientWidth - (PAD * 2);
  var availH = panel.clientHeight || 700;

  var NUM_COLS = 3;
  var GAP = 4;
  var colW = (availW - GAP * (NUM_COLS - 1)) / NUM_COLS;
  if (colW < 40) colW = 40;

  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;';

  // Clear any previous content
  panel.innerHTML = '';
  panel.appendChild(wrap);

  var imgs = [];
  var loadedCount = 0;
  var totalPhotos = photos.length;
  var placed = false;
  var imagesReady = false;

  function colX(index) {
    return index * (colW + GAP);
  }

  function showAllImages() {
    // Fade in all images at once
    imgs.forEach(function(img) {
      img.style.opacity = '1';
    });
  }

  function placeAll() {
    if (placed) return;
    if (imgs.length === 0) return;

    // Check if all images have loaded
    var allLoaded = imgs.every(function(img) {
      return img.naturalWidth && img.naturalHeight;
    });

    // If not all loaded, wait
    if (!allLoaded && loadedCount < totalPhotos) {
      return;
    }

    placed = true;

    // Get aspect ratios, using defaults for any that didn't load
    var ratios = imgs.map(function(img) {
      if (img.naturalWidth && img.naturalHeight) {
        return img.naturalHeight / img.naturalWidth;
      }
      return 0.7; // default ratio
    });

    var targetH = availH * 0.95;

    // Find the best scale factor
    var bestScale = 0.1;
    for (var scale = 0.1; scale <= 2; scale += 0.01) {
      var colHeights = [0, 0, 0];
      var maxColHeight = 0;

      imgs.forEach(function(_, idx) {
        var shortest = 0;
        for (var c = 1; c < NUM_COLS; c++) {
          if (colHeights[c] < colHeights[shortest]) shortest = c;
        }
        var h = colW * ratios[idx] * scale;
        colHeights[shortest] += h + GAP;
        if (colHeights[shortest] > maxColHeight) {
          maxColHeight = colHeights[shortest];
        }
      });

      if (maxColHeight <= targetH) {
        bestScale = scale;
      } else {
        break;
      }
    }

    // Place images with the best scale
    var colY = [0, 0, 0];
    var totalImages = imgs.length;

    imgs.forEach(function(img, idx) {
      // For the last image, force it to the rightmost column (index 2)
      var isLast = (idx === totalImages - 1);
      var isSecondLast = (idx === totalImages - 2);

      var shortest = 0;

      if (isLast) {
        // Force the last image to column 2 (rightmost)
        shortest = 2;
      } else if (isSecondLast) {
        // Prefer column 2, but if it's too tall, use column 1
        if (colY[2] < colY[0] || colY[2] < colY[1]) {
          shortest = 2;
        } else {
          // Find the shortest among columns 0 and 1
          shortest = colY[0] <= colY[1] ? 0 : 1;
        }
      } else {
        // Normal behavior for all other images: find the shortest column
        for (var c = 1; c < NUM_COLS; c++) {
          if (colY[c] < colY[shortest]) shortest = c;
        }
      }

      var h = colW * ratios[idx] * bestScale;
      if (h < 20) h = 20;

      img.style.position = 'absolute';
      img.style.left = colX(shortest).toFixed(1) + 'px';
      img.style.top = colY[shortest].toFixed(1) + 'px';
      img.style.width = colW.toFixed(1) + 'px';
      img.style.height = h.toFixed(1) + 'px';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      img.style.borderRadius = '2px';

      colY[shortest] += h + GAP;
    });

    // Center vertically if needed
    var maxColHeight = Math.max.apply(null, colY);
    if (maxColHeight < availH) {
      var offsetY = (availH - maxColHeight) / 2;
      imgs.forEach(function(img) {
        var currentTop = parseFloat(img.style.top);
        img.style.top = (currentTop + offsetY).toFixed(1) + 'px';
      });
    }

    // Now that all images are placed, show them all at once
    showAllImages();
  }

  // Create all image elements - start with opacity 0
  photos.forEach(function(src, index) {
    var img = document.createElement('img');
    img.src = src;
    // Start fully hidden - opacity 0, no transition yet
    img.style.cssText = 'position:absolute;object-fit:cover;display:block;border-radius:2px;opacity:0;';
    img.dataset.index = index;

    img.onload = function() {
      loadedCount++;
      if (loadedCount === totalPhotos) {
        placeAll();
      }
    };

    img.onerror = function() {
      loadedCount++;
      if (loadedCount === totalPhotos) {
        placeAll();
      }
    };

    // Check if already loaded (cached)
    if (img.complete && img.naturalWidth) {
      loadedCount++;
    }

    wrap.appendChild(img);
    imgs.push(img);
  });

  // If all images are already loaded (from cache), place them
  if (loadedCount === totalPhotos && totalPhotos > 0) {
    placeAll();
  }

  // Force placement after a timeout even if images don't load
  var timeoutId = setTimeout(function() {
    if (!placed) {
      placeAll();
    }
  }, 2000);

  // Clean up timeout if all images load
  var origPlaceAll = placeAll;
  placeAll = function() {
    clearTimeout(timeoutId);
    origPlaceAll.call(this);
  };
}

function showAboutGallery() {
var photos = window.ABOUT_PHOTOS || [];
if (!photos.length) { showEmpty(); return; }

// Allow scrolling since the masonry will extend beyond the viewport height
panel.style.overflow = 'auto';
panel.style.padding = '5px';

var PAD = 5;
var availW = panel.clientWidth - (PAD * 2);

var NUM_COLS = 3;
var GAP = 4;
var colW = (availW - GAP * (NUM_COLS - 1)) / NUM_COLS;
if (colW < 40) colW = 40;

var wrap = document.createElement('div');
// Wrap height will expand based on the tallest column
wrap.style.cssText = 'position:relative;width:100%;overflow:hidden;';

panel.innerHTML = '';
panel.appendChild(wrap);

var imgs = [];
var loadedCount = 0;
var totalPhotos = photos.length;
var placed = false;

function colX(index) {
  return index * (colW + GAP);
}

function showAllImages() {
  imgs.forEach(function(img) {
    img.style.opacity = '1';
  });
}

function placeAll() {
  if (placed) return;
  if (imgs.length === 0) return;

  var allLoaded = imgs.every(function(img) {
    return img.naturalWidth && img.naturalHeight;
  });

  if (!allLoaded && loadedCount < totalPhotos) {
    return;
  }

  placed = true;

  // Track the cumulative Y position (bottom height) for each of the 3 columns
  var colY = [0, 0, 0];
  var totalImages = imgs.length;

  imgs.forEach(function(img) {
    // Calculate the exact height based on the image's native aspect ratio
    var ratio = (img.naturalWidth && img.naturalHeight) ? (img.naturalHeight / img.naturalWidth) : 0.7;
    var h = colW * ratio;
    if (h < 20) h = 20;

    // Find the column with the shortest current height
    var shortest = 0;
    for (var c = 1; c < NUM_COLS; c++) {
      if (colY[c] < colY[shortest]) shortest = c;
    }

    img.style.position = 'absolute';
    img.style.left = colX(shortest).toFixed(1) + 'px';
    img.style.top = colY[shortest].toFixed(1) + 'px';
    img.style.width = colW.toFixed(1) + 'px';
    img.style.height = h.toFixed(1) + 'px';

    // Because the height is calculated exactly from the aspect ratio,
    // 'cover' will fill the box 100% without cropping a single pixel.
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.style.borderRadius = '2px';
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';

    // Push the bottom of that column down
    colY[shortest] += h + GAP;
  });

  // Stretch the wrapper so the panel creates a scrollbar
  var maxColHeight = Math.max.apply(null, colY);
  wrap.style.height = maxColHeight.toFixed(1) + 'px';

  showAllImages();
}

photos.forEach(function(src) {
  var img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'position:absolute;object-fit:cover;display:block;border-radius:2px;opacity:0;';

  img.onload = function() {
    loadedCount++;
    if (loadedCount === totalPhotos) {
      placeAll();
    }
  };

  img.onerror = function() {
    loadedCount++;
    if (loadedCount === totalPhotos) {
      placeAll();
    }
  };

  if (img.complete && img.naturalWidth) {
    loadedCount++;
  }

  wrap.appendChild(img);
  imgs.push(img);
});

if (loadedCount === totalPhotos && totalPhotos > 0) {
  placeAll();
}

var timeoutId = setTimeout(function() {
  if (!placed) {
    placeAll();
  }
}, 2000);

var origPlaceAll = placeAll;
placeAll = function() {
  clearTimeout(timeoutId);
  origPlaceAll.call(this);
};
}
function showJobsGallery() {
var photos = window.JOBS_PHOTOS || [];
if (!photos.length) { showEmpty(); return; }

panel.style.overflow = 'auto';
panel.style.padding = '5px';

var PAD = 5;
var availW = panel.clientWidth - (PAD * 2);

var NUM_COLS = 3;
var GAP = 4;
var colW = (availW - GAP * (NUM_COLS - 1)) / NUM_COLS;
if (colW < 40) colW = 40;

var wrap = document.createElement('div');
wrap.style.cssText = 'position:relative;width:100%;overflow:hidden;';

panel.innerHTML = '';
panel.appendChild(wrap);

var imgs = [];
var loadedCount = 0;
var totalPhotos = photos.length;
var placed = false;

function colX(index) {
  return index * (colW + GAP);
}

function showAllImages() {
  imgs.forEach(function(img) {
    img.style.opacity = '1';
  });
}

function placeAll() {
  if (placed) return;
  if (imgs.length === 0) return;

  var allLoaded = imgs.every(function(img) {
    return img.naturalWidth && img.naturalHeight;
  });

  if (!allLoaded && loadedCount < totalPhotos) {
    return;
  }

  placed = true;

  var colY = [0, 0, 0];
  var totalImages = imgs.length;

  imgs.forEach(function(img) {
    var ratio = (img.naturalWidth && img.naturalHeight) ? (img.naturalHeight / img.naturalWidth) : 0.7;
    var h = colW * ratio;
    if (h < 20) h = 20;

    var shortest = 0;
    for (var c = 1; c < NUM_COLS; c++) {
      if (colY[c] < colY[shortest]) shortest = c;
    }

    img.style.position = 'absolute';
    img.style.left = colX(shortest).toFixed(1) + 'px';
    img.style.top = colY[shortest].toFixed(1) + 'px';
    img.style.width = colW.toFixed(1) + 'px';
    img.style.height = h.toFixed(1) + 'px';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.style.borderRadius = '2px';
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';

    colY[shortest] += h + GAP;
  });

  var maxColHeight = Math.max.apply(null, colY);
  wrap.style.height = maxColHeight.toFixed(1) + 'px';

  showAllImages();
}

photos.forEach(function(src) {
  var img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'position:absolute;object-fit:cover;display:block;border-radius:2px;opacity:0;';

  img.onload = function() {
    loadedCount++;
    if (loadedCount === totalPhotos) {
      placeAll();
    }
  };

  img.onerror = function() {
    loadedCount++;
    if (loadedCount === totalPhotos) {
      placeAll();
    }
  };

  if (img.complete && img.naturalWidth) {
    loadedCount++;
  }

  wrap.appendChild(img);
  imgs.push(img);
});

if (loadedCount === totalPhotos && totalPhotos > 0) {
  placeAll();
}

var timeoutId = setTimeout(function() {
  if (!placed) {
    placeAll();
  }
}, 2000);

var origPlaceAll = placeAll;
placeAll = function() {
  clearTimeout(timeoutId);
  origPlaceAll.call(this);
};
}
  // when the router changes pages, reset or show gallery
  window.__onPageChange = function (pageKey) {
    if (pageKey === 'home' || !pageKey) {
      showPhotoGallery(); // Existing home page gallery
    } else if (pageKey === 'about') {
      showAboutGallery(); // New about page gallery with these 4 images
    } else if (pageKey === 'jobs') {
      showJobsGallery(); // New jobs page gallery
    } else {
      showEmpty();
    }
  };

  // show gallery on home, empty otherwise — router fires __onPageChange after DOM ready
  // but we also do an initial paint here in case router already ran
  (function() {
    var hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash || hash === 'home') {
      // delay slightly so PHOTOS is populated
      setTimeout(showPhotoGallery, 0);
    } else {
      showEmpty();
    }
  })();
})();
