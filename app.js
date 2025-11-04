// Utility: year
document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());

// Generate pseudo OHLC series
function generateSeededData(points=120, {start=100, vol=1.2}={}){
  const data = [];
  let p = start;
  for(let i=0;i<points;i++){
    const drift = (Math.random() - .5) * vol;
    const open = p;
    p = Math.max(1, p + drift + (Math.random()-.5)*vol*0.6);
    const close = p;
    const high = Math.max(open, close) + Math.random()*vol*1.2;
    const low  = Math.min(open, close) - Math.random()*vol*1.2;
    data.push({o:open,h:high,l:low,c:close});
  }
  return data;
}

// Draw simple candlestick chart on a canvas 2D context
function drawCandles(ctx, data, opts={}){
  const dpr = window.devicePixelRatio || 1;
  const canvas = ctx.canvas;
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);

  const bull = opts.bull || '#3af0c3';
  const bear = opts.bear || '#ff6574';

  // grid
  if(opts.grid){
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    for(let x=0; x<w; x+= Math.max(24, w/20)){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();}
    for(let y=0; y<h; y+= Math.max(24, h/8)){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();}
    ctx.restore();
  }

  const highs = data.map(d=>d.h);
  const lows  = data.map(d=>d.l);
  const max = Math.max(...highs), min = Math.min(...lows);
  const pad = 10;
  const y = v => h - ((v - min) / (max - min)) * (h - pad*2) - pad;

  const step = w / data.length;
  const bodyW = Math.max(1, step * 0.55);

  ctx.lineCap = 'round';
  for(let i=0;i<data.length;i++){
    const d = data[i];
    const x = i*step + step/2;
    const up = d.c >= d.o;
    ctx.strokeStyle = up ? bull : bear;
    ctx.fillStyle   = up ? bull : bear;

    // wick
    ctx.beginPath();
    ctx.moveTo(x, y(d.h)); ctx.lineTo(x, y(d.l));
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // body
    const top = y(up ? d.c : d.o);
    const bottom = y(up ? d.o : d.c);
    const hh = Math.max(1, bottom - top);
    ctx.fillRect(x - bodyW/2, top, bodyW, hh);
  }

  if(opts.hover){
    canvas.onmousemove = e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const idx = Math.min(data.length-1, Math.max(0, Math.floor(mx / step)));
      const d = data[idx];
      ctx.clearRect(0,0,w,h);
      drawCandles(ctx, data, {...opts, hover:false}); // redraw base
      // crosshair
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.moveTo(idx*step + step/2,0); ctx.lineTo(idx*step + step/2,h); ctx.stroke();

      // tooltip
      const box = 140, bx = Math.min(w-box-8, Math.max(8, idx*step)); const by = 8;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx,by,box,60);
      ctx.fillStyle = '#d9faff'; ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.fillText(`O: ${d.o.toFixed(2)}`, bx+8, by+18);
      ctx.fillText(`H: ${d.h.toFixed(2)}`, bx+8, by+32);
      ctx.fillText(`L: ${d.l.toFixed(2)}`, bx+8, by+46);
      ctx.fillText(`C: ${d.c.toFixed(2)}`, bx+70, by+18);
    };
  }
}

// Draw a simple equity curve
function drawEquity(ctx, points=160){
  const dpr = window.devicePixelRatio || 1;
  const canvas = ctx.canvas;
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  for(let x=0; x<w; x+= Math.max(24, w/20)){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();}
  for(let y=0; y<h; y+= Math.max(24, h/8)){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();}

  // data
  const data = []; let v=0;
  for(let i=0;i<points;i++){ v += (Math.random()-.35)*1.4; data.push(Math.max(-10, v)); }

  // normalize
  const max = Math.max(...data), min = Math.min(...data);
  const pad = 10; const y = val => h - ((val-min)/(max-min))*(h-pad*2) - pad;
  const step = w/points;

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#42ffc2';
  ctx.beginPath();
  for(let i=0;i<points;i++){
    const X = i*step + (i?0:1);
    const Y = y(data[i]);
    if(i===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
  }
  ctx.stroke();
}

function makeResponsive(canvasId, redraw){
  const c = document.getElementById(canvasId);
  const ro = new ResizeObserver(()=>redraw());
  ro.observe(c);
}

// === Animated background bars (red/green on black) for home page ===
function animateBars(canvas){
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  function resize(){
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Build bars
  const bars = [];
  const BAR_COUNT = Math.floor((canvas.width/dpr) / 14);
  for(let i=0;i<BAR_COUNT;i++){
    const x = i * 14 + 6;
    const up = Math.random() > .5;
    bars.push({
      x,
      w: 8,
      h: Math.random()*120 + 20,
      speed: Math.random()*0.6 + 0.2,
      offset: Math.random()*Math.PI*2,
      up
    });
  }

  function frame(t){
    const w = canvas.width/dpr, h = canvas.height/dpr;
    // Background
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);

    // Faint grid lines
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    for(let gx=0; gx<w; gx+= 40){ ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,h); ctx.stroke(); }
    for(let gy=0; gy<h; gy+= 40){ ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(w,gy); ctx.stroke(); }

    // Bars
    for(const b of bars){
      const pulse = (Math.sin(t*0.001*b.speed + b.offset) + 1)/2; // 0..1
      const height = 20 + pulse * b.h;
      const color = b.up ? '#30e07a' : '#ff4a5c';
      ctx.fillStyle = color;
      const y = h - height - 10;
      ctx.fillRect(b.x, y, b.w, height);
      // occasional flip to mimic tick changes
      if(Math.random()<0.003) b.up = !b.up;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// === Full-screen reactive market ticker background ===
function marketTickerBackground(canvas, opts={}){
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const bull = opts.bull || '#30e07a';
  const bear = opts.bear || '#ff4a5c';

  let mouseX = 0.5, mouseY = 0.5;

  function resize(){
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w*dpr);
    canvas.height = Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  window.addEventListener('resize', resize);

  if(opts.onMouse){
    window.addEventListener('mousemove', (e)=>{
      const w = window.innerWidth, h = window.innerHeight;
      mouseX = Math.min(1, Math.max(0, e.clientX / w));
      mouseY = Math.min(1, Math.max(0, e.clientY / h));
    }, {passive:true});
  }

  // Generate stream of candles scrolling left
  const CANDLE_W = 16;
  const SPEED_BASE = 55; // px/sec
  const series = [];
  function pushCandle(prevClose){
    const vol = 0.8 + mouseY*2.2; // more vol near bottom
    const o = prevClose;
    const change = (Math.random()-.5) * vol;
    const c = Math.max(1, o + change);
    const h = Math.max(o, c) + Math.random()*vol*1.2;
    const l = Math.min(o, c) - Math.random()*vol*1.2;
    series.push({o,h,l,c,x: canvas.width/dpr + CANDLE_W});
  }

  // Seed initial series
  let p = 100;
  for(let i=0; i<Math.ceil((canvas.width/dpr)/CANDLE_W)+20; i++){
    pushCandle(p); p = series[series.length-1].c;
    series[series.length-1].x = i*CANDLE_W;
  }

  let last = performance.now();
  function frame(now){
    const dt = (now - last) / 1000; last = now;
    const w = canvas.width/dpr, h = canvas.height/dpr;
    const speed = SPEED_BASE * (0.4 + mouseX*1.6);

    // clear
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);

    // subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    for(let gx=0; gx<w; gx+=40){ ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,h); ctx.stroke(); }
    for(let gy=0; gy<h; gy+=40){ ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(w,gy); ctx.stroke(); }

    // move + draw candles
    const yMap = (val, min, max) => h - ((val-min)/(max-min))*(h-20) - 10;
    const highs = series.map(s=>s.h), lows = series.map(s=>s.l);
    const ymax = Math.max(...highs), ymin = Math.min(...lows);

    for(let i=0;i<series.length;i++){
      const d = series[i];
      d.x -= speed*dt;
      const up = d.c >= d.o;
      ctx.strokeStyle = up ? bull : bear;
      ctx.fillStyle = ctx.strokeStyle;

      // wick
      const x = d.x + CANDLE_W/2;
      ctx.beginPath();
      ctx.moveTo(x, yMap(d.h, ymin, ymax));
      ctx.lineTo(x, yMap(d.l, ymin, ymax));
      ctx.lineWidth = 1.3; ctx.stroke();

      // body
      const top = yMap(up?d.c:d.o, ymin, ymax);
      const bottom = yMap(up?d.o:d.c, ymin, ymax);
      const hh = Math.max(1, bottom-top);
      ctx.fillRect(d.x+2, top, CANDLE_W-4, hh);
    }

    // recycle off-screen and append new
    while(series.length && series[0].x < -CANDLE_W){ series.shift(); }
    while(series.length && series[series.length-1].x < w){ 
      const lastClose = series[series.length-1].c;
      pushCandle(lastClose);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame((t)=>{ last=t; frame(t); });
}
