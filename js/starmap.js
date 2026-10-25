// Builds the animated star-map SVG from a computed natal chart.
import { SIGNS, rev } from './astro.js';

const C = 170; // centre of the 340x340 viewBox

// Screen angle (degrees, 0 = right, 90 = down) for an ecliptic longitude.
// The rising point sits on the left and the zodiac runs counter-clockwise.
function screenAngle(chart, lon) {
  const base = chart.asc != null ? chart.asc : chart.firstSign * 30;
  return rev(180 + base - lon);
}
function pt(r, a) {
  const t = (a * Math.PI) / 180;
  return [C + r * Math.cos(t), C + r * Math.sin(t)];
}
const f = (n) => n.toFixed(1);

export function starMap(chart, opts = {}) {
  const id = opts.id || 'm';
  const showHouses = opts.houses && chart.timeKnown;
  const hud = opts.hud || {};
  const parts = [];

  parts.push(`<defs>
<radialGradient id="${id}Sky" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#3D2E15"/><stop offset="1" stop-color="#120D06"/></radialGradient>
<radialGradient id="${id}Glow"><stop offset="0" stop-color="#FFE7A8" stop-opacity="0.9"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}Halo"><stop offset="0.86" stop-color="#D4AF63" stop-opacity="0"/><stop offset="0.94" stop-color="#D4AF63" stop-opacity="0.22"/><stop offset="1" stop-color="#D4AF63" stop-opacity="0"/></radialGradient>
</defs>`);
  parts.push(`<circle cx="${C}" cy="${C}" r="170" fill="url(#${id}Halo)"/>`);
  if (hud.tl) {
    parts.push(`<g font-family="'IBM Plex Mono',monospace" font-size="8.5" letter-spacing="1" fill="#A3967D">
<text x="2" y="12">${hud.tl}</text><text x="338" y="12" text-anchor="end">${hud.tr}</text>
<text x="2" y="334">${hud.bl}</text><text x="338" y="334" text-anchor="end">${hud.br}</text></g>`);
  }
  parts.push(`<circle cx="${C}" cy="${C}" r="166" fill="url(#${id}Sky)" stroke="#C9A14A" stroke-width="0.8"/>`);
  parts.push(`<g><circle cx="${C}" cy="${C}" r="160" fill="none" stroke="#C9A14A" stroke-width="1.2" stroke-dasharray="70 6 3 6 3 6" opacity="0.85"/><animateTransform attributeName="transform" type="rotate" from="0 ${C} ${C}" to="360 ${C} ${C}" dur="90s" repeatCount="indefinite"/></g>`);
  parts.push(`<g fill="none">
<circle cx="${C}" cy="${C}" r="153" stroke="#8A7040" stroke-width="4" stroke-dasharray="0.6 4.74"/>
<circle cx="${C}" cy="${C}" r="146" stroke="#C9A14A" stroke-width="0.8"/>
<circle cx="${C}" cy="${C}" r="126" stroke="#C9A14A" stroke-width="0.8"/>
<g stroke="#F0D89A" stroke-width="0.5" stroke-dasharray="1 3" opacity="0.25"><circle cx="${C}" cy="${C}" r="112"/><circle cx="${C}" cy="${C}" r="96"/><circle cx="${C}" cy="${C}" r="80"/><circle cx="${C}" cy="${C}" r="66"/></g>
<g><circle cx="${C}" cy="${C}" r="120" stroke="#F0D89A" stroke-width="0.6" stroke-dasharray="2 9" opacity="0.4"/><animateTransform attributeName="transform" type="rotate" from="360 ${C} ${C}" to="0 ${C} ${C}" dur="140s" repeatCount="indefinite"/></g>
<g><path d="M${C} ${C}L${C} 44A126 126 0 0 1 233 60.9Z" fill="#F0D89A" opacity="0.07"/><path d="M${C} ${C}L233 60.9" stroke="#F0D89A" stroke-width="0.8" opacity="0.5"/><animateTransform attributeName="transform" type="rotate" from="0 ${C} ${C}" to="360 ${C} ${C}" dur="16s" repeatCount="indefinite"/></g>
<circle cx="${C}" cy="${C}" r="54" stroke="#C9A14A" stroke-width="0.8"/>
<path d="M170 122V152M170 188V218M122 170H152M188 170H218" stroke="#F0D89A" stroke-width="0.6" opacity="0.45"/>
</g>`);

  // major ticks every 30° aligned with sign boundaries, plus dividers and glyphs
  const div = [], ticks = [], glyphs = [], houses = [];
  for (let s = 0; s < 12; s++) {
    const a = screenAngle(chart, s * 30);
    const [x1, y1] = pt(126, a), [x2, y2] = pt(150, a), [t1x, t1y] = pt(149.5, a), [t2x, t2y] = pt(156.5, a);
    div.push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`);
    ticks.push(`M${f(t1x)} ${f(t1y)}L${f(t2x)} ${f(t2y)}`);
    const [gx, gy] = pt(136, screenAngle(chart, s * 30 + 15));
    const mine = chart.planets[0].sign === s;
    glyphs.push(`<text x="${f(gx)}" y="${f(gy)}"${mine ? ' fill="#FFE7A8" font-size="17"' : ''}>${SIGNS[s].glyph}&#xFE0E;</text>`);
  }
  if (showHouses) {
    for (let h = 1; h <= 12; h++) {
      const sign = (chart.firstSign + h - 1) % 12;
      const [hx, hy] = pt(118, screenAngle(chart, sign * 30 + 15));
      houses.push(`<text x="${f(hx)}" y="${f(hy)}">H${h}</text>`);
    }
  }
  parts.push(`<path d="${ticks.join('')}" stroke="#F0D89A" stroke-width="1.2"/>`);
  parts.push(`<path d="${div.join('')}" stroke="#C9A14A" stroke-width="0.8"/>`);
  if (showHouses) {
    const inner = [];
    for (let s = 0; s < 12; s++) {
      const a = screenAngle(chart, s * 30);
      const [x1, y1] = pt(126, a), [x2, y2] = pt(54, a);
      inner.push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`);
    }
    parts.push(`<path d="${inner.join('')}" stroke="#F0D89A" stroke-width="0.4" opacity="0.16"/>`);
  }

  // background stars (deterministic pseudo-random so the map is stable)
  let seed = Math.floor(chart.planets[0].lon * 1000) + 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const stars = [];
  for (let i = 0; i < 22; i++) {
    const r = 58 + rnd() * 64, a = rnd() * 360;
    const [x, y] = pt(r, a);
    const tw = i % 6 === 0 ? `<animate attributeName="opacity" values="0.2;1;0.2" dur="${(2.5 + rnd() * 2).toFixed(1)}s" repeatCount="indefinite"/>` : '';
    stars.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${(0.6 + rnd() * 0.8).toFixed(1)}" opacity="${(0.5 + rnd() * 0.5).toFixed(2)}">${tw}</circle>`);
  }
  parts.push(`<g fill="#F0D89A">${stars.join('')}</g>`);
  parts.push(`<g font-family="'Noto Sans Symbols 2','Noto Sans Symbols',serif" font-size="15" fill="#E8D2A0" text-anchor="middle" dominant-baseline="central">${glyphs.join('')}</g>`);
  if (showHouses) parts.push(`<g font-family="'IBM Plex Mono',monospace" font-size="7" fill="#8A7A5A" text-anchor="middle" dominant-baseline="central">${houses.join('')}</g>`);

  // rising axis
  if (chart.asc != null) {
    parts.push(`<path d="M116 170H20" stroke="#F0D89A" stroke-width="1.4"/><path d="M224 170H320" stroke="#F0D89A" stroke-width="0.8" opacity="0.5"/>
<g font-family="'IBM Plex Mono',monospace" font-size="7.5" letter-spacing="1.2" fill="#F0D89A" text-anchor="middle"><text x="92" y="182">ASC</text><text x="248" y="182" opacity="0.7">DSC</text></g>`);
  }

  // place planets on one of four orbit radii so glyphs do not collide
  const levels = [112, 96, 80, 66];
  const placed = [];
  const sorted = chart.planets.map((p) => ({ p, a: screenAngle(chart, p.lon) })).sort((x, y) => x.a - y.a);
  for (const item of sorted) {
    let lvl = 0;
    for (let L = 0; L < levels.length; L++) {
      const clash = placed.some((q) => q.lvl === L && Math.min(Math.abs(q.a - item.a), 360 - Math.abs(q.a - item.a)) < 11);
      if (!clash) { lvl = L; break; }
      lvl = (L + 1) % levels.length;
    }
    const [x, y] = pt(levels[lvl], item.a);
    placed.push({ ...item, lvl, x, y });
  }

  // aspect lines on the inner circle
  const lines = [];
  chart.aspects.filter((a) => a.nature !== 0).slice(0, 10).forEach((asp) => {
    const [x1, y1] = pt(54, screenAngle(chart, asp.a.lon));
    const [x2, y2] = pt(54, screenAngle(chart, asp.b.lon));
    const col = asp.nature > 0 ? '#8FB3E0' : '#E07A62';
    lines.push(`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${col}" stroke-width="0.8" opacity="0.85"/><circle cx="${f(x1)}" cy="${f(y1)}" r="1.5" fill="#F0D89A"/><circle cx="${f(x2)}" cy="${f(y2)}" r="1.5" fill="#F0D89A"/>`);
  });
  parts.push(lines.join(''));
  parts.push(`<path d="M170 164L172 168L176 170L172 172L170 176L168 172L164 170L168 168Z" fill="#FFE7A8"/>`);

  const glowEls = [], glyphEls = [], degEls = [];
  for (const q of placed) {
    const lum = q.p.id === 'sun' || q.p.id === 'moon';
    if (lum) {
      glowEls.push(`<circle cx="${f(q.x)}" cy="${f(q.y)}" r="14" fill="url(#${id}Glow)"><animate attributeName="r" values="12;18;12" dur="${q.p.id === 'sun' ? 4 : 5}s" repeatCount="indefinite"/></circle>`);
      degEls.push(`<text x="${f(q.x)}" y="${f(q.y + 18)}">${Math.floor(q.p.lon % 30)}°</text>`);
    } else {
      glowEls.push(`<circle cx="${f(q.x)}" cy="${f(q.y)}" r="9" fill="url(#${id}Glow)" opacity="0.55"/>`);
    }
    glyphEls.push(`<text x="${f(q.x)}" y="${f(q.y)}"${lum ? ' font-size="16"' : ''}>${q.p.glyph}&#xFE0E;</text>`);
  }
  parts.push(glowEls.join(''));
  parts.push(`<g font-family="'Noto Sans Symbols','Noto Sans Symbols 2',serif" font-size="12" fill="#FFF3CF" text-anchor="middle" dominant-baseline="central">${glyphEls.join('')}</g>`);
  parts.push(`<g font-family="'IBM Plex Mono',monospace" font-size="7.5" fill="#F0D89A" text-anchor="middle">${degEls.join('')}</g>`);

  const size = opts.size || 340;
  return `<svg role="img" aria-label="${opts.label || 'ผังดาวกำเนิด'}" width="${size}" height="${size}" viewBox="0 0 340 340" fill="none" style="max-width:100%;height:auto">${parts.join('')}</svg>`;
}

// Small animated logo ring used on the welcome screen.
export function logoRing() {
  return `<svg role="img" aria-label="ตราตักศิลา" width="200" height="200" viewBox="0 0 200 200" fill="none">
<defs><radialGradient id="lgSky" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#3D2E15"/><stop offset="1" stop-color="#0D0B08"/></radialGradient>
<radialGradient id="lgGlow"><stop offset="0" stop-color="#FFE7A8" stop-opacity="0.9"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></radialGradient></defs>
<circle cx="100" cy="100" r="96" fill="url(#lgSky)" stroke="#D4AF63" stroke-width="0.8"/>
<g><circle cx="100" cy="100" r="90" stroke="#D4AF63" stroke-dasharray="40 5 2 5 2 5" opacity="0.85"/><animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="60s" repeatCount="indefinite"/></g>
<circle cx="100" cy="100" r="84" stroke="#8A7040" stroke-width="3" stroke-dasharray="0.5 2.43"/>
<circle cx="100" cy="100" r="84" stroke="#F0D89A" stroke-width="6" stroke-dasharray="0.9 43.08"/>
<circle cx="100" cy="100" r="76" stroke="#D4AF63" stroke-width="0.6"/>
<g stroke="#F0D89A" stroke-width="0.5" stroke-dasharray="1 3" opacity="0.3"><circle cx="100" cy="100" r="58"/><circle cx="100" cy="100" r="40"/></g>
<g><path d="M100 100L100 24A76 76 0 0 1 138 34.2Z" fill="#F0D89A" opacity="0.08"/><path d="M100 100L138 34.2" stroke="#F0D89A" stroke-width="0.7" opacity="0.55"/><animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="12s" repeatCount="indefinite"/></g>
<path d="M100 82L104 96L118 100L104 104L100 118L96 104L82 100L96 96Z" fill="#F0D89A"/>
<circle cx="58" cy="78" r="9" fill="url(#lgGlow)"><animate attributeName="r" values="7;11;7" dur="4s" repeatCount="indefinite"/></circle>
<circle cx="146" cy="128" r="7" fill="url(#lgGlow)"><animate attributeName="r" values="5;9;5" dur="5s" repeatCount="indefinite"/></circle>
<g fill="#F0D89A"><circle cx="58" cy="78" r="2.2"/><circle cx="146" cy="128" r="1.8"/><circle cx="128" cy="62" r="1"/><circle cx="70" cy="140" r="1.2"/><circle cx="140" cy="88" r="0.8"/></g>
</svg>`;
}
