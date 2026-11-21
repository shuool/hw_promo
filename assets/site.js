(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 顶栏与进度 ---------- */
  var bar = document.querySelector('.progress');
  var head = document.querySelector('.site-head');
  var toTop = document.querySelector('.to-top');

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var y = window.scrollY || doc.scrollTop;
    if (bar) {
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }
    if (head) head.classList.toggle('scrolled', y > 16);
    if (toTop) toTop.classList.toggle('show', y > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 入场 ---------- */
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 数字 ---------- */
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduced) { el.textContent = to; return; }
    var start = 0, dur = 1100;
    function step(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); io2.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { io2.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------- 复制 ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function doCopy(text, btn) {
    var label = btn ? (btn.getAttribute('data-label') || btn.textContent || '复制') : '复制';
    function done(ok) {
      if (!ok) { toast('复制失败，请长按选中：' + text); return; }
      toast('已复制：' + text);
      if (btn) {
        btn.classList.add('ok');
        btn.textContent = '已复制';
        setTimeout(function () {
          btn.classList.remove('ok');
          btn.textContent = label;
        }, 1400);
      }
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-copy]');
    if (!btn) return;
    ev.preventDefault();
    doCopy(btn.getAttribute('data-copy'), btn);
  });

  /* ---------- 小玩具按钮 ---------- */
  var toy = document.querySelector('[data-todo="toy"]');
  if (toy) {
    toy.addEventListener('click', function (ev) {
      var href = toy.getAttribute('href');
      if (!href || href === '#') {
        ev.preventDefault();
        toast(toy.getAttribute('data-tip') || '小玩具还在装配，马上就来 ✦');
      }
    });
  }

  /* ---------- 打开小小会玩：未发布提示 ---------- */
  var appBtn = document.querySelector('[data-app]');
  var appModalEl = document.getElementById('appModal');
  var appLastFocus = null;

  function openAppModal() {
    if (!appModalEl) return;
    appLastFocus = document.activeElement;
    appModalEl.classList.add('open');
    appModalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    var x = appModalEl.querySelector('.app-modal-x');
    if (x) x.focus();
  }

  function closeAppModal() {
    if (!appModalEl) return;
    appModalEl.classList.remove('open');
    appModalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (appLastFocus && appLastFocus.focus) appLastFocus.focus();
  }

  if (appBtn) {
    appBtn.addEventListener('click', function (ev) {
      var href = appBtn.getAttribute('href');
      if (!href || href === '#') {
        ev.preventDefault();
        openAppModal();
      }
    });
  }
  if (appModalEl) {
    appModalEl.addEventListener('click', function (ev) {
      if (ev.target === appModalEl || ev.target.closest('[data-app-close]')) closeAppModal();
    });
  }

  /* ---------- 点图看大图 ---------- */
  var viewer = null, vImg = null, vCap = null, lastFocus = null;

  function ensureViewer() {
    if (viewer) return;
    viewer = document.createElement('div');
    viewer.className = 'viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-hidden', 'true');
    viewer.innerHTML =
      '<button class="viewer-close" type="button" aria-label="关闭大图">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>' +
      '</button>' +
      '<div class="viewer-stage"><img alt=""></div>' +
      '<p class="viewer-cap"></p>';
    document.body.appendChild(viewer);
    vImg = viewer.querySelector('img');
    vCap = viewer.querySelector('.viewer-cap');

    viewer.addEventListener('click', function (ev) {
      if (ev.target === viewer || ev.target.classList.contains('viewer-stage') || ev.target.classList.contains('viewer-close')) {
        closeViewer();
      }
    });
  }

  function openViewer(src, title) {
    ensureViewer();
    lastFocus = document.activeElement;
    vImg.src = src;
    vImg.alt = title || '';
    vCap.textContent = title || '';
    vCap.style.display = title ? '' : 'none';
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    viewer.querySelector('.viewer-close').focus();
  }

  function closeViewer() {
    if (!viewer) return;
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (ev) {
    var hit = ev.target.closest('[data-view]');
    if (!hit) return;
    ev.preventDefault();
    openViewer(hit.getAttribute('data-view'), hit.getAttribute('data-title'));
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { closeViewer(); closeAppModal(); }
  });

  /* ---------- 星空 ---------- */
  var cv = document.getElementById('stars');
  if (cv && !reduced) {
    var ctx = cv.getContext('2d');
    var w = 0, h = 0, dpr = 1;
    var stars = [], meteors = [];
    var rafId = null, last = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = document.documentElement.clientWidth || window.innerWidth;
      h = window.innerHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = w < 640 ? 46 : (w < 1100 ? 76 : 108);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.92,
          r: Math.random() * 1.3 + 0.35,
          a: Math.random() * 0.55 + 0.25,
          sp: Math.random() * 0.9 + 0.35,
          ph: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.72 ? '255,255,255' : (Math.random() < 0.5 ? '150,240,225' : '190,180,255')
        });
      }
    }

    function spawnMeteor() {
      if (document.hidden) return;
      meteors.push({
        x: Math.random() * w * 0.7 + w * 0.1,
        y: -40,
        vx: (Math.random() * 0.3 + 0.5) * 240,
        vy: (Math.random() * 0.3 + 0.6) * 280,
        life: 1
      });
      setTimeout(spawnMeteor, Math.random() * 10000 + 7000);
    }

    function draw(t) {
      var dt = Math.min(64, t - last) / 1000 || 0.016;
      last = t;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = 0.55 + 0.45 * Math.sin(t / 1000 * s.sp + s.ph);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + s.hue + ',' + (s.a * tw).toFixed(3) + ')';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.05) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(' + s.hue + ',' + (0.08 * tw).toFixed(3) + ')';
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (var j = meteors.length - 1; j >= 0; j--) {
        var m = meteors[j];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life -= dt * 0.55;
        if (m.life <= 0 || m.x > w + 100 || m.y > h + 100) { meteors.splice(j, 1); continue; }
        var g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.22, m.y - m.vy * 0.22);
        g.addColorStop(0, 'rgba(210,240,255,' + (0.6 * m.life).toFixed(2) + ')');
        g.addColorStop(1, 'rgba(150,220,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 0.2, m.y - m.vy * 0.2);
        ctx.stroke();
      }

      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (rafId) return;
      last = 0;
      rafId = requestAnimationFrame(draw);
    }
    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    resize();
    start();
    spawnMeteor();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
  }
})();
