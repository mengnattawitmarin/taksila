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
  const cyl = el.querySelector('.ss-cyl'), meter = document.querySelector('.ss-meter i'), btn = document.querySelector('.ss-shake');
  let energy = 0, shaking = false, lastShake = 0, raf = 0, alive = true, fallen = false;
  function frame() {
    if (!alive) return;
    const active = shaking || performance.now() - lastShake < 180;
    cyl.classList.toggle('shaking', active && !fallen);
    if (active && !fallen) {
      energy = Math.min(1, energy + 0.0075 + Math.random() * 0.004);
      if (navigator.vibrate && Math.random() < 0.06) navigator.vibrate(12);
    } else if (!fallen) energy = Math.max(0, energy - 0.002);
    meter.style.width = (energy * 100).toFixed(1) + '%';
    if (energy >= 1 && !fallen) {
      fallen = true;
      const no = rnd(total) + 1;
      cyl.classList.remove('shaking');
      el.classList.add('fallen');
      const stick = el.querySelector('.ss-out');
      stick.querySelector('b').textContent = thaiNum(no);
      if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
      setTimeout(() => onFall && onFall(no), 1300);
    }
    raf = requestAnimationFrame(frame);
  }
  const down = (e) => { e.preventDefault(); shaking = true; };
  const up = () => { shaking = false; };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointerleave', up);
  btn.addEventListener('pointercancel', up);
  cyl.addEventListener('pointerdown', down);
  cyl.addEventListener('pointerup', up);
  cyl.addEventListener('pointerleave', up);
  let prev = null;
  const onMotion = (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    if (prev) {
      const d = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z);
      if (d > 9) lastShake = performance.now();
    }
    prev = { x: a.x, y: a.y, z: a.z };
  };
  window.addEventListener('devicemotion', onMotion);
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
