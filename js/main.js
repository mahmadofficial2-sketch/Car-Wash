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

/* ---------- Chatbot widget ---------- */
(function chatWidget() {
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const body = document.getElementById('chatBody');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const suggestRow = document.getElementById('chatSuggest');
  if (!toggle) return;

  const history = []; // {role, content}

  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  function addMsg(text, role) {
    const el = document.createElement('div');
    el.className = `chat-msg ${role}`;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'chat-msg bot typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    suggestRow.style.display = 'none';
    const typingEl = showTyping();

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      typingEl.remove();

      if (!res.ok || !data.reply) {
        addMsg(data.error || "Sorry, I couldn't reach the assistant. Please message us on WhatsApp: 0320-9835916.", 'bot');
        return;
      }
      addMsg(data.reply, 'bot');
      history.push({ role: 'assistant', content: data.reply });
    } catch (err) {
      typingEl.remove();
      addMsg("Connection issue — please message us directly on WhatsApp: 0320-9835916.", 'bot');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    sendMessage(text);
  });

  suggestRow.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.textContent));
  });
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

/* ---------- Booking form: plain submit → Formspree redirects to thankyou.html ---------- */
/* No JS interception needed — the form's native POST + the hidden "_next" field
   handles the redirect. Formspree requires an ABSOLUTE URL for _next once live;
   update the value in index.html after you know your deployed domain, e.g.
   https://your-site.netlify.app/thankyou.html */
