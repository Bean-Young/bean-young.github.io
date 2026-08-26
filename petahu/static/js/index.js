window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];
function preloadInterpolationImages() {
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/' + String(i).padStart(6, '0') + '.jpg';
    interp_images[i] = new Image();
    interp_images[i].src = path;
  }
}

function setInterpolationImage(i) {
  var image = interp_images[i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper').empty().append(image);
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    // 初始化轮播图并设置自动播放选项
    var carouselOptions = {
      slidesToScroll: 1,
      slidesToShow: 1,
      loop: true,
      infinite: true,
      autoplay: true,  // 开启自动播放
      autoplaySpeed: 3000  // 自动播放速度，单位为毫秒
    };

    // 初始化指定ID的轮播图
    var carousels = document.querySelector('#results-carousel') ? bulmaCarousel.attach('#results-carousel', carouselOptions) : [];

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages();

    $('#interpolation-slider').on('input', function(event) {
      setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();

})


function setupAutoScrollingRails() {
  document.querySelectorAll('[data-auto-scroll]').forEach(function(rail) {
    var direction = 1;
    var paused = false;
    var lastTime = 0;
    var drag = { active: false, scrolling: false, startX: 0, startY: 0, scrollLeft: 0, pointerId: null };

    function maxScroll() {
      return Math.max(0, rail.scrollWidth - rail.clientWidth);
    }

    function animate(time) {
      if (!lastTime) lastTime = time;
      var elapsed = Math.min(time - lastTime, 80);
      lastTime = time;
      var max = maxScroll();
      if (!paused && !drag.active && max > 0) {
        rail.scrollLeft += direction * elapsed * 0.02;
        if (rail.scrollLeft >= max - 1) direction = -1;
        if (rail.scrollLeft <= 1) direction = 1;
      }
      window.requestAnimationFrame(animate);
    }

    rail.addEventListener('pointerenter', function() { paused = true; });
    rail.addEventListener('pointerleave', function() { if (!drag.active) paused = false; });
    rail.addEventListener('focusin', function() { paused = true; });
    rail.addEventListener('focusout', function() { paused = false; });
    rail.addEventListener('pointerdown', function(event) {
      if (event.button !== undefined && event.button !== 0) return;
      drag.active = true;
      drag.scrolling = false;
      drag.startX = event.clientX;
      drag.startY = event.clientY;
      drag.scrollLeft = rail.scrollLeft;
      drag.pointerId = event.pointerId;
      paused = true;
    });
    rail.addEventListener('pointermove', function(event) {
      if (!drag.active || event.pointerId !== drag.pointerId) return;
      var deltaX = event.clientX - drag.startX;
      var deltaY = event.clientY - drag.startY;
      if (!drag.scrolling && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        drag.scrolling = true;
        rail.classList.add('is-dragging');
        rail.setPointerCapture(event.pointerId);
      }
      if (drag.scrolling) {
        event.preventDefault();
        rail.scrollLeft = drag.scrollLeft - deltaX;
      }
    });
    function stopDragging(event) {
      if (!drag.active || (event && event.pointerId !== drag.pointerId)) return;
      if (drag.scrolling && rail.hasPointerCapture(drag.pointerId)) rail.releasePointerCapture(drag.pointerId);
      rail.classList.remove('is-dragging');
      drag.active = false;
      drag.scrolling = false;
      paused = false;
    }
    rail.addEventListener('pointerup', stopDragging);
    rail.addEventListener('pointercancel', stopDragging);
    window.requestAnimationFrame(animate);
  });
}

function setupCredentialLightbox() {
  var lightbox = document.getElementById('credential-lightbox');
  if (!lightbox) return;
  var lightboxImage = lightbox.querySelector('img');
  function close() {
    lightbox.hidden = true;
    lightboxImage.src = '';
  }
  document.querySelectorAll('.credential-card img, .media-rail-item img').forEach(function(image) {
    var imageLink = image.closest('a');
    if (imageLink) {
      imageLink.addEventListener('click', function(event) { event.preventDefault(); });
    }
    image.addEventListener('dblclick', function(event) {
      event.preventDefault();
      event.stopPropagation();
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      lightbox.hidden = false;
    });
  });
  lightbox.addEventListener('click', function(event) {
    if (event.target === lightbox || event.target.classList.contains('credential-lightbox-close')) close();
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && !lightbox.hidden) close();
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setupAutoScrollingRails();
  setupCredentialLightbox();
});
