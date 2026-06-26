/* ============================================================
   ABOUT PAGE GALLERY
   Uses the same masonry logic as the welcome page,
   but targets the #about-gallery container.
   ============================================================ */
(function () {
  function renderAboutGallery() {
    var gallery = document.getElementById("about-gallery");
    if (!gallery) return;

    var photos = window.PHOTOS || [];
    if (!photos.length) return;

    // Borrow the logic from detail.js
    var PAD = 5;
    var availW = gallery.clientWidth - (PAD * 2);
    var availH = gallery.clientHeight || 500;

    var NUM_COLS = 3;
    var GAP = 4;
    var colW = (availW - GAP * (NUM_COLS - 1)) / NUM_COLS;
    if (colW < 40) colW = 40;

    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;';

    gallery.innerHTML = '';
    gallery.appendChild(wrap);

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

      var ratios = imgs.map(function(img) {
        if (img.naturalWidth && img.naturalHeight) {
          return img.naturalHeight / img.naturalWidth;
        }
        return 0.7;
      });

      var targetH = availH * 0.95;
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

      var colY = [0, 0, 0];
      var totalImages = imgs.length;

      imgs.forEach(function(img, idx) {
        var isLast = (idx === totalImages - 1);
        var isSecondLast = (idx === totalImages - 2);

        var shortest = 0;

        if (isLast) {
          shortest = 2;
        } else if (isSecondLast) {
          if (colY[2] < colY[0] || colY[2] < colY[1]) {
            shortest = 2;
          } else {
            shortest = colY[0] <= colY[1] ? 0 : 1;
          }
        } else {
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
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.4s ease';

        colY[shortest] += h + GAP;
      });

      var maxColHeight = Math.max.apply(null, colY);
      if (maxColHeight < availH) {
        var offsetY = (availH - maxColHeight) / 2;
        imgs.forEach(function(img) {
          var currentTop = parseFloat(img.style.top);
          img.style.top = (currentTop + offsetY).toFixed(1) + 'px';
        });
      }

      showAllImages();
    }

    photos.forEach(function(src) {
      var img = document.createElement('img');
      img.src = src;
      img.style.cssText = 'position:absolute;object-fit:cover;display:block;border-radius:2px;';

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

  // Expose the function globally so router.js can call it
  window.__renderAboutGallery = renderAboutGallery;

})();