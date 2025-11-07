/*
 * Main JavaScript bundle for Rasheed Ghafoury’s portfolio.
 *
 * This script begins by initializing global UI behaviours defined in the
 * original portfolio: tilt animations on hover, a cycling typewriter
 * headline, reveal animations triggered by scroll, and a flexible contact
 * form handler that gracefully degrades to a mailto link when no action is
 * provided. After these utilities, a new self‑invoking function adds the
 * animated candlestick background used on the home page. The canvas code
 * is encapsulated and only runs if the relevant element exists.
 */

// Enable scroll reveal animations by default
document.body.classList.add('js-anim');

// Set the current year in any element with id="year"
const yearEl = document.getElementById('year');
if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

// =============================================
// Tilt interaction on elements with the `.tilt` class
// Creates a subtle 3D tilt effect based on cursor position.
// =============================================
(() => {
  const tiltElems = document.querySelectorAll('.tilt');
  tiltElems.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = (x - rect.width / 2) / rect.width;
      const dy = (y - rect.height / 2) / rect.height;
      el.style.transform = `rotateX(${dy * -6}deg) rotateY(${dx * 6}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  });
})();

// =============================================
// Typewriter effect for cycling phrases in the hero.
// Reads the `data-text` attribute on the element with `.typewriter`
// and cycles through the values separated by the '•' character.
// =============================================
(() => {
  const tw = document.querySelector('.typewriter');
  if(!tw) return;
  const items = (tw.getAttribute('data-text') || '')
    .split('•')
    .map(s => s.trim())
    .filter(Boolean);
  let idx = 0, pos = 0, dir = 1;
  let current = items[0] || '';
  function tick(){
    if(dir === 1){
      pos++;
      if(pos >= current.length + 8){ dir = -1; }
    } else {
      pos--;
      if(pos <= 0){
        dir = 1;
        idx = (idx + 1) % items.length;
        current = items[idx] || '';
      }
    }
    tw.textContent = current.slice(0, Math.max(0,pos));
    setTimeout(tick, dir===1 ? 80 : 40);
  }
  tick();
})();

// =============================================
// Mobile menu toggle
// On small screens, clicking the hamburger button toggles the
// visibility of the navigation menu. The menu uses the `.show`
// class to become visible. When open, pressing the button again
// hides it. No action is taken on larger screens because the
// button is hidden via CSS.
(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu   = document.querySelector('.rg-nav');
  if(navToggle && navMenu){
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });
  }
})();

// =============================================
// Reveal on scroll for elements with the `[data-reveal]` attribute.
// Uses IntersectionObserver to add the `.visible` class when an element
// enters the viewport. This triggers CSS transitions defined in the
// stylesheet.
// =============================================
(() => {
  const revealEls = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
  // Fallback: reveal all elements shortly after load
  setTimeout(() => revealEls.forEach(el => el.classList.add('visible')), 50);
})();

// =============================================
// Contact form handler.
// If the form has an action attribute (e.g., Formspree endpoint), it
// submits via AJAX and displays a status message. Otherwise, it falls
// back to constructing a mailto link and opening the user’s email client.
// =============================================
(() => {
  const contactFormEl = document.getElementById('contactForm');
  const formStatusEl  = document.getElementById('formStatus');
  if(!contactFormEl) return;
  contactFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(contactFormEl);
    const name    = formData.get('name');
    const email   = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    // If the form specifies an action, send via fetch
    if(contactFormEl.getAttribute('action')){
      try{
        const res = await fetch(contactFormEl.action, { method: 'POST', body: formData, headers: { 'Accept':'application/json' } });
        if(res.ok){
          formStatusEl && (formStatusEl.textContent = 'Thanks! Your message has been sent.');
          contactFormEl.reset();
        }else{
          formStatusEl && (formStatusEl.textContent = 'Sorry, there was an error. Please try again.');
        }
      }catch(err){
        formStatusEl && (formStatusEl.textContent = 'Network error. Please try again.');
      }
    } else {
      // No action defined: create mailto link
      const mailto = `mailto:rasheedghafoury@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name} <${email}>

${message}`)}`;
      window.location.href = mailto;
      formStatusEl && (formStatusEl.textContent = 'Opening your email app…');
    }
  });
})();

// =============================================
// Animated candlestick background for the home page.
// The function below self‑invokes and only runs if a canvas with the
// id `rg-market-bg` is present on the page. It draws a stream of
// candlestick bars that scroll horizontally, using CSS variables
// `--rg-green` and `--rg-red` for coloring. Mouse movement adjusts
// scrolling speed and volatility of the candle heights.
// =============================================
(() => {
  const canvas = document.getElementById('rg-market-bg');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let dpr   = window.devicePixelRatio || 1;
  let width, height;
  let candles = [];
  let offset = 0;
  let speed  = 0.8;
  let volatility = 0.5;
  let lastTime = 0;

  // Base width of each candlestick in CSS pixels. This value controls the
  // thickness of the candlestick bars in the animated background. A
  // larger value produces wider bars and increases their presence
  // behind the page content. The original design used 14–20 pixels; to
  // achieve the “bigger” look requested by the user, bump this up to
  // 26 pixels. Feel free to experiment with slightly larger values if
  // you want even chunkier candles.
  // Base width of each candlestick in CSS pixels. Increase this
  // value to create thicker bars, as requested. A value around
  // 40 produces prominent candles that remain visually pleasing
  // without overwhelming the content. Adjust down or up to taste.
  const BAR_BASE = 40;

  // Generate a single candle based on the previous close value
  function genCandle(prevClose){
    // Body height is random within a volatility‑scaled range
    const bodyHeight = (Math.random() * 2 - 1) * height * 0.03 * volatility;
    const open = prevClose;
    let close = open + bodyHeight;
    close = Math.max(BAR_BASE * dpr, Math.min(height - BAR_BASE * dpr, close));
    const high = Math.max(open, close) + Math.random() * height * 0.04 * volatility;
    const low  = Math.min(open, close) - Math.random() * height * 0.04 * volatility;
    return { open, close, high, low };
  }

  function resize(){
    dpr    = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    width  = canvas.width;
    height = canvas.height;
    // Build an array of candles spanning the entire screen plus a buffer
    candles = [];
    const barW = BAR_BASE * dpr;
    const count = Math.ceil(width / barW) + 6;
    let lastClose = height / 2;
    for(let i=0; i<count; i++){
      const candle = genCandle(lastClose);
      candles.push(candle);
      lastClose = candle.close;
    }
  }

  function drawGrid(){
    // Increase the grid size slightly to better complement the
    // thicker candlesticks. A 100px base (scaled by DPR) creates
    // larger, less cluttered squares reminiscent of the reference
    // design. If you prefer denser lines, lower this value.
    const gridSize = 100 * dpr;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1 * dpr;
    for(let x=0; x<width; x+=gridSize){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke();
    }
    for(let y=0; y<height; y+=gridSize){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke();
    }
  }

  function draw(now){
    const dt = (now - lastTime) / 16.7; // Normalize based on ~60fps
    lastTime = now;
    ctx.clearRect(0,0,width,height);
    drawGrid();
    const barW = BAR_BASE * dpr;
    offset += speed * dt * dpr;
    while(offset >= barW){
      offset -= barW;
      // Remove the first candle and append a new one
      candles.shift();
      const last = candles[candles.length - 1];
      candles.push(genCandle(last.close));
    }
    // Precompute colors from CSS variables
    const compStyles = getComputedStyle(document.documentElement);
    const upColor   = compStyles.getPropertyValue('--rg-green').trim() || '#30e07a';
    const downColor = compStyles.getPropertyValue('--rg-red').trim()   || '#ff4a5c';
    // Draw each candle
    candles.forEach((c, i) => {
      const xPos = i * barW - offset;
      const color = (c.close >= c.open) ? upColor : downColor;
      // Wick
      ctx.lineWidth = 1 * dpr;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(xPos + barW/2, height - c.high);
      ctx.lineTo(xPos + barW/2, height - c.low);
      ctx.stroke();
      // Body
      const bodyTop    = height - Math.max(c.open, c.close);
      const bodyHeight = Math.abs(c.close - c.open);
      ctx.fillStyle = color;
      ctx.fillRect(xPos + 2 * dpr, bodyTop, barW - 4 * dpr, bodyHeight);
    });
    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
  // Mouse interaction to adjust speed and volatility
  window.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    speed     = 0.5 + x * 2.0;  // horizontal position controls scroll speed
    volatility = 0.3 + y * 1.7; // vertical position controls candle height variation
  });
})();