/* ==========================================================
   ProWash — main.js
   ========================================================== */

/* ---------- Page loader ---------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hide'), 350);
});

/* ---------- Smooth image fade-in as each loads ---------- */
function bindFadeImages(root = document){
  root.querySelectorAll('img.fade-img').forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('loaded'), { once: true });
    }
  });
}
bindFadeImages();

/* ---------- Header scroll state ---------- */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

/* ---------- Mobile menu ---------- */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger) {
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    burger.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.textContent = '☰';
    });
  });
}

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* ---------- Hero canvas: layered waves + depth droplets ---------- */
(function heroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const waveLayers = [
    { amp: 16, freq: 0.012, speed: 0.016, y: 0.86, color: 'rgba(30,127,224,0.16)' },
    { amp: 22, freq: 0.008, speed: 0.011, y: 0.92, color: 'rgba(63,160,255,0.12)' },
    { amp: 12, freq: 0.02,  speed: 0.024, y: 0.97, color: 'rgba(30,127,224,0.22)' },
  ];

  let particles = [];
  function makeParticle() {
    const depth = Math.random();
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.6 + depth * 2.2,
      depth,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: -0.05 - depth * 0.15,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.15 + depth * 0.35,
    };
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particleCount = reduceMotion ? 0 : 55;
  for (let i = 0; i < particleCount; i++) particles.push(makeParticle());

  let t = 0;
  function draw() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    waveLayers.forEach(layer => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) {
        const y = H * layer.y + Math.sin(x * layer.freq + t * layer.speed) * layer.amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = layer.color;
      ctx.fill();
    });

    particles.forEach(p => {
      p.x += p.driftX + Math.sin(t * 0.01 + p.phase) * 0.1;
      p.y += p.driftY;
      if (p.y < -10) { Object.assign(p, makeParticle()); p.y = H + 10; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      ctx.beginPath();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#3FA0FF';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- WhatsApp greeting bubble ---------- */
(function waBubble() {
  const bubble = document.getElementById('waBubble');
  const closeBtn = document.getElementById('waBubbleClose');
  const floatBtn = document.querySelector('.wa-float');
  if (!bubble) return;

  let dismissed = false;
  try { dismissed = sessionStorage.getItem('prowash_wa_dismissed') === '1'; } catch (e) {}

  if (!dismissed) {
    setTimeout(() => bubble.classList.add('show'), 2200);
  }

  function hideBubble() {
    bubble.classList.remove('show');
    try { sessionStorage.setItem('prowash_wa_dismissed', '1'); } catch (e) {}
  }

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideBubble();
  });
  floatBtn.addEventListener('click', hideBubble);
})();

/* ---------- Gallery lightbox ---------- */
(function lightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  if (!lb) return;

  document.querySelectorAll('.gal-item img').forEach(img => {
    img.addEventListener('click', () => {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
})();

/* ---------- Booking form submit (Formspree, AJAX for smooth UX) ---------- */
(function bookingForm() {
  const form = document.getElementById('bookForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    status.textContent = '';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        status.textContent = "Thanks! We'll message you on WhatsApp shortly.";
        status.style.color = '#3FA0FF';
        form.reset();
      } else {
        status.textContent = 'Something went wrong — please try WhatsApp instead.';
        status.style.color = '#FF6B6B';
      }
    } catch (err) {
      status.textContent = 'Network error — please try WhatsApp instead.';
      status.style.color = '#FF6B6B';
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
})();
