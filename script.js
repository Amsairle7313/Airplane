(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var track     = document.getElementById('track');
  var windowHole = document.getElementById('windowHole');
  var windowBezel = document.getElementById('windowBezel');
  var wing      = document.getElementById('wing');
  var clouds    = document.getElementById('clouds');
  var cloudAnims = clouds.querySelectorAll('.cloud-anim');
  var cloudWarms = clouds.querySelectorAll('.cloud-warm');
  var ground    = document.getElementById('ground');
  var skyWarm   = document.getElementById('skyWarm');
  var sun       = document.getElementById('sun');
  var hint      = document.getElementById('hint');
  var heroTitle = document.getElementById('heroTitle');
  var cap1 = document.getElementById('cap1');
  var cap2 = document.getElementById('cap2');
  var cap3 = document.getElementById('cap3');
  var cap4 = document.getElementById('cap4');

  function clamp01(v){ return Math.min(1, Math.max(0, v)); }
  function f(p, start, end){ return clamp01((p - start) / (end - start)); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function easeInOutCubic(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function fadeWindow(p, start, end, edge){
    edge = edge || (end - start) * 0.22;
    if (p <= start || p >= end) return 0;
    var inV  = clamp01((p - start) / edge);
    var outV = clamp01((end - p) / edge);
    return Math.min(inV, outV, 1);
  }

  function lerpColor(hexA, hexB, t, alpha){
    var a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
    var ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    var br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    var r = Math.round(lerp(ar, br, t)), g = Math.round(lerp(ag, bg, t)), bl = Math.round(lerp(ab, bb, t));
    if (typeof alpha === 'number') return 'rgba(' + r + ',' + g + ',' + bl + ',' + alpha + ')';
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function setWindowGeometry(t){
    var x  = lerp(0.40, -0.35, t);
    var y  = lerp(0.27, -0.35, t);
    var w  = lerp(0.20, 1.70, t);
    var h  = lerp(0.34, 1.70, t);
    var rx = lerp(0.10, 0.05, t);
    var ry = lerp(0.15, 0.05, t);
    [windowHole, windowBezel].forEach(function(el){
      el.setAttribute('x', x);
      el.setAttribute('y', y);
      el.setAttribute('width', w);
      el.setAttribute('height', h);
      el.setAttribute('rx', rx);
      el.setAttribute('ry', ry);
    });
  }

  function render(p){
    // window growing open
    setWindowGeometry(easeInOutCubic(f(p, 0.02, 0.40)));

    // wing sliding away
    var wingT = f(p, 0.05, 0.28);
    wing.style.transform = 'translateY(' + (wingT * 45) + 'vh)';
    wing.style.opacity = String(1 - wingT);

    // clouds: parallax + visibility + sunset tint
    var cloudsVis = fadeWindow(p, 0.10, 0.88, 0.08);
    clouds.style.opacity = String(cloudsVis);
    var cloudSpan = f(p, 0.08, 0.9);
    cloudAnims.forEach(function(g){
      var depth = parseFloat(g.getAttribute('data-depth')) || 0.6;
      var travel = lerp(620, -1050, cloudSpan) * depth;
      g.setAttribute('transform', 'translate(0,' + travel + ')');
    });
    var cloudWarmT = easeInOutCubic(f(p, 0.5, 0.95));
    cloudWarms.forEach(function(el){ el.style.opacity = String(cloudWarmT * 0.65); });

    // sky warmth + sun color
    var warmT = easeInOutCubic(f(p, 0.45, 0.95));
    skyWarm.style.opacity = String(warmT);
    var sunT = easeInOutCubic(f(p, 0.35, 0.95));
    sun.style.background = lerpColor('#dfe9ff', '#ffc469', sunT);
    sun.style.boxShadow = '0 0 90px 34px ' + lerpColor('#dfe9ff', '#ffc469', sunT, 0.45);
    sun.style.transform = 'translateY(' + lerp(0, -6, sunT) + 'vh)';

    // ground rising into view
    var groundT = easeOutCubic(f(p, 0.58, 1.0));
    ground.style.transform = 'translateY(' + lerp(100, 0, groundT) + '%)';

    // captions
    heroTitle.style.opacity = String(fadeWindow(p, 0, 0.12, 0.05));
    cap1.style.opacity = String(fadeWindow(p, 0.05, 0.24));
    cap2.style.opacity = String(fadeWindow(p, 0.20, 0.42));
    cap3.style.opacity = String(fadeWindow(p, 0.42, 0.64));
    cap4.style.opacity = String(f(p, 0.74, 0.9));

    // scroll hint
    hint.style.opacity = String(1 - f(p, 0, 0.05));
  }

  var ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var total = track.offsetHeight - window.innerHeight;
      var scrolled = -track.getBoundingClientRect().top;
      var p = total > 0 ? clamp01(scrolled / total) : 0;
      render(p);
      ticking = false;
    });
  }

  if (reduceMotion){
    document.body.classList.add('no-motion');
    render(1);
  } else {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    render(0);
  }
})();
