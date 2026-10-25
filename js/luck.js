// Interactive pieces for the luck room: a ping-pong lottery globe with real physics,
// a numbered incense stick that burns down, and a เซียมซี cylinder you shake yourself.

const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
export const randomDigit = () => rnd(10);
export const randomInt = (n) => rnd(n);

// ---------- ping-pong globe ----------
// Balls carry hidden digits. Air from the bottom keeps them dancing; "stir" blows harder.
export function mountGlobe(el, { count = 24, onPick } = {}) {
  const S = el.clientWidth, R = S / 2, r = Math.round(S * 0.062);
  const balls = [];
  const digits = Array.from({ length: count }, (_, k) => k % 10);
  for (let k = digits.length - 1; k > 0; k--) { const j = rnd(k + 1); [digits[k], digits[j]] = [digits[j], digits[k]]; }
  for (let k = 0; k < count; k++) {
    const d = document.createElement('button');
    d.className = 'pball';
    d.type = 'button';
    d.setAttribute('aria-label', 'จับลูกปิงปอง');
    d.style.width = d.style.height = 2 * r + 'px';
    el.appendChild(d);
    const a = Math.random() * Math.PI * 2, m = Math.random() * (R - r) * 0.8;
    balls.push({ el: d, x: R + Math.cos(a) * m, y: R + Math.sin(a) * m, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, digit: digits[k], hue: k % 3 });
    d.classList.add('h' + (k % 3));
  }
  let stirUntil = 0, raf = 0, alive = true;
  const g = 0.32, maxR = R - r - 2;
  function step(t) {
    if (!alive) return;
    const strong = t < stirUntil;
    for (const b of balls) {
      b.vy += g;
      // blower at the bottom of the globe
      if (b.y > R + R * 0.35) {
        const p = strong ? 1.5 : 0.48;
        b.vy -= Math.random() * p * 2.2;
        b.vx += (Math.random() - 0.5) * p * 2.2;
      }
      if (strong) { b.vx += (Math.random() - 0.5) * 0.9; b.vy += (Math.random() - 0.5) * 0.9; }
      b.vx *= 0.992; b.vy *= 0.992;
      b.x += b.vx; b.y += b.vy;
      const dx = b.x - R, dy = b.y - R, dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        const nx = dx / dist, ny = dy / dist, dot = b.vx * nx + b.vy * ny;
        if (dot > 0) { b.vx -= 1.75 * dot * nx; b.vy -= 1.75 * dot * ny; }
        b.x = R + nx * maxR; b.y = R + ny * maxR;
      }
    }
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < 2 * r) {
          const nx = dx / d, ny = dy / d, over = (2 * r - d) / 2;
          a.x -= nx * over; a.y -= ny * over; b.x += nx * over; b.y += ny * over;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) { const imp = -rel * 0.9; a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny; }
        }
      }
    }
    for (const b of balls) b.el.style.transform = `translate(${(b.x - r).toFixed(1)}px,${(b.y - r).toFixed(1)}px) rotate(${(b.x * 3).toFixed(0)}deg)`;
    raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);
  el.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.pball');
    if (!t) return;
    e.preventDefault();
    const i = balls.findIndex((b) => b.el === t);
    if (i < 0) return;
    const [b] = balls.splice(i, 1);
    t.classList.add('picked');
    setTimeout(() => t.remove(), 450);
    if (onPick) onPick(b.digit, b.hue);
  });
  return {
    stir(ms = 1600) { stirUntil = performance.now() + ms; el.classList.add('stirring'); setTimeout(() => el.classList.remove('stirring'), ms); },
    destroy() { alive = false; cancelAnimationFrame(raf); }
  };
}

// ---------- numbered incense ----------
// The ember moves down the stick; each digit appears in the ash, then the ash drops into the pot.
export function burnIncense(el, digits, { onDigit, onDone, duration = 12000 } = {}) {
  const ash = el.querySelector('.i-ash'), body = el.querySelector('.i-body'), ember = el.querySelector('.i-ember');
  const smoke = el.querySelector('.i-smoke'), wins = [...el.querySelectorAll('.i-dig')];
  const zones = [0.24, 0.5, 0.76], start = 0.05, end = 0.93;
  wins.forEach((w, k) => { w.textContent = digits[k]; w.style.top = zones[k] * 100 + '%'; });
  let ashTop = start, dropped = 0, raf = 0, alive = true;
  const t0 = performance.now();
  el.classList.add('lit');
  function frame(t) {
    if (!alive) return;
    const p = Math.min(1, (t - t0) / duration);
    const front = start + (end - start) * p;
    body.style.top = front * 100 + '%';
    ember.style.top = front * 100 + '%';
    smoke.style.top = front * 100 + '%';
    ash.style.top = ashTop * 100 + '%';
    ash.style.height = Math.max(0, front - ashTop) * 100 + '%';
    wins.forEach((w, k) => {
      if (k < dropped) return;
      if (front > zones[k] + 0.03) w.classList.add('show');
    });
    if (dropped < 3 && front > zones[dropped] + 0.13) {
      const cut = zones[dropped] + 0.07;
      dropAsh(ashTop, cut, dropped);
      ashTop = cut; dropped += 1;
    }
    if (p < 1) raf = requestAnimationFrame(frame);
    else {
      while (dropped < 3) { dropAsh(ashTop, zones[dropped] + 0.07, dropped); ashTop = zones[dropped] + 0.07; dropped += 1; }
      el.classList.remove('lit'); el.classList.add('done');
      ash.style.height = '0';
      if (onDone) setTimeout(onDone, 900);
    }
  }
  function dropAsh(top, bottom, k) {
    const piece = document.createElement('div');
    piece.className = 'i-fall';
    piece.style.top = top * 100 + '%';
    piece.style.height = (bottom - top) * 100 + '%';
    const w = wins[k];
    const dg = document.createElement('span');
    dg.textContent = w.textContent;
    dg.style.top = ((zones[k] - top) / (bottom - top)) * 100 + '%';
    piece.appendChild(dg);
    w.classList.remove('show'); w.classList.add('gone');
    el.appendChild(piece);
    setTimeout(() => piece.remove(), 1600);
    if (onDigit) setTimeout(() => onDigit(k, digits[k]), 700);
  }
  raf = requestAnimationFrame(frame);
  return { destroy() { alive = false; cancelAnimationFrame(raf); } };
}

// ---------- เซียมซี ----------
// Hold the button (or shake the phone) to build up energy; at 100% one stick falls out.
export function mountSiamsi(el, { total = 28, onFall } = {}) {
  const cyl = el.querySelector('.ss-cyl'), rise = el.querySelector('.ss-rise');
  const meter = document.querySelector('.ss-meter i'), btn = document.querySelector('.ss-shake');
  const no = rnd(total) + 1;
  rise.querySelector('b').textContent = thaiNum(no);
  let energy = 0, holding = false, lastShake = 0, raf = 0, alive = true, fallen = false;
  // finger drag state
  let drag = null, ox = 0, oy = 0, lastDir = 0, lastBuzz = 0;
  const place = () => {
    cyl.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) rotate(${(-16 + ox * 0.35).toFixed(1)}deg)`;
  };
  const kick = (amount) => {
    if (fallen) return;
    energy = Math.min(1, energy + amount);
    lastShake = performance.now();
  };
  cyl.addEventListener('pointerdown', (e) => {
    if (fallen) return;
    e.preventDefault();
    cyl.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, t: performance.now() };
    cyl.classList.add('held');
  });
  cyl.addEventListener('pointermove', (e) => {
    if (!drag || fallen) return;
    const now = performance.now(), dt = Math.max(8, now - drag.t);
    const vx = (e.clientX - drag.px) / dt, vy = (e.clientY - drag.py) / dt;
    ox = Math.max(-70, Math.min(70, (e.clientX - drag.x) * 0.8));
    oy = Math.max(-50, Math.min(40, (e.clientY - drag.y) * 0.6));
    place();
    const speed = Math.hypot(vx, vy);
    kick(Math.min(0.02, speed * 0.009));
    const dir = Math.sign(e.clientX - drag.px) || Math.sign(e.clientY - drag.py);
    if (dir && lastDir && dir !== lastDir && speed > 0.25) {
      kick(0.025);
      cyl.classList.remove('clack'); void cyl.offsetWidth; cyl.classList.add('clack');
      if (navigator.vibrate && now - lastBuzz > 90) { navigator.vibrate(14); lastBuzz = now; }
    }
    if (dir) lastDir = dir;
    drag.px = e.clientX; drag.py = e.clientY; drag.t = now;
  });
  const release = () => {
    drag = null; cyl.classList.remove('held');
    if (!fallen) { ox = 0; oy = 0; cyl.style.transition = 'transform .35s cubic-bezier(.3,1.6,.5,1)'; place(); setTimeout(() => { cyl.style.transition = ''; }, 360); }
  };
  cyl.addEventListener('pointerup', release);
  cyl.addEventListener('pointercancel', release);
  // hold-to-shake button
  const down = (e) => { e.preventDefault(); holding = true; };
  const up = () => { holding = false; };
  if (btn) {
    btn.addEventListener('pointerdown', down);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, up));
  }
  // real phone shake
  let prev = null;
  const onMotion = (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    if (prev) {
      const d = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z);
      if (d > 9) kick(Math.min(0.04, d * 0.0025));
    }
    prev = { x: a.x, y: a.y, z: a.z };
  };
  window.addEventListener('devicemotion', onMotion);

  function frame(t) {
    if (!alive) return;
    if (holding && !fallen) { kick(0.0075 + Math.random() * 0.004); if (navigator.vibrate && Math.random() < 0.06) navigator.vibrate(12); }
    const active = holding || t - lastShake < 160;
    cyl.classList.toggle('shaking', holding && !fallen);
    cyl.classList.toggle('active', active && !fallen);
    if (!active && !fallen) energy = Math.max(0, energy - 0.0015);
    meter.style.width = (energy * 100).toFixed(1) + '%';
    // the chosen stick works its way out, hopping a little while you shake
    const hop = active && !fallen ? Math.abs(Math.sin(t / 45)) * 6 * energy : 0;
    rise.style.transform = `translateY(${(-energy * 78 - hop).toFixed(1)}px)`;
    rise.style.opacity = energy > 0.08 ? '1' : '0';
    if (energy >= 1 && !fallen) {
      fallen = true;
      drag = null;
      cyl.classList.remove('shaking', 'active', 'held');
      ox = 0; oy = 0; cyl.style.transition = 'transform .4s ease'; place();
      rise.classList.add('fly');
      if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
      setTimeout(() => { el.classList.add('fallen'); el.querySelector('.ss-out b').textContent = thaiNum(no); }, 380);
      setTimeout(() => onFall && onFall(no), 1700);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('devicemotion', onMotion); } };
}
// iOS asks for permission before sending motion events; must be called from a tap.
export async function askMotion() {
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      return (await DeviceMotionEvent.requestPermission()) === 'granted';
    }
    return 'ondevicemotion' in window;
  } catch { return false; }
}
export const thaiNum = (n) => String(n).replace(/[0-9]/g, (d) => '๐๑๒๓๔๕๖๗๘๙'[d]);

// ---------- ขูดเลขต้นไม้: rub powder on the bark until the numbers in the grooves show ----------
// Powder lands where the finger rubs; the grooves that form the digits hold much more of it,
// so the numbers appear gradually, like the real practice of rubbing แป้ง on a sacred tree.
export function mountTree(el, { digits, onReveal, onProgress } = {}) {
  const cv = el.querySelector('canvas');
  const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const mk = () => { const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr); return [c, x]; };
  const [rub, rx] = mk(), [mask, mx] = mk(), [tmp, tx] = mk();
  // digits written into the bark as wobbly grooves
  mx.fillStyle = '#fff'; mx.strokeStyle = '#fff'; mx.lineJoin = 'round'; mx.lineCap = 'round';
  const n = digits.length, fs = Math.min(H * 0.42, (W / n) * 1.1);
  mx.font = `700 ${fs}px "IBM Plex Mono", ui-monospace, monospace`; mx.textAlign = 'center'; mx.textBaseline = 'middle';
  digits.forEach((d, i) => {
    const x = (W / (n + 1)) * (i + 1) + (rnd(9) - 4), y = H * 0.5 + (rnd(13) - 6);
    mx.save(); mx.translate(x, y); mx.rotate((rnd(21) - 10) * Math.PI / 180);
    mx.lineWidth = 3; mx.strokeText(String(d), 0, 0); mx.globalAlpha = 0.85; mx.fillText(String(d), 0, 0); mx.restore();
  });
  // a few random grooves so the bark does not give the digits away
  mx.globalAlpha = 0.35; mx.lineWidth = 2;
  for (let i = 0; i < 9; i++) { mx.beginPath(); const x = rnd(W), y = rnd(H); mx.moveTo(x, y); mx.quadraticCurveTo(x + rnd(40) - 20, y + 20, x + rnd(30) - 15, y + 40 + rnd(30)); mx.stroke(); }
  mx.globalAlpha = 1;
  // sample points inside the digits to measure progress
  const md = mx.getImageData(0, 0, mask.width, mask.height).data, pts = [];
  for (let y = 0; y < mask.height; y += 6 * dpr) for (let x = 0; x < mask.width; x += 6 * dpr) if (md[(y * mask.width + x) * 4 + 3] > 200) pts.push([x, y]);
  let alive = true, done = false, last = null, lastBuzz = 0;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.28; ctx.drawImage(rub, 0, 0, W, H); ctx.globalAlpha = 1;
    tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, W, H); tx.drawImage(mask, 0, 0, W, H);
    tx.globalCompositeOperation = 'destination-in'; tx.drawImage(rub, 0, 0, W, H);
    ctx.drawImage(tmp, 0, 0, W, H);
  };
  const progress = () => {
    if (!pts.length) return 1;
    const rd = rx.getImageData(0, 0, rub.width, rub.height).data;
    let hit = 0; for (const [x, y] of pts) if (rd[(y * rub.width + x) * 4 + 3] > 90) hit++;
    return hit / pts.length;
  };
  const dab = (x, y) => {
    const g = rx.createRadialGradient(x, y, 0, x, y, 20);
    g.addColorStop(0, 'rgba(255,252,244,0.55)'); g.addColorStop(1, 'rgba(255,252,244,0)');
    rx.fillStyle = g; rx.beginPath(); rx.arc(x, y, 20, 0, Math.PI * 2); rx.fill();
  };
  const at = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let ticks = 0;
  const move = (e) => {
    if (!last || done) return;
    e.preventDefault();
    const [x, y] = at(e), [lx, ly] = last, dist = Math.hypot(x - lx, y - ly), steps = Math.max(1, Math.round(dist / 6));
    for (let i = 1; i <= steps; i++) dab(lx + ((x - lx) * i) / steps, ly + ((y - ly) * i) / steps);
    last = [x, y]; draw();
    const now = performance.now();
    if (navigator.vibrate && now - lastBuzz > 120 && dist > 4) { navigator.vibrate(4); lastBuzz = now; }
    if (++ticks % 6 === 0) {
      const p = progress(); if (onProgress) onProgress(p);
      if (p > 0.62 && !done) { done = true; for (let i = 0; i < 6; i++) { rx.globalAlpha = 0.5; rx.drawImage(mask, 0, 0, W, H); } rx.globalAlpha = 1; draw(); el.classList.add('revealed'); if (navigator.vibrate) navigator.vibrate([30, 40, 60]); if (onReveal) onReveal(); }
    }
  };
  const down = (e) => { if (done) return; last = at(e); dab(...last); draw(); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); };
  const up = () => { last = null; };
  cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
  draw();
  return { destroy() { alive = false; cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); } };
}
