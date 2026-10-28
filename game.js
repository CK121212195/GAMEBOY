'use strict';
/* Satoshi Claw — a hand-drawn isometric crypto claw machine. No dependencies. */

// ---------- machine geometry (world units, y is up) ----------
const MW = 240, MD = 200;              // cabinet width (x) and depth (z); front face is z = MD
const FLOOR = 140;                     // pit floor height
const GLASS_TOP = 340;
const RAIL_Y = 322;
const CH_X0 = MW - 74, CH_Z0 = MD - 74; // prize chute occupies the front-right corner
const HOLE_X = CH_X0 + 3, HOLE_Z = CH_Z0 + 3;
const WALL_H = 42;
const HOME = { x: (HOLE_X + MW) / 2, z: (HOLE_Z + MD) / 2 };
const RANGE = { x0: 22, x1: MW - 22, z0: 22, z1: MD - 22 };
const WALLS = [
  { x0: CH_X0 - 3, x1: CH_X0 + 3, y0: FLOOR, y1: FLOOR + WALL_H, z0: CH_Z0 - 3, z1: MD },
  { x0: CH_X0 - 3, x1: MW, y0: FLOOR, y1: FLOOR + WALL_H, z0: CH_Z0 - 3, z1: CH_Z0 + 3 },
];
const COST = 100;
const PITY_MAX = 7;
const HALVING_EVERY = 21;
const PLAY_TIME = 20;
const DAILY_BONUS = 300;
const MINE_CLICKS = 24;
const STEP = 1 / 120;

const INK = '#2a221e';
const COLOURS = { yellow: '#f2b730', orange: '#ef6b4a', green: '#8fd0a8', blue: '#7e9fe6', pink: '#f2a2b8' };

const RARITY = {
  C: { label: 'COMMON', color: '#7d746c' },
  R: { label: 'RARE', color: '#2f7fc1' },
  E: { label: 'EPIC', color: '#8a4fd6' },
  L: { label: 'LEGENDARY', color: '#d9821a' },
  M: { label: 'MYTHIC', color: '#e2483d' },
};
const ITEMS = {
  SATS:    { name: 'サトシひよこ',       ticker: 'SATS', rarity: 'C', value: 60,   r: 14, grip: .74, w: 16, color: '#ffd23f', desc: '1億分の1BTCのひよこ。小さいけど、積もればデカい。' },
  DOGE:    { name: 'ドージ柴',           ticker: 'DOGE', rarity: 'C', value: 110,  r: 19, grip: .62, w: 14, color: '#e3b866', desc: 'Much plush. Very fluffy. Wow. 有名人のひとことで跳ねる。' },
  PEPE:    { name: 'カエルのペペ',       ticker: 'PEPE', rarity: 'C', value: 90,   r: 18, grip: .64, w: 13, color: '#7cc35a', desc: 'ミームの化身。価値はだいたい雰囲気で決まる。' },
  ADA:     { name: 'エイダくま',         ticker: 'ADA',  rarity: 'C', value: 120,  r: 18, grip: .58, w: 12, color: '#5b86e5', desc: '論文を読んでから動くタイプ。査読済みのふわふわ。' },
  XRP:     { name: 'リップルペンギン',   ticker: 'XRP',  rarity: 'R', value: 170,  r: 18, grip: .52, w: 10, color: '#3d4654', desc: '送金がとにかく速い。裁判ニュースに一喜一憂。' },
  SOL:     { name: 'ソラナスライム',     ticker: 'SOL',  rarity: 'R', value: 260,  r: 19, grip: .48, w: 9,  color: '#9b6bff', desc: '高速チェーンのグラデぬい。たまに止まって寝る。' },
  RUG:     { name: 'ラグプル絨毯',       ticker: 'RUG',  rarity: 'R', value: 0,    r: 18, grip: .62, w: 6,  color: '#c94a3c', desc: 'つかんだ瞬間に開発者が逃げた。価値は永遠に0。でも図鑑は埋まる。' },
  ETH:     { name: 'イーサうさぎ',       ticker: 'ETH',  rarity: 'E', value: 450,  r: 21, grip: .40, w: 6,  color: '#9aa8f2', desc: 'ワールドコンピューターの化身。耳が長いのはガス代のせい。' },
  COLD:    { name: 'コールドウォレット', ticker: 'COLD', rarity: 'E', value: 520,  r: 17, grip: .45, w: 3,  color: '#a3abba', desc: 'Not your keys, not your coins. 秘密鍵をそっと守るロボ。' },
  BTC:     { name: 'ビットコイン猫',     ticker: 'BTC',  rarity: 'L', value: 900,  r: 23, grip: .30, w: 3,  color: '#f7931a', desc: 'デジタルゴールドの猫。重くて取りにくい。それがまたいい。' },
  GENESIS: { name: 'ジェネシスブロック', ticker: 'BLK0', rarity: 'M', value: 3000, r: 21, grip: .24, w: .8, color: '#ffcf4d', desc: '2009年1月3日、すべてはここから。“Chancellor on brink of second bailout for banks”' },
};
const TYPES = Object.keys(ITEMS);

const NEWS = [
  { t: 'BTC',  m: 1.45, text: '🚀 某国がBTCを法定通貨に採用（という噂）' },
  { t: 'BTC',  m: 0.72, text: '🐋 クジラが大量売り！BTC急落' },
  { t: 'ETH',  m: 1.4,  text: '🦄 ETHアップグレード完了！ガス代が安く…なった？' },
  { t: 'ETH',  m: 0.75, text: '⛽ ガス代高騰でETH民がおこ' },
  { t: 'DOGE', m: 1.9,  text: '🐕 有名起業家が犬の画像をポスト！DOGE爆上げ' },
  { t: 'PEPE', m: 2.1,  text: '🐸 ミームの季節到来！PEPE急騰' },
  { t: 'PEPE', m: 0.5,  text: '🐸 ミームの季節、終了のお知らせ' },
  { t: 'SOL',  m: 0.6,  text: '😴 チェーンがお昼寝…SOL急落' },
  { t: 'SOL',  m: 1.5,  text: '⚡ SOLのDEX出来高が過去最高！' },
  { t: 'XRP',  m: 1.6,  text: '⚖️ 裁判で勝訴のニュース！XRP急騰' },
  { t: 'ADA',  m: 1.35, text: '📜 新しい論文が査読を通過。ADAじわ上げ' },
  { t: 'SATS', m: 1.4,  text: '⚡ ライトニング決済がラーメン屋に普及' },
  { t: 'COLD', m: 1.5,  text: '🔐 取引所がハッキング！セルフカストディ需要が急増' },
  { t: 'ALL',  m: 0.8,  text: '📉 マクロ悪化…全面安。ガチホ力が試される' },
  { t: 'ALL',  m: 1.22, text: '📈 ETFに資金流入！全面高' },
];

// ---------- persistence ----------
const SAVE_KEY = 'satoshi-claw-v2';
function defaultState() {
  return {
    sats: 1000, shelf: {}, dex: {}, tray: [], plays: 0, wins: 0, streak: 0, bestStreak: 0, pity: 0, fever: 0,
    spent: 0, lastDaily: '', mine: 0,
    sound: true, colour: 'pink', wobble: 45, labels: false, see: false, zoom: 1,
  };
}
let S = defaultState();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) S = Object.assign(defaultState(), JSON.parse(raw));
} catch (e) { /* storage unavailable: play without saving */ }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

// ---------- market ----------
const market = {};
for (const t of TYPES) market[t] = { m: t === 'RUG' ? 0 : 0.85 + Math.random() * 0.3 };
function gauss() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random()); }
function priceOf(t) { return Math.max(0, Math.round(ITEMS[t].value * market[t].m)); }
function pct(t) { return t === 'RUG' ? -100 : (market[t].m - 1) * 100; }
let lastNews = '';
function marketTick() {
  for (const t of TYPES) {
    if (t === 'RUG') continue;
    const vol = t === 'PEPE' || t === 'DOGE' ? 0.045 : t === 'COLD' || t === 'GENESIS' ? 0.012 : 0.028;
    const k = market[t];
    k.m = Math.min(6, Math.max(0.15, k.m * Math.exp(gauss() * vol) + (1 - k.m) * 0.015));
  }
}
function fireNews() {
  const n = NEWS[Math.floor(Math.random() * NEWS.length)];
  const targets = n.t === 'ALL' ? TYPES.filter(t => t !== 'RUG') : [n.t];
  for (const t of targets) market[t].m = Math.min(6, Math.max(0.15, market[t].m * n.m));
  lastNews = n.text;
  toast(n.text);
  renderTicker(); renderShelf();
}
function renderTicker() {
  let html = lastNews ? `<span class="news">BREAKING: ${lastNews}</span>` : '';
  for (const t of TYPES) {
    const p = pct(t);
    html += `<span>${ITEMS[t].ticker} ${priceOf(t).toLocaleString()} sats <b class="${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'}${Math.abs(p).toFixed(1)}%</b></span>`;
  }
  $('ticker').innerHTML = html;
}

// ---------- audio ----------
let actx = null;
function audio() {
  if (!S.sound) return null;
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(freq, dur, type = 'square', vol = 0.05, slide = 0, delay = 0) {
  const a = audio(); if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
const sfx = {
  coin() { tone(988, .08, 'square', .06); tone(1319, .28, 'square', .06, 0, .08); },
  drop() { tone(520, .5, 'triangle', .06, 180); },
  clank() { tone(140, .09, 'square', .07, 60); tone(900, .05, 'triangle', .05, 300, .02); },
  lift() { tone(180, .7, 'triangle', .05, 420); },
  slip() { tone(600, .35, 'triangle', .07, 160); },
  miss() { tone(392, .18, 'triangle', .07); tone(311, .4, 'triangle', .07, 0, .18); },
  win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .16, 'square', .05, 0, i * .07)); },
  legend() { [392, 523, 659, 784, 1047, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, .18, 'square', .05, 0, i * .08)); },
  rug() { tone(700, .6, 'sawtooth', .04, 90); tone(200, .5, 'square', .03, 60, .3); },
  sell() { tone(1568, .06, 'square', .04); tone(2093, .2, 'square', .04, 0, .06); },
  tick() { tone(1200, .03, 'square', .02); },
  hash() { tone(300 + Math.random() * 900, .03, 'square', .02); },
  fanfare() { [262, 330, 392, 523, 392, 523, 659, 784].forEach((f, i) => tone(f, .14, 'square', .04, 0, i * .09)); },
};
let moveOsc = null, moveGain = null;
function moveHum(on) {
  const a = on ? audio() : actx;
  if (!a) return;
  if (!moveOsc) {
    moveOsc = a.createOscillator(); moveGain = a.createGain();
    moveOsc.type = 'triangle'; moveOsc.frequency.value = 90; moveGain.gain.value = 0;
    moveOsc.connect(moveGain).connect(a.destination); moveOsc.start();
  }
  moveGain.gain.setTargetAtTime(on && S.sound ? 0.04 : 0, a.currentTime, 0.03);
}
function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } }

// ---------- camera & projection ----------
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let CW = 600, CH = 600, DPR = 1;
const ISO = { yaw: -0.62, pitch: 0.52 };
const FRONT = { yaw: 0, pitch: 0.16 };
const cam = { yaw: ISO.yaw, pitch: ISO.pitch, tYaw: ISO.yaw, tPitch: ISO.pitch, spin: false, front: false, s: 1, ox: 0, oy: 0 };
let cy_ = 0, sy_ = 0, cp_ = 1, sp_ = 0;
function resize() {
  const r = cv.getBoundingClientRect();
  DPR = Math.min(2.5, window.devicePixelRatio || 1);
  CW = Math.max(200, r.width); CH = Math.max(200, r.height);
  cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR);
}
function setupCamera() {
  cy_ = Math.cos(cam.yaw); sy_ = Math.sin(cam.yaw); cp_ = Math.cos(cam.pitch); sp_ = Math.sin(cam.pitch);
  const narrow = CW < 600;
  cam.s = (narrow ? Math.min(CW / 430, CH / 520) : Math.min(CW / 520, CH / 600)) * S.zoom;
  cam.ox = CW / 2; cam.oy = CH * (narrow ? 0.47 : 0.52);
}
// returns [screenX, screenY, depth]; larger depth = closer to the viewer
function P(x, y, z) {
  const dx = x - MW / 2, dz = z - MD / 2, dy = y - 215;
  const X = dx * cy_ - dz * sy_;
  const Zr = dx * sy_ + dz * cy_;
  return [cam.ox + X * cam.s, cam.oy - dy * cp_ * cam.s + Zr * sp_ * cam.s, Zr * cp_ + dy * sp_];
}
function depthOf(x, y, z) { return P(x, y, z)[2]; }
function facing(nx, ny, nz) { return nx * sy_ * cp_ + ny * sp_ + nz * cy_ * cp_ > 0.001; }
// world directions on the floor plane for "screen right" and "away from the viewer"
function screenAxes() { return { rx: cy_, rz: -sy_, ax: -sy_, az: -cy_ }; }

// ---------- hand-drawn helpers ----------
let boil = 0;
function hash3(a, b, c) {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function wob() { return S.wobble / 100 * 2.6; }
function strSeed(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h; }
// wobbly path through screen points
function wpath(c, pts, seed, closed = true) {
  const amp = wob();
  c.beginPath();
  const n = pts.length, segs = closed ? n : n - 1;
  let k = 0;
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.ceil(len / 16));
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      let x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      if (amp) { x += (hash3(seed, k, boil) - 0.5) * amp * 2; y += (hash3(seed + 9, k, boil) - 0.5) * amp * 2; }
      k++;
      if (i === 0 && j === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
  }
  if (closed) c.closePath();
  else { const b = pts[n - 1]; c.lineTo(b[0], b[1]); }
}
function poly(c, pts, fill, seed, opts = {}) {
  wpath(c, pts, seed, true);
  if (fill) { c.globalAlpha = opts.alpha ?? 1; c.fillStyle = fill; c.fill(); c.globalAlpha = 1; }
  if (opts.stroke !== false) {
    c.strokeStyle = INK; c.lineWidth = (opts.lw || 1.6) * Math.max(0.7, cam.s);
    c.globalAlpha = opts.strokeAlpha ?? 1;
    if (opts.dash) c.setLineDash(opts.dash);
    c.lineJoin = 'round'; c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  }
}
function wcircle(c, x, y, r, seed) {
  const amp = wob() * 0.8;
  c.beginPath();
  const n = Math.max(18, Math.min(32, Math.round(r)));
  for (let i = 0; i <= n; i++) {
    const a = (i % n) / n * Math.PI * 2;
    const rr = r + (amp ? (hash3(seed, i % n, boil) - 0.5) * amp * 2 : 0);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
}
function shade(col, amt) {
  let rgb;
  if (col[0] === '#') { const n = parseInt(col.slice(1), 16); rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  else rgb = col.match(/\d+/g).slice(0, 3).map(Number); // rgb(...) from an earlier shade()
  const f = v => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${f(rgb[0])},${f(rgb[1])},${f(rgb[2])})`;
}
const LIGHT = (() => { const v = [0.45, 1, 0.55]; const l = Math.hypot(...v); return v.map(x => x / l); })();
function lit(col, n) {
  const d = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
  return shade(col, d > 0.6 ? 0.28 : d > 0.2 ? 0.0 : -0.16);
}
// axis-aligned box faces with outward normals
function boxFaces(b) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  return [
    { n: [0, 1, 0], p: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], k: 'top' },
    { n: [0, -1, 0], p: [[x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0]], k: 'bottom' },
    { n: [0, 0, 1], p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], k: 'front' },
    { n: [0, 0, -1], p: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], k: 'back' },
    { n: [1, 0, 0], p: [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], k: 'right' },
    { n: [-1, 0, 0], p: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], k: 'left' },
  ];
}
function drawBox(c, b, col, seedName, opts = {}) {
  const faces = boxFaces(b);
  const seed = strSeed(seedName);
  for (let i = 0; i < faces.length; i++) {
    const f = faces[i];
    const vis = facing(...f.n);
    if (opts.only === 'back' ? vis : !vis) continue;
    const pts = f.p.map(q => P(...q));
    const fc = opts.faceColor && opts.faceColor[f.k] ? opts.faceColor[f.k] : lit(col, f.n);
    poly(c, pts, fc, seed + i * 13, { alpha: opts.alpha, dash: opts.dash, strokeAlpha: opts.strokeAlpha });
    if (opts.decor) opts.decor(c, f);
  }
}
// draws on a face using a local 2D frame: origin o, unit axes u (right) and v (down) in world space
function onFace(c, o, u, v, fn) {
  const p0 = P(...o);
  const pu = P(o[0] + u[0], o[1] + u[1], o[2] + u[2]);
  const pv = P(o[0] + v[0], o[1] + v[1], o[2] + v[2]);
  c.save();
  c.transform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]);
  fn(c);
  c.restore();
}

// ---------- prize critters ----------
function drawCritter(c, type, x, y, r, seed, tilt = 0) {
  const it = ITEMS[type];
  const col = it.color;
  c.save();
  c.translate(x, y); c.rotate(tilt);
  const lw = Math.max(1, r * 0.09);
  const outline = () => { c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); };
  const ear = (ex, ey, w, h, rot, fill) => {
    c.save(); c.translate(ex, ey); c.rotate(rot);
    c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); outline(); c.restore();
  };
  // ears and extras behind the body
  if (type === 'BTC' || type === 'DOGE') {
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(s * r * 0.25, -r * 0.8); c.lineTo(s * r * 0.78, -r * 1.12); c.lineTo(s * r * 0.85, -r * 0.4); c.closePath();
      c.fillStyle = shade(col, -0.08); c.fill(); outline();
    }
  } else if (type === 'ETH') {
    ear(-r * 0.36, -r * 1.05, r * 0.2, r * 0.55, -0.15, col); ear(r * 0.36, -r * 1.05, r * 0.2, r * 0.55, 0.15, col);
  } else if (type === 'ADA') {
    ear(-r * 0.62, -r * 0.7, r * 0.27, r * 0.27, 0, col); ear(r * 0.62, -r * 0.7, r * 0.27, r * 0.27, 0, col);
  } else if (type === 'COLD') {
    c.beginPath(); c.moveTo(0, -r); c.lineTo(0, -r * 1.35); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    c.beginPath(); c.arc(0, -r * 1.4, r * 0.13, 0, 7); c.fillStyle = '#e2483d'; c.fill(); outline();
  } else if (type === 'PEPE') {
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * r * 0.42, -r * 0.72, r * 0.32, 0, 7); c.fillStyle = col; c.fill(); outline(); }
  }
  // body
  wcircle(c, 0, 0, r, seed);
  if (type === 'SOL') {
    const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#9b6bff'); g.addColorStop(1, '#38e0b0'); c.fillStyle = g;
  } else c.fillStyle = col;
  c.fill();
  c.save(); c.clip();
  c.fillStyle = 'rgba(42,34,30,.16)'; c.beginPath(); c.arc(r * 0.35, r * 0.4, r * 1.05, 0, 7); c.arc(-r * 0.1, -r * 0.05, r * 1.0, 0, 7, true); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-r * 0.38, -r * 0.42, r * 0.22, r * 0.13, -0.6, 0, 7); c.fill();
  c.strokeStyle = 'rgba(42,34,30,.08)'; c.lineWidth = Math.max(0.6, r * 0.04);
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * r * 0.32 - r, r); c.lineTo(i * r * 0.32 + r, -r); c.stroke(); }
  c.restore();
  wcircle(c, 0, 0, r, seed); outline();

  const fy = r * 0.22;
  const eyes = (dy = fy, spread = 0.32, size = 0.09) => {
    c.fillStyle = INK;
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * r * spread, dy, r * size, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(255,120,140,.55)';
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * r * (spread + 0.2), dy + r * 0.14, r * 0.11, r * 0.07, 0, 0, 7); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = Math.max(0.8, r * 0.06); c.lineCap = 'round';
    c.beginPath(); c.arc(-r * 0.06, dy + r * 0.1, r * 0.06, 0.1, Math.PI - 0.3); c.stroke();
    c.beginPath(); c.arc(r * 0.06, dy + r * 0.1, r * 0.06, 0.3, Math.PI - 0.1); c.stroke();
  };
  const emblem = (txt, size = 0.5, dy = -0.32, color = '#fff') => {
    c.font = `700 ${r * size}px "IBM Plex Mono", ui-monospace, monospace`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = Math.max(1, r * 0.1); c.strokeStyle = INK; c.lineJoin = 'round';
    c.strokeText(txt, 0, r * dy); c.fillStyle = color; c.fillText(txt, 0, r * dy);
  };
  const beak = (dy, col2) => { c.fillStyle = col2; c.beginPath(); c.moveTo(-r * 0.11, dy); c.lineTo(r * 0.11, dy); c.lineTo(0, dy + r * 0.16); c.closePath(); c.fill(); };
  switch (type) {
    case 'BTC': emblem('₿', 0.62, -0.3); eyes(); break;
    case 'DOGE': c.fillStyle = '#fbefd5'; c.beginPath(); c.ellipse(0, r * 0.35, r * 0.5, r * 0.36, 0, 0, 7); c.fill(); emblem('Ð', 0.5, -0.36); eyes(fy + r * 0.04); break;
    case 'ETH': emblem('Ξ', 0.58, -0.3); eyes(); break;
    case 'ADA': emblem('₳', 0.5, -0.32); eyes(); break;
    case 'SOL': emblem('≡', 0.6, -0.32); eyes(); break;
    case 'XRP': c.fillStyle = '#f7f5f0'; c.beginPath(); c.ellipse(0, r * 0.25, r * 0.62, r * 0.6, 0, 0, 7); c.fill(); emblem('✕', 0.36, -0.55); eyes(fy - r * 0.06); beak(fy + r * 0.1, '#f2b730'); break;
    case 'SATS': emblem('⚡', 0.55, -0.32); eyes(fy, 0.3, 0.1); beak(fy + r * 0.06, '#ef6b4a'); break;
    case 'PEPE':
      for (const s of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.arc(s * r * 0.42, -r * 0.72, r * 0.2, 0, 7); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(s * r * 0.42 + r * 0.05, -r * 0.7, r * 0.09, 0, 7); c.fill(); }
      c.strokeStyle = '#a3402c'; c.lineWidth = r * 0.12; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.45, r * 0.18); c.quadraticCurveTo(0, r * 0.42, r * 0.45, r * 0.18); c.stroke();
      break;
    case 'RUG':
      c.strokeStyle = '#ffd98a'; c.lineWidth = r * 0.1; c.beginPath();
      for (let a = 0; a < Math.PI * 6; a += 0.25) { const q = r * 0.06 + a * r * 0.04; c.lineTo(Math.cos(a) * q, Math.sin(a) * q - r * 0.05); }
      c.stroke();
      emblem('RUG', 0.34, 0.6);
      break;
    case 'COLD':
      c.fillStyle = '#cdeff7'; c.strokeStyle = INK; c.lineWidth = lw;
      c.beginPath(); c.rect(-r * 0.55, -r * 0.42, r * 1.1, r * 0.62); c.fill(); c.stroke();
      c.fillStyle = INK; for (const s of [-1, 1]) c.fillRect(s * r * 0.22 - r * 0.06, -r * 0.2, r * 0.12, r * 0.16);
      emblem('KEY', 0.28, 0.5);
      break;
    case 'GENESIS':
      emblem('#0', 0.5, -0.3, '#fff8e0'); eyes(fy + r * 0.05);
      c.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) { const a = boil * 0.7 + i * 2.1; c.beginPath(); c.arc(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, r * 0.08, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
      break;
  }
  c.restore();
}
function paintIcon(canvas, type) {
  const c = canvas.getContext('2d');
  const s = canvas.width;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, s, s);
  drawCritter(c, type, s / 2, s * 0.56, s * 0.3, 11);
}

// ---------- world ----------
let prizes = [];
let uid = 1;
function pickType() {
  let sum = 0; for (const t of TYPES) sum += ITEMS[t].w;
  let x = Math.random() * sum;
  for (const t of TYPES) { x -= ITEMS[t].w; if (x <= 0) return t; }
  return 'SATS';
}
function spawn(type, x, y, z) {
  const r = ITEMS[type].r;
  const heavy = type === 'BTC' || type === 'GENESIS' ? 1.6 : 1;
  const p = { id: uid++, type, r, x, y, z, px: x, py: y, pz: z, a: 0, inv: 1 / (r * r / 300 * heavy), held: false, seed: Math.floor(Math.random() * 1000) };
  prizes.push(p);
  return p;
}
function randomSpot() {
  for (let i = 0; i < 40; i++) {
    const x = 24 + Math.random() * (MW - 48), z = 24 + Math.random() * (MD - 48);
    if (!(x > CH_X0 - 26 && z > CH_Z0 - 26)) return { x, z };
  }
  return { x: 50, z: 50 };
}
function restock(n, fromTop) {
  for (let i = 0; i < n; i++) {
    const s = randomSpot();
    spawn(pickType(), s.x, fromTop ? GLASS_TOP - 60 - (i % 3) * 30 : FLOOR + 30 + i * 9, s.z);
  }
}

// ---------- claw ----------
const claw = { x: HOME.x, z: HOME.z, len: 0, open: 1, sx: 0, sz: 0, svx: 0, svz: 0, vx: 0, vz: 0, held: null, plan: null, target: null, aim: 0, light: 0, stick: [0, 0], carryFrom: null };
const MAX_LEN = 150;
function hubY() { return RAIL_Y - 26 - claw.len; }
function hubPos() { return [claw.x + claw.sx, hubY(), claw.z + claw.sz]; }
function prongs() {
  const [hx, hy, hz] = hubPos();
  const a = 0.35 + claw.open * 0.65, a2 = a - 0.8;
  const out = [];
  for (let k = 0; k < 3; k++) {
    const th = k * Math.PI * 2 / 3 + Math.PI / 2;
    const cx = Math.cos(th), cz = Math.sin(th);
    const B = [hx + cx * 5, hy - 6, hz + cz * 5];
    const J = [B[0] + cx * Math.sin(a) * 20, B[1] - Math.cos(a) * 20, B[2] + cz * Math.sin(a) * 20];
    const T = [J[0] + cx * Math.sin(a2) * 18, J[1] - Math.cos(a2) * 18, J[2] + cz * Math.sin(a2) * 18];
    out.push({ B, J, T });
  }
  return out;
}
function colliders() {
  const [hx, hy, hz] = hubPos();
  const list = [{ x: hx, y: hy, z: hz, r: 10 }];
  for (const { B, J, T } of prongs()) {
    list.push({ x: (B[0] + J[0]) / 2, y: (B[1] + J[1]) / 2, z: (B[2] + J[2]) / 2, r: 4 });
    list.push({ x: J[0], y: J[1], z: J[2], r: 4 });
    list.push({ x: (J[0] + T[0]) / 2, y: (J[1] + T[1]) / 2, z: (J[2] + T[2]) / 2, r: 4 });
    list.push({ x: T[0], y: T[1], z: T[2], r: 4 });
  }
  return list;
}

// ---------- physics (position based) ----------
function physics() {
  const g = 900 * STEP * STEP;
  for (const p of prizes) {
    if (p.held) continue;
    const vx = (p.x - p.px) * 0.995, vy = (p.y - p.py) * 0.995, vz = (p.z - p.pz) * 0.995;
    p.px = p.x; p.py = p.y; p.pz = p.z;
    p.x += vx; p.y += vy - g; p.z += vz;
  }
  const cols = colliders();
  const n = prizes.length;
  for (let it = 0; it < 6; it++) {
    for (let i = 0; i < n; i++) {
      const a = prizes[i];
      for (let j = i + 1; j < n; j++) {
        const b = prizes[j];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, min = a.r + b.r;
        if (Math.abs(dx) >= min || Math.abs(dy) >= min || Math.abs(dz) >= min) continue;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2) || 0.01;
        const wa = a.held ? 0 : a.inv, wb = b.held ? 0 : b.inv, ws = wa + wb;
        if (!ws) continue;
        const o = (min - d) / d / ws;
        a.x -= dx * o * wa; a.y -= dy * o * wa; a.z -= dz * o * wa;
        b.x += dx * o * wb; b.y += dy * o * wb; b.z += dz * o * wb;
      }
    }
    for (const p of prizes) {
      if (p.held) continue;
      if (p !== claw.target && !(p.ghost > 0)) for (const c of cols) {
        const dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z, min = p.r + c.r;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2) || 0.01;
        const k = (min - d) / d;
        p.x += dx * k; p.y += dy * k; p.z += dz * k;
      }
      bounds(p);
    }
  }
  for (const p of prizes) {
    if (p.ghost > 0) p.ghost -= STEP;
    if (p.held) continue;
    if (!inHole(p) && p.y <= FLOOR + p.r + 0.5) {
      p.px = p.x - (p.x - p.px) * 0.85;
      p.pz = p.z - (p.z - p.pz) * 0.85;
    }
    p.a += ((p.x - p.px) - (p.z - p.pz)) / p.r * 0.5;
  }
}
function inHole(p) { return p.x > HOLE_X && p.z > HOLE_Z; }
function pushBox(p, b) {
  const qx = Math.max(b.x0, Math.min(b.x1, p.x));
  const qy = Math.max(b.y0, Math.min(b.y1, p.y));
  const qz = Math.max(b.z0, Math.min(b.z1, p.z));
  const dx = p.x - qx, dy = p.y - qy, dz = p.z - qz;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 >= p.r * p.r) return;
  if (d2 > 1e-6) {
    const d = Math.sqrt(d2), k = (p.r - d) / d;
    p.x += dx * k; p.y += dy * k; p.z += dz * k;
  } else {
    const opts = [[b.x0 - p.r - p.x, 0], [b.x1 + p.r - p.x, 0], [b.y1 + p.r - p.y, 1], [b.z0 - p.r - p.z, 2], [b.z1 + p.r - p.z, 2]];
    opts.sort((u, v) => Math.abs(u[0]) - Math.abs(v[0]));
    const [m, ax] = opts[0];
    if (ax === 0) p.x += m; else if (ax === 1) p.y += m; else p.z += m;
  }
}
function bounds(p) {
  const r = p.r;
  if (p.x < r + 2) p.x = r + 2; else if (p.x > MW - r - 2) p.x = MW - r - 2;
  if (p.z < r + 2) p.z = r + 2; else if (p.z > MD - r - 2) p.z = MD - r - 2;
  if (p.y > GLASS_TOP - r) p.y = GLASS_TOP - r;
  if (!inHole(p) && p.y < FLOOR + r) p.y = FLOOR + r;
  for (const w of WALLS) pushBox(p, w);
}

// ---------- game state ----------
let mode = 'idle';   // idle | ready | drop | close | hold | lift | shake | carry | release
let phaseT = 0, timer = 0, playWon = false, playFever = false, lastTick = 0;
const input = { left: false, right: false, up: false, down: false };
const fx = { parts: [], texts: [], tray: 0, coinFly: 0, btn: 0 };

function insertCoin() {
  if (mode !== 'idle') return;
  if (S.sats < COST) {
    toast('satsが足りません… 下の ⛏ Proof of Work で採掘しよう');
    sfx.miss();
    $('mineBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  S.sats -= COST; S.spent += COST; S.plays++;
  bump('sats'); sfx.coin();
  fx.coinFly = 1;
  playWon = false;
  if (S.plays % HALVING_EVERY === 0) {
    S.fever = 3;
    toast('⛏ HALVING! 3プレイのあいだアームがパワーUP（BULL RUN）');
    sfx.fanfare();
  }
  playFever = S.fever > 0;
  mode = 'ready'; timer = PLAY_TIME; lastTick = PLAY_TIME;
  save(); refreshUI();
}
function doDrop() {
  if (mode !== 'ready') return;
  mode = 'drop'; moveHum(false); sfx.drop(); fx.btn = 1; refreshUI();
}
function probeHit() {
  const [hx, hy, hz] = hubPos();
  const py = hy - 26;
  for (const p of prizes) {
    if (p.held) continue;
    const dx = p.x - hx, dy = p.y - py, dz = p.z - hz;
    if (dx * dx + dy * dy + dz * dz < (p.r + 8) * (p.r + 8)) return true;
  }
  return hy - 44 <= FLOOR;
}
function findTarget() {
  const [hx, hy, hz] = hubPos();
  let best = null, bestD = 1e9;
  for (const p of prizes) {
    if (p.held) continue;
    const dh = Math.hypot(p.x - hx, p.z - hz), dy = hy - p.y;
    if (dh > p.r + 7 || dy < 6 || dy > 34 + p.r * 1.4) continue;
    const d = Math.hypot(dh, p.y - (hy - 18 - p.r * 0.55));
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
function decideGrab() {
  const [hx, , hz] = hubPos();
  const best = claw.target;
  claw.target = null;
  sfx.clank();
  if (!best || best.held || !prizes.includes(best) || Math.hypot(best.x - hx, best.z - hz) > best.r + 10) { claw.plan = { kind: 'miss' }; return; }
  const it = ITEMS[best.type];
  const centered = 1 - Math.min(1, claw.aim / (best.r + 7));
  let chance = it.grip * (0.4 + 0.6 * centered) + (playFever ? 0.25 : 0);
  if (S.pity >= PITY_MAX) chance = 1;
  claw.held = best; best.held = true; claw.light = 1;
  if (Math.random() < chance) claw.plan = { kind: 'win' };
  else if (Math.random() < 0.5) claw.plan = { kind: 'slipLift', at: claw.len * (0.15 + Math.random() * 0.75) };
  else if (Math.random() < 0.3) claw.plan = { kind: 'slipTop' };
  else claw.plan = { kind: 'slipCarry', at: 0.2 + Math.random() * 0.75 };
  buzz(20);
}
function dropHeld(msg) {
  const p = claw.held; if (!p) return;
  p.held = false; claw.held = null;
  p.ghost = 0.6; // the closed prongs sit inside the prize; let it fall clear before they collide again
  p.px = p.x - claw.vx * STEP * 0.6; p.py = p.y; p.pz = p.z - claw.vz * STEP * 0.6;
  if (msg) {
    claw.open = 0.4;
    addText(p.x, p.y + p.r + 16, p.z, msg, '#e2483d');
    sfx.slip(); buzz([30, 40, 30]);
  }
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

function update(dt) {
  phaseT += dt;
  // pendulum sway of the claw head
  claw.svx += (-claw.sx * 70 - claw.svx * 3.5) * dt;
  claw.svz += (-claw.sz * 70 - claw.svz * 3.5) * dt;
  claw.sx += claw.svx * dt; claw.sz += claw.svz * dt;
  claw.light = Math.max(0, claw.light - dt * 2);
  const px = claw.x, pz = claw.z;
  claw.stick[0] *= 0.85; claw.stick[1] *= 0.85;

  switch (mode) {
    case 'idle':
      claw.open = Math.min(1, claw.open + dt * 2);
      break;
    case 'ready': {
      timer -= dt;
      const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const iy = (input.up ? 1 : 0) - (input.down ? 1 : 0);
      if (ix || iy) {
        const ax = screenAxes();
        let wx = ax.rx * ix + ax.ax * iy, wz = ax.rz * ix + ax.az * iy;
        const l = Math.hypot(wx, wz) || 1; wx /= l; wz /= l;
        claw.x = Math.max(RANGE.x0, Math.min(RANGE.x1, claw.x + wx * 110 * dt));
        claw.z = Math.max(RANGE.z0, Math.min(RANGE.z1, claw.z + wz * 110 * dt));
        claw.stick = [ix, iy];
      }
      moveHum(!!(ix || iy));
      if (timer < 5 && Math.ceil(timer) !== Math.ceil(lastTick)) sfx.tick();
      lastTick = timer;
      if (timer <= 0) { timer = 0; doDrop(); }
      break;
    }
    case 'drop':
      claw.len += 150 * dt;
      if (probeHit() || claw.len >= MAX_LEN) {
        claw.len = Math.min(claw.len, MAX_LEN);
        mode = 'close'; phaseT = 0;
        claw.target = findTarget();
        claw.aim = claw.target ? Math.hypot(claw.target.x - claw.x - claw.sx, claw.target.z - claw.z - claw.sz) : 0;
      }
      break;
    case 'close':
      claw.open = Math.max(0, claw.open - dt * 1.8);
      if (claw.target) {
        const t = claw.target, [hx, , hz] = hubPos(), k = Math.min(1, dt * 5);
        t.x += (hx - t.x) * k; t.z += (hz - t.z) * k; t.px = t.x; t.pz = t.z;
      }
      if (claw.open <= 0) { decideGrab(); mode = 'hold'; phaseT = 0; }
      break;
    case 'hold':
      if (phaseT > 0.4) { mode = 'lift'; phaseT = 0; sfx.lift(); }
      break;
    case 'lift':
      claw.len -= 95 * dt;
      if (claw.held && claw.plan.kind === 'slipLift' && claw.len <= claw.plan.at) dropHeld(pick(['あっ…！', 'スルッ…', 'ぐぬぬ', '握力ぅ…']));
      if (claw.len <= 0) { claw.len = 0; mode = 'shake'; phaseT = 0; claw.svx += 40; claw.svz -= 30; }
      break;
    case 'shake':
      if (claw.held && claw.plan.kind === 'slipTop' && phaseT > 0.12) dropHeld(pick(['ガタン！', 'ゆれた…！', 'そこで!?']));
      if (phaseT > 0.45) { mode = 'carry'; phaseT = 0; claw.carryFrom = { x: claw.x, z: claw.z }; }
      break;
    case 'carry': {
      const dx = HOME.x - claw.x, dz = HOME.z - claw.z, d = Math.hypot(dx, dz);
      const stepLen = 100 * dt;
      if (d <= stepLen) { claw.x = HOME.x; claw.z = HOME.z; }
      else { claw.x += dx / d * stepLen; claw.z += dz / d * stepLen; }
      const from = claw.carryFrom, total = Math.hypot(HOME.x - from.x, HOME.z - from.z) || 1;
      const progress = 1 - Math.hypot(HOME.x - claw.x, HOME.z - claw.z) / total;
      if (claw.held && claw.plan.kind === 'slipCarry' && progress >= claw.plan.at) dropHeld(pick(['惜しいっ！', 'あと少し…！', 'ノーーー！']));
      if (claw.x === HOME.x && claw.z === HOME.z) { mode = 'release'; phaseT = 0; claw.svx -= 30; }
      break;
    }
    case 'release':
      claw.open = Math.min(1, claw.open + dt * 2.2);
      if (claw.held && claw.open > 0.35) dropHeld(null);
      if (phaseT > 1.6) finishPlay();
      break;
  }
  claw.vx = (claw.x - px) / dt; claw.vz = (claw.z - pz) / dt;
  if (mode === 'ready' || mode === 'carry') { claw.svx -= claw.vx * dt * 1.2; claw.svz -= claw.vz * dt * 1.2; }
  if (claw.plan && claw.plan.kind !== 'win' && !claw.held && mode !== 'release') claw.open = Math.max(0, claw.open - dt * 1.2);
  if (claw.held) {
    const [hx, hy, hz] = hubPos(), p = claw.held;
    const k = Math.min(1, dt * 14);
    p.x += (hx - p.x) * k; p.y += (hy - 18 - p.r * 0.55 - p.y) * k; p.z += (hz - p.z) * k;
    p.px = p.x; p.py = p.y; p.pz = p.z;
  }
}

function finishPlay() {
  claw.plan = null;
  if (playFever && S.fever > 0) S.fever--;
  if (playWon) {
    S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak); S.pity = 0;
    if (S.streak >= 2) {
      const bonus = 50 * (S.streak - 1);
      S.sats += bonus; bump('sats');
      toast(`🔥 ${S.streak}連続GET！ ストリークボーナス +${bonus} sats`);
    }
  } else {
    S.streak = 0;
    S.pity = Math.min(PITY_MAX, S.pity + 1);
    sfx.miss();
    const [hx, hy, hz] = hubPos();
    addText(hx, hy + 30, hz, S.pity >= PITY_MAX ? 'GAUGE MAX! 次は確定！' : pick(['ドンマイ！', 'もう一回！', 'HODL +1', '次こそ…！']), S.pity >= PITY_MAX ? '#d9821a' : INK);
  }
  if (prizes.length < 20) restock(23 - prizes.length, true);
  mode = 'idle';
  save(); refreshUI();
}

function collect(p) {
  prizes.splice(prizes.indexOf(p), 1);
  if (claw.held === p) claw.held = null;
  const it = ITEMS[p.type];
  const isNew = !S.dex[p.type];
  S.dex[p.type] = (S.dex[p.type] || 0) + 1;
  S.wins++;
  S.tray.push({ t: p.type, isNew });
  if (mode !== 'idle') playWon = true; else S.pity = 0; // a late roll-in after the play still counts
  const rare = 'ELM'.includes(it.rarity);
  const door = doorCenter();
  for (let i = 0; i < (rare ? 70 : 40); i++) {
    const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
    fx.parts.push({
      x: door[0], y: door[1] + 30, z: door[2] + 10,
      vx: Math.cos(a) * s * 0.6, vy: 120 + Math.random() * 180, vz: Math.sin(a) * s * 0.4 + 30,
      life: 1.4 + Math.random() * 0.6, w: 3 + Math.random() * 4, rot: Math.random() * 6,
      col: pick(rare ? ['#ffcf4d', '#f7931a', '#e2483d', '#fff'] : ['#ffcf4d', '#f2a2b8', '#8fd0a8', '#7e9fe6', '#ef6b4a']),
    });
  }
  fx.tray = 1;
  if (p.type === 'RUG') sfx.rug(); else if (rare) sfx.legend(); else sfx.win();
  buzz(p.type === 'RUG' ? [200] : [60, 50, 60, 50, 120]);
  addText(door[0], door[1] + 70, door[2], p.type === 'RUG' ? 'RUGGED…' : (rare ? 'JACKPOT!!' : 'GET!!'), p.type === 'RUG' ? '#e2483d' : '#d9821a', 1.4);
  toast(`${it.name} をGET！ →「Take the prize」で取り出そう`);
  save(); refreshUI();
}

// ---------- effects ----------
function addText(x, y, z, text, col, scale = 1) { fx.texts.push({ x, y, z, text, col, life: 1.8, scale }); }
function updateFx(dt) {
  for (const p of fx.parts) { p.vy -= 400 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt; p.rot += dt * 8; }
  fx.parts = fx.parts.filter(p => p.life > 0 && p.y > -40);
  for (const t of fx.texts) { t.y += 22 * dt; t.life -= dt; }
  fx.texts = fx.texts.filter(t => t.life > 0);
  fx.tray = Math.max(0, fx.tray - dt);
  fx.coinFly = Math.max(0, fx.coinFly - dt * 1.6);
  fx.btn = Math.max(0, fx.btn - dt * 3);
}

// ---------- render ----------
function body() { return COLOURS[S.colour] || COLOURS.pink; }
function doorCenter() { return [(CH_X0 + MW) / 2 + 2, 52, MD]; }
const BASE = { x0: 0, x1: MW, y0: 0, y1: FLOOR, z0: 0, z1: MD };
const DECK = { x0: 0, x1: MW, y0: FLOOR - 30, y1: FLOOR - 8, z0: MD, z1: MD + 36 };
const ROOF = { x0: -5, x1: MW + 5, y0: GLASS_TOP, y1: GLASS_TOP + 16, z0: -5, z1: MD + 5 };
const SIGN = { x0: 10, x1: MW - 10, y0: GLASS_TOP + 16, y1: GLASS_TOP + 70, z0: MD - 18, z1: MD - 4 };
const STICK = [70, MD + 18], BUTTON = [118, MD + 18], SLOT = [44, 64];

function convexHull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
function drawShadow(c) {
  // the cabinet's silhouette projected onto the ground along the light
  const sx = -0.62, sz = 0.52, h = GLASS_TOP + 40;
  const pts = [];
  for (const [x, z] of [[0, 0], [MW, 0], [MW, MD + 36], [0, MD + 36]]) {
    pts.push(P(x, 0, z));
    pts.push(P(x + sx * h, 0, z + sz * h));
  }
  const hull = convexHull(pts.map(p => [p[0], p[1]]));
  c.save();
  poly(c, hull, '#3d4f9b', 501, { stroke: false, alpha: 0.85 });
  wpath(c, hull, 501, true); c.clip();
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1.2;
  for (let i = -80; i < 80; i++) { c.beginPath(); c.moveTo(i * 9, -10); c.lineTo(i * 9 + CH, CH + 10); c.stroke(); }
  c.restore();
}

function baseDecor(c, f) {
  const col = body();
  if (f.k === 'front') {
    const [dx] = doorCenter();
    const x0 = dx - 30, x1 = dx + 30;
    poly(c, [P(x0, 26, MD + 0.5), P(x1, 26, MD + 0.5), P(x1, 80, MD + 0.5), P(x0, 80, MD + 0.5)], '#2f2622', 701);
    // prizes waiting in the tray
    const n = Math.min(3, S.tray.length);
    for (let i = 0; i < n; i++) {
      const t = S.tray[S.tray.length - 1 - i].t;
      const bounceY = fx.tray > 0 && i === 0 ? Math.abs(Math.sin(fx.tray * 10)) * 10 * fx.tray : 0;
      const q = P(dx - 14 + i * 14, 42 + bounceY, MD + 1);
      drawCritter(c, t, q[0], q[1], 13 * cam.s, 40 + i, (i - 1) * 0.3);
    }
    poly(c, [P(x0, 26, MD + 1), P(x1, 26, MD + 1), P(x1, 40, MD + 1), P(x0, 40, MD + 1)], shade(col, -0.25), 702);
    onFace(c, [x0 + 6, 74, MD + 1], [1, 0, 0], [0, -1, 0], k => {
      k.fillStyle = '#f7f5f0'; k.font = '700 8px "IBM Plex Mono", monospace'; k.fillText('PRIZE', 0, 0);
    });
    // coin panel
    const [sx0, sy0] = SLOT;
    poly(c, [P(sx0 - 22, sy0 - 26, MD + 0.5), P(sx0 + 34, sy0 - 26, MD + 0.5), P(sx0 + 34, sy0 + 14, MD + 0.5), P(sx0 - 22, sy0 + 14, MD + 0.5)], '#24453a', 703);
    onFace(c, [sx0 - 17, sy0 + 3, MD + 1], [1, 0, 0], [0, -1, 0], k => {
      k.fillStyle = '#e8f3cf'; k.font = '700 9px "IBM Plex Mono", monospace'; k.fillText('INSERT', 0, 0); k.fillText('₿ COIN', 0, 11);
    });
    poly(c, [P(sx0 + 22, sy0 - 20, MD + 1), P(sx0 + 26, sy0 - 20, MD + 1), P(sx0 + 26, sy0 - 4, MD + 1), P(sx0 + 22, sy0 - 4, MD + 1)], INK, 704);
    poly(c, [P(0, 0, MD + 0.4), P(MW, 0, MD + 0.4), P(MW, 12, MD + 0.4), P(0, 12, MD + 0.4)], shade(col, -0.45), 705);
  } else if (f.k === 'left' || f.k === 'right') {
    const left = f.k === 'left';
    const x = left ? -0.5 : MW + 0.5;
    const zs = left ? [30, MD - 30] : [MD - 30, 30];
    poly(c, [P(x, 22, zs[0]), P(x, 22, zs[1]), P(x, 118, zs[1]), P(x, 118, zs[0])], shade(col, -0.42), left ? 710 : 711);
    onFace(c, [x, 80, zs[0] + (left ? 18 : -18)], left ? [0, 0, 1] : [0, 0, -1], [0, -1, 0], k => {
      k.fillStyle = shade(col, -0.65); k.font = '700 30px "IBM Plex Mono", monospace'; k.fillText('HODL', 0, 0);
      k.font = '600 12px "IBM Plex Mono", monospace'; k.fillText('since 2009', 2, 22);
    });
  } else if (f.k === 'top') {
    poly(c, [P(HOLE_X, FLOOR + 0.3, HOLE_Z), P(MW, FLOOR + 0.3, HOLE_Z), P(MW, FLOOR + 0.3, MD), P(HOLE_X, FLOOR + 0.3, MD)], '#2f2622', 720);
  }
}
function drawBase(c, pass) {
  const col = body();
  const faceColor = { front: col, left: shade(col, -0.18), right: shade(col, -0.18), back: shade(col, -0.18), top: shade(col, 0.55) };
  if (pass === 'back') {
    drawBox(c, BASE, col, 'base', { only: 'back', faceColor, alpha: 0.35, dash: [5, 4] });
    return;
  }
  drawBox(c, BASE, col, 'base', {
    faceColor,
    alpha: S.see ? 0.3 : 1,
    decor: (k, f) => {
      if (S.see && f.k !== 'top') k.globalAlpha = 0.45;
      baseDecor(k, f);
      k.globalAlpha = 1;
    },
  });
  if (S.see) {
    // the floor stays solid so the pit still reads as a floor
    const top = boxFaces(BASE)[0];
    if (facing(...top.n)) { poly(c, top.p.map(q => P(...q)), faceColor.top, strSeed('base')); baseDecor(c, top); }
  }
}
function drawInnards(c) {
  // visible in see-through mode: chute duct, coin vault and the gantry motor
  drawBox(c, { x0: CH_X0 + 6, x1: MW - 6, y0: 46, y1: FLOOR, z0: CH_Z0 + 8, z1: MD - 4 }, '#cfd8e6', 'duct', { alpha: 0.85 });
  drawBox(c, { x0: 16, x1: 84, y0: 8, y1: 60, z0: 40, z1: MD - 40 }, '#8c6a3c', 'vault', { alpha: 0.9 });
  const coins = Math.min(60, Math.floor(S.spent / COST));
  for (let i = 0; i < coins; i++) {
    const x = 24 + (i * 37 % 52), z = 48 + (i * 53 % (MD - 96)), y = 62 + Math.floor(i / 12) * 2;
    const q = P(x, y, z);
    c.beginPath(); c.ellipse(q[0], q[1], 5 * cam.s, 2.6 * cam.s, 0, 0, 7); c.fillStyle = '#ffcf4d'; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }
  const m = P(150, 104, 80);
  wcircle(c, m[0], m[1], 12 * cam.s, 730); c.fillStyle = '#a3abba'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  c.beginPath(); c.arc(m[0], m[1], 4 * cam.s, 0, 7); c.fillStyle = INK; c.fill();
}
function drawDeck(c) {
  const col = body();
  drawBox(c, DECK, col, 'deck', { faceColor: { top: '#f7f5f0', front: shade(col, -0.1), left: shade(col, -0.25), right: shade(col, -0.25) } });
  if (!facing(0, 1, 0)) return;
  const top = DECK.y1;
  poly(c, [P(146, top + 0.3, MD + 8), P(MW - 46, top + 0.3, MD + 8), P(MW - 46, top + 0.3, MD + 28), P(146, top + 0.3, MD + 28)], shade(col, 0.3), 740);
  // joystick
  const [jx, jz] = STICK;
  const b = P(jx, top, jz);
  c.beginPath(); c.ellipse(b[0], b[1], 11 * cam.s, 6 * cam.s, 0, 0, 7); c.fillStyle = INK; c.fill();
  const ax = screenAxes();
  const tx = jx + (ax.rx * claw.stick[0] + ax.ax * claw.stick[1]) * 8, tz = jz + (ax.rz * claw.stick[0] + ax.az * claw.stick[1]) * 8;
  const tip = P(tx, top + 26, tz);
  c.strokeStyle = INK; c.lineWidth = 3 * cam.s; c.lineCap = 'round'; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tip[0], tip[1]); c.stroke();
  wcircle(c, tip[0], tip[1], 7 * cam.s, 741); c.fillStyle = '#2f2622'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  c.beginPath(); c.arc(tip[0] - 2 * cam.s, tip[1] - 2 * cam.s, 2 * cam.s, 0, 7); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill();
  // drop button
  const [bx, bz] = BUTTON;
  const press = fx.btn * 3;
  const bb = P(bx, top, bz), bt = P(bx, top + 6 - press, bz);
  c.beginPath(); c.ellipse(bb[0], bb[1], 13 * cam.s, 7 * cam.s, 0, 0, 7); c.fillStyle = '#7a1f19'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  c.beginPath(); c.ellipse(bt[0], bt[1], 12 * cam.s, 6.5 * cam.s, 0, 0, 7);
  c.fillStyle = mode === 'ready' && Math.floor(performance.now() / 300) % 2 ? '#ff6b5f' : '#e2483d'; c.fill(); c.stroke();
  // coin stack = plays you can still afford
  const coins = Math.min(14, Math.floor(S.sats / COST));
  const [cx, cz] = [MW - 24, MD + 18];
  for (let i = 0; i < coins; i++) {
    const q = P(cx, top + i * 3.2, cz);
    c.beginPath(); c.ellipse(q[0], q[1], 9 * cam.s, 4.6 * cam.s, 0, 0, 7); c.fillStyle = i % 2 ? '#f2b730' : '#ffcf4d'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  }
  if (coins) {
    const q = P(cx, top + (coins - 1) * 3.2, cz);
    c.fillStyle = '#9a6a10'; c.font = `700 ${8 * cam.s}px "IBM Plex Mono", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₿', q[0], q[1]);
  }
  // coin flying into the slot
  if (fx.coinFly > 0) {
    const t = 1 - fx.coinFly;
    const from = [cx, top + coins * 3.2 + 10, cz], to = [SLOT[0] + 24, SLOT[1] - 12, MD + 2];
    const x = from[0] + (to[0] - from[0]) * t, z = from[2] + (to[2] - from[2]) * t;
    const y = from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 60;
    const q = P(x, y, z);
    c.save(); c.translate(q[0], q[1]); c.scale(Math.cos(t * 18), 1);
    c.beginPath(); c.arc(0, 0, 8 * cam.s, 0, 7); c.fillStyle = '#ffcf4d'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.restore();
  }
}
function glassPanes() {
  return [
    { n: [0, 0, 1], p: [[0, FLOOR, MD], [MW, FLOOR, MD], [MW, GLASS_TOP, MD], [0, GLASS_TOP, MD]] },
    { n: [0, 0, -1], p: [[MW, FLOOR, 0], [0, FLOOR, 0], [0, GLASS_TOP, 0], [MW, GLASS_TOP, 0]] },
    { n: [1, 0, 0], p: [[MW, FLOOR, MD], [MW, FLOOR, 0], [MW, GLASS_TOP, 0], [MW, GLASS_TOP, MD]] },
    { n: [-1, 0, 0], p: [[0, FLOOR, 0], [0, FLOOR, MD], [0, GLASS_TOP, MD], [0, GLASS_TOP, 0]] },
  ];
}
function drawGlass(c, front) {
  const col = body();
  glassPanes().forEach((g, i) => {
    if (facing(...g.n) !== front) return;
    const pts = g.p.map(q => P(...q));
    if (!front) { poly(c, pts, shade(col, 0.72), 800 + i, { strokeAlpha: 0.5 }); return; }
    poly(c, pts, '#e6f2f7', 800 + i, { alpha: 0.12 });
    c.save(); wpath(c, pts, 800 + i, true); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineCap = 'round';
    const a = g.p[0], b = g.p[1];
    for (const [t, w] of [[0.62, 7], [0.72, 3]]) {
      const p0 = P(a[0] + (b[0] - a[0]) * t, FLOOR + 20, a[2] + (b[2] - a[2]) * t);
      const p1 = P(a[0] + (b[0] - a[0]) * (t + 0.18), GLASS_TOP - 20, a[2] + (b[2] - a[2]) * (t + 0.18));
      c.lineWidth = w * cam.s; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    }
    c.restore();
  });
}
function drawPillars(c, front) {
  const t = 7;
  const centerD = depthOf(MW / 2, FLOOR, MD / 2);
  [[0, 0], [MW, 0], [MW, MD], [0, MD]].forEach(([x, z], i) => {
    if ((depthOf(x, FLOOR, z) > centerD) !== front) return;
    drawBox(c, { x0: x - t / 2, x1: x + t / 2, y0: FLOOR, y1: GLASS_TOP, z0: z - t / 2, z1: z + t / 2 }, shade(body(), -0.3), 'pillar' + i);
  });
}
function drawGantry(c) {
  const col = '#c9ced8';
  drawBox(c, { x0: 4, x1: MW - 4, y0: RAIL_Y, y1: RAIL_Y + 6, z0: 6, z1: 12 }, col, 'railA');
  drawBox(c, { x0: 4, x1: MW - 4, y0: RAIL_Y, y1: RAIL_Y + 6, z0: MD - 12, z1: MD - 6 }, col, 'railB');
  drawBox(c, { x0: claw.x - 4, x1: claw.x + 4, y0: RAIL_Y + 6, y1: RAIL_Y + 12, z0: 6, z1: MD - 6 }, '#aab1c0', 'bridge');
  drawBox(c, { x0: claw.x - 12, x1: claw.x + 12, y0: RAIL_Y - 6, y1: RAIL_Y + 6, z0: claw.z - 12, z1: claw.z + 12 }, '#e8ebf2', 'carriage');
  const l = P(claw.x, RAIL_Y + 6.2, claw.z);
  c.beginPath(); c.arc(l[0], l[1], 2.5 * cam.s, 0, 7);
  c.fillStyle = mode === 'ready' ? (Math.floor(performance.now() / 250) % 2 ? '#e2483d' : '#ffcf4d') : '#8fd0a8'; c.fill();
}
function clawItems() {
  const items = [];
  const [hx, hy, hz] = hubPos();
  items.push({ d: depthOf(hx, hy, hz), draw: c => {
    const a = P(claw.x, RAIL_Y - 6, claw.z), b = P(hx, hy + 8, hz);
    c.strokeStyle = INK; c.lineWidth = 1.6 * cam.s; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    const top = P(hx, hy + 8, hz), bot = P(hx, hy - 6, hz);
    const rx = 11 * cam.s, ry = rx * Math.max(0.25, sp_);
    c.beginPath(); c.ellipse(bot[0], bot[1], rx, ry, 0, 0, Math.PI); c.lineTo(top[0] - rx, top[1]); c.ellipse(top[0], top[1], rx, ry, 0, Math.PI, 0, true); c.closePath();
    c.fillStyle = '#d9dde6'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4 * Math.max(0.7, cam.s); c.stroke();
    c.beginPath(); c.ellipse(top[0], top[1], rx, ry, 0, 0, 7); c.fillStyle = '#f2f4f8'; c.fill(); c.stroke();
    const m = P(hx, hy + 1, hz);
    c.beginPath(); c.arc(m[0] + rx * 0.2, m[1] + ry, 2.4 * cam.s, 0, 7);
    c.fillStyle = claw.light > 0 ? '#ffcf4d' : (playFever && mode !== 'idle' ? '#e2483d' : '#f7931a'); c.fill();
  } });
  for (const pr of prongs()) {
    items.push({ d: depthOf(...pr.T) + 0.01, draw: c => {
      const pts = [pr.B, pr.J, pr.T].map(q => P(...q));
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [w, col] of [[5.5, INK], [2.6, '#d9dde6']]) {
        c.strokeStyle = col; c.lineWidth = w * cam.s;
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
      }
    } });
  }
  return items;
}
function drawLabels(c) {
  const [hx, hy, hz] = hubPos();
  const anchors = [
    { p: [claw.x, RAIL_Y + 6, claw.z], t: 'GANTRY', j: 'ガントリー' },
    { p: [hx, hy - 20, hz], t: 'CLAW ×3', j: '3本爪' },
    { p: [(HOLE_X + MW) / 2, FLOOR + 10, (HOLE_Z + MD) / 2], t: 'PRIZE CHUTE', j: '景品口' },
    { p: [doorCenter()[0], 60, MD], t: 'PRIZE DOOR', j: '取り出し口', front: true },
    { p: [SLOT[0] + 24, SLOT[1] - 12, MD], t: 'COIN SLOT', j: '100 sats', front: true },
    { p: [STICK[0], DECK.y1 + 20, STICK[1]], t: 'JOYSTICK', j: 'ジョイスティック' },
    { p: [BUTTON[0], DECK.y1 + 6, BUTTON[1]], t: 'DROP', j: 'ボタン' },
    { p: [MW / 2, GLASS_TOP + 44, MD - 4], t: 'MARQUEE', j: '看板' },
  ];
  if (S.see) {
    anchors.push({ p: [50, 40, MD / 2], t: 'COIN VAULT', j: `${Math.floor(S.spent / COST)} coins` });
    anchors.push({ p: [(CH_X0 + MW) / 2, 90, (CH_Z0 + MD) / 2], t: 'CHUTE DUCT', j: 'ダクト' });
  }
  const center = P(MW / 2, 200, MD / 2)[0];
  const items = anchors.filter(a => !a.front || facing(0, 0, 1)).map(a => { const q = P(...a.p); return { ...a, sx: q[0], sy: q[1], side: q[0] < center ? -1 : 1 }; });
  const fs = Math.max(10, Math.min(13, 12 * cam.s));
  const half = 170 * cam.s;
  for (const side of [-1, 1]) {
    const list = items.filter(i => i.side === side).sort((a, b) => a.sy - b.sy);
    let lastY = -1e9;
    const x = side < 0 ? Math.max(8, center - half) : Math.min(CW - 8, center + half);
    for (const it of list) {
      const y = Math.max(it.sy, lastY + fs * 2.6);
      lastY = y;
      c.strokeStyle = INK; c.lineWidth = 1;
      wpath(c, [[it.sx, it.sy], [x - side * 6, y]], strSeed(it.t), false); c.stroke();
      c.beginPath(); c.arc(it.sx, it.sy, 2.6, 0, 7); c.fillStyle = INK; c.fill();
      c.textAlign = side < 0 ? 'right' : 'left'; c.textBaseline = 'middle';
      c.font = `600 ${fs}px "IBM Plex Mono", monospace`; c.fillStyle = INK; c.fillText(it.t, x, y - fs * 0.45);
      c.font = `400 ${fs * 0.85}px "M PLUS 1 Code", "IBM Plex Mono", monospace`; c.fillStyle = '#7d746c'; c.fillText(it.j, x, y + fs * 0.65);
    }
  }
}
function drawSign(c) {
  const col = body();
  drawBox(c, SIGN, col, 'sign', {
    faceColor: { front: shade(col, 0.35), top: shade(col, 0.2) },
    decor: (k, f) => {
      if (f.k !== 'front') return;
      const z = MD - 3.6;
      poly(k, [P(22, GLASS_TOP + 26, z), P(MW - 22, GLASS_TOP + 26, z), P(MW - 22, GLASS_TOP + 60, z), P(22, GLASS_TOP + 60, z)], '#fff7f2', 760);
      onFace(k, [MW / 2, GLASS_TOP + 43, z - 0.2], [1, 0, 0], [0, -1, 0], q => {
        q.textAlign = 'center'; q.textBaseline = 'middle';
        q.font = '700 22px "IBM Plex Mono", monospace';
        q.fillStyle = '#e2483d'; q.fillText('SATOSHI CLAW', 0, 1);
      });
      const n = 16, speed = mode === 'idle' ? 400 : 120;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        for (const y of [GLASS_TOP + 21, GLASS_TOP + 65]) {
          const q = P(16 + t * (MW - 32), y, z);
          const on = (i + Math.floor(performance.now() / speed)) % 2 === 0;
          k.beginPath(); k.arc(q[0], q[1], 2.4 * cam.s, 0, 7); k.fillStyle = on ? '#ffcf4d' : '#fff'; k.fill(); k.strokeStyle = INK; k.lineWidth = 0.8; k.stroke();
        }
      }
    },
  });
}

function render() {
  const c = ctx;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.clearRect(0, 0, CW, CH);
  setupCamera();

  drawShadow(c);
  const frontVisible = facing(0, 0, 1);
  if (!frontVisible) drawDeck(c);
  if (S.see) { drawBase(c, 'back'); drawInnards(c); }
  drawBase(c, 'front');

  // inside the glass box
  drawGlass(c, false);
  drawPillars(c, false);
  for (const p of prizes) {
    if (p.y < FLOOR - 2) continue;
    const q = P(p.x, FLOOR + 0.5, p.z);
    const h = Math.max(0, p.y - p.r - FLOOR);
    c.beginPath(); c.ellipse(q[0], q[1], p.r * cam.s * (0.9 - Math.min(0.5, h / 300)), p.r * cam.s * 0.4 * Math.max(0.3, sp_ * 1.6), 0, 0, 7);
    c.fillStyle = `rgba(42,34,30,${0.14 - Math.min(0.1, h / 1500)})`; c.fill();
  }
  const items = [];
  WALLS.forEach((w, i) => items.push({ d: depthOf((w.x0 + w.x1) / 2, FLOOR + 10, (w.z0 + w.z1) / 2) - 8, draw: k => drawBox(k, w, '#e6f2f7', 'wall' + i, { alpha: 0.55 }) }));
  for (const p of prizes) {
    items.push({ d: depthOf(p.x, p.y, p.z), draw: k => { const q = P(p.x, p.y, p.z); drawCritter(k, p.type, q[0], q[1], p.r * cam.s, p.seed, Math.sin(p.a) * 0.3); } });
  }
  items.push(...clawItems());
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.draw(c);
  drawGantry(c);
  drawGlass(c, true);
  drawPillars(c, true);

  if (frontVisible) drawDeck(c);
  if (!frontVisible) drawSign(c);
  drawBox(c, ROOF, shade(body(), -0.1), 'roof', { faceColor: { top: shade(body(), 0.25) } });
  if (frontVisible) drawSign(c);

  for (const p of fx.parts) {
    const q = P(p.x, p.y, p.z), w = p.w * cam.s;
    c.save(); c.translate(q[0], q[1]); c.rotate(p.rot); c.globalAlpha = Math.min(1, p.life);
    c.fillStyle = p.col; c.strokeStyle = INK; c.lineWidth = 0.8;
    c.fillRect(-w / 2, -w / 4, w, w / 2); c.strokeRect(-w / 2, -w / 4, w, w / 2);
    c.restore();
  }
  for (const t of fx.texts) {
    const q = P(t.x, t.y, t.z);
    c.globalAlpha = Math.min(1, t.life * 1.5);
    c.font = `700 ${16 * t.scale * Math.max(0.8, cam.s)}px "IBM Plex Mono", "M PLUS 1 Code", monospace`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 5; c.strokeStyle = '#eeeae2'; c.lineJoin = 'round';
    c.strokeText(t.text, q[0], q[1]); c.fillStyle = t.col; c.fillText(t.text, q[0], q[1]);
    c.globalAlpha = 1;
  }
  if (S.labels) drawLabels(c);
}

// ---------- loop ----------
let last = performance.now(), acc = 0, tickAcc = 0, newsAt = performance.now() + 15000;
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.1) dt = 0.1;
  boil = S.wobble > 0 ? Math.floor(now / 140) % 4 : 0;
  if (cam.spin) cam.tYaw += dt * 0.5;
  cam.yaw += (cam.tYaw - cam.yaw) * Math.min(1, dt * 5);
  cam.pitch += (cam.tPitch - cam.pitch) * Math.min(1, dt * 5);
  acc += dt;
  while (acc >= STEP) {
    update(STEP);
    physics();
    for (const p of prizes.slice()) {
      if (!p.held && inHole(p) && p.y < FLOOR - p.r * 0.5) collect(p);
    }
    acc -= STEP;
  }
  updateFx(dt);
  tickAcc += dt;
  if (tickAcc > 1.5) { tickAcc = 0; marketTick(); renderTicker(); }
  if (now > newsAt) { fireNews(); newsAt = now + 22000 + Math.random() * 20000; }
  if (mode === 'ready') $('timer').innerHTML = `TIME <b>${Math.ceil(timer)}</b>s — 狙いを定めてDROP!`;
  render();
  requestAnimationFrame(frame);
}

// ---------- UI ----------
function $(id) { return document.getElementById(id); }
function bump(id) { const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function refreshUI() {
  $('sats').textContent = S.sats.toLocaleString();
  $('won').textContent = S.wins;
  $('pity').innerHTML = Array.from({ length: PITY_MAX }, (_, i) => `<i class="${i < S.pity ? 'on' : ''}"></i>`).join('');
  $('pity').parentElement.classList.toggle('full', S.pity >= PITY_MAX);
  $('halving').textContent = HALVING_EVERY - (S.plays % HALVING_EVERY);
  $('fever').hidden = !(S.fever > 0);
  $('feverLeft').textContent = S.fever;
  $('coinBtn').disabled = mode !== 'idle';
  $('coinBtn').classList.toggle('glow', mode === 'idle' && S.sats >= COST && !S.tray.length);
  $('takeBtn').disabled = !S.tray.length;
  $('takeBtn').classList.toggle('glow', S.tray.length > 0);
  $('trayDot').hidden = !S.tray.length;
  $('dropBtn').classList.toggle('ready', mode === 'ready');
  cv.style.touchAction = mode === 'ready' ? 'none' : 'pan-y'; // let the page scroll on phones unless aiming
  if (mode === 'idle') $('timer').innerHTML = S.sats >= COST ? 'Insert coin でスタート（Enter）' : 'satsが足りない… ⛏ で採掘しよう';
  else if (mode !== 'ready') $('timer').innerHTML = '…キャッチ中';
  $('seeBtn').setAttribute('aria-pressed', S.see);
  $('labelBtn').setAttribute('aria-pressed', S.labels);
  $('spinBtn').setAttribute('aria-pressed', cam.spin);
  $('frontBtn').textContent = cam.front ? 'Iso view' : 'Front view';
  $('zoomVal').textContent = Math.round(S.zoom * 100) + '%';
  $('soundBtn').textContent = S.sound ? 'SOUND ON' : 'SOUND OFF';
  document.querySelectorAll('.swatch').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === S.colour));
  const w = $('wobble'); w.value = S.wobble; w.style.setProperty('--p', S.wobble + '%');
  $('mineBar').style.width = (S.mine / MINE_CLICKS * 100) + '%';
  renderShelf();
}
let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

let shelfSig = '';
function renderShelf(force) {
  const sig = JSON.stringify([S.shelf, S.dex]) + TYPES.map(priceOf).join(',');
  if (sig === shelfSig && !force) return;
  shelfSig = sig;
  const el = $('shelf');
  el.innerHTML = '';
  let total = 0, kinds = 0;
  for (const t of TYPES) {
    const it = ITEMS[t], own = S.shelf[t] || 0, seen = S.dex[t] || 0;
    if (seen) kinds++;
    total += own * priceOf(t);
    const slot = document.createElement('div');
    slot.className = 'slot' + (seen ? '' : ' locked');
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 168;
    paintIcon(cvs, t);
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = seen ? it.name : '？？？';
    const rar = document.createElement('div'); rar.className = 'rar'; rar.textContent = RARITY[it.rarity].label; rar.style.color = RARITY[it.rarity].color;
    const ow = document.createElement('div'); ow.className = 'own';
    const p = pct(t);
    ow.textContent = seen ? `HODL ×${own} · ${priceOf(t)} sats ${t === 'RUG' ? '' : (p >= 0 ? '▲' : '▼') + Math.abs(p).toFixed(0) + '%'}` : 'not found yet';
    slot.append(cvs, nm, rar, ow);
    if (own) {
      const b = document.createElement('button'); b.className = 'pill';
      b.textContent = t === 'RUG' ? 'Throw away' : `Sell 1 → ${priceOf(t)}`;
      b.addEventListener('click', () => sell(t));
      slot.appendChild(b);
    }
    el.appendChild(slot);
  }
  $('dexStat').textContent = ` · ${kinds}/${TYPES.length} found`;
  $('shelfTotal').textContent = `評価額 ${total.toLocaleString()} sats · ${S.plays} plays · best streak ${S.bestStreak}`;
}
function sell(t) {
  if (!S.shelf[t]) return;
  S.shelf[t]--;
  const v = priceOf(t);
  S.sats += v;
  sfx.sell(); bump('sats');
  toast(t === 'RUG' ? 'ラグを捨てた。スッキリ。' : `${ITEMS[t].ticker} を ${v} sats で利確！`);
  save(); refreshUI();
}

let currentWin = null;
function takePrize() {
  if (!S.tray.length || !$('winModal').hidden) return;
  currentWin = S.tray.shift();
  const it = ITEMS[currentWin.t], rar = RARITY[it.rarity];
  $('winFig').textContent = `Fig. ${S.wins} — ${currentWin.t === 'RUG' ? 'RUGGED…' : 'GET!'}`;
  $('winNew').hidden = !currentWin.isNew;
  $('winRarity').textContent = '★'.repeat('CRELM'.indexOf(it.rarity) + 1) + ' ' + rar.label;
  $('winRarity').style.color = rar.color;
  $('winName').textContent = `${it.name}（${it.ticker}）`;
  $('winDesc').textContent = it.desc;
  $('winPrice').textContent = priceOf(currentWin.t).toLocaleString();
  $('winSell').textContent = currentWin.t === 'RUG' ? '捨てる' : `Sell → ${priceOf(currentWin.t)} sats`;
  paintIcon($('winIcon'), currentWin.t);
  $('winModal').hidden = false;
  sfx.coin();
  save(); refreshUI();
}
function closeWin(sellIt) {
  if (!currentWin) return;
  const t = currentWin.t;
  if (sellIt) {
    const v = priceOf(t);
    S.sats += v; bump('sats'); sfx.sell();
    toast(t === 'RUG' ? 'ラグを捨てた。スッキリ。' : `即利確！ +${v} sats`);
  } else {
    S.shelf[t] = (S.shelf[t] || 0) + 1;
    toast('💎🙌 HODL! 棚に飾りました（Fig. 22）');
  }
  currentWin = null;
  $('winModal').hidden = true;
  save(); refreshUI();
}
$('winHodl').addEventListener('click', () => closeWin(false));
$('winSell').addEventListener('click', () => closeWin(true));

$('coinBtn').addEventListener('click', insertCoin);
$('takeBtn').addEventListener('click', takePrize);
$('resetBtn').addEventListener('click', () => {
  if (!confirm('最初からやり直しますか？（sats・棚・図鑑がリセットされます）')) return;
  const keep = { sound: S.sound, colour: S.colour, wobble: S.wobble, labels: S.labels, see: S.see, zoom: S.zoom, lastDaily: S.lastDaily };
  S = Object.assign(defaultState(), keep);
  prizes = []; claw.held = null; claw.plan = null; claw.target = null; claw.x = HOME.x; claw.z = HOME.z; claw.len = 0; claw.open = 1; mode = 'idle';
  restock(23, false); settle();
  save(); refreshUI(); toast('Start over — 1,000 sats からリスタート');
});
$('dropBtn').addEventListener('click', () => { if (mode === 'ready') doDrop(); else if (mode === 'idle') insertCoin(); });
document.querySelectorAll('.key[data-dir]').forEach(el => {
  const key = el.dataset.dir;
  const on = e => { e.preventDefault(); input[key] = true; el.classList.add('on'); audio(); };
  const off = () => { input[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointerleave', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('contextmenu', e => e.preventDefault());
});
$('seeBtn').addEventListener('click', () => { S.see = !S.see; save(); refreshUI(); });
$('labelBtn').addEventListener('click', () => { S.labels = !S.labels; save(); refreshUI(); });
function normalizeYaw() {
  const twoPi = Math.PI * 2;
  cam.yaw = ((cam.yaw % twoPi) + twoPi + Math.PI) % twoPi - Math.PI;
}
$('spinBtn').addEventListener('click', () => {
  cam.spin = !cam.spin;
  if (cam.spin) { cam.front = false; cam.tPitch = ISO.pitch; }
  else { normalizeYaw(); cam.tYaw = ISO.yaw; }
  refreshUI();
});
$('frontBtn').addEventListener('click', () => {
  cam.spin = false; cam.front = !cam.front;
  const v = cam.front ? FRONT : ISO;
  normalizeYaw();
  cam.tYaw = v.yaw; cam.tPitch = v.pitch;
  refreshUI();
});
$('zoomIn').addEventListener('click', () => { S.zoom = Math.min(1.8, Math.round((S.zoom + 0.1) * 10) / 10); save(); refreshUI(); });
$('zoomOut').addEventListener('click', () => { S.zoom = Math.max(0.5, Math.round((S.zoom - 0.1) * 10) / 10); save(); refreshUI(); });
$('wobble').addEventListener('input', e => { S.wobble = +e.target.value; e.target.style.setProperty('--p', S.wobble + '%'); save(); });
for (const [name, col] of Object.entries(COLOURS)) {
  const b = document.createElement('button');
  b.className = 'swatch'; b.dataset.c = name; b.style.background = col; b.setAttribute('aria-label', name);
  b.addEventListener('click', () => { S.colour = name; save(); refreshUI(); });
  $('swatches').appendChild(b);
}
$('soundBtn').addEventListener('click', () => { S.sound = !S.sound; if (!S.sound) moveHum(false); save(); refreshUI(); });
$('mineBtn').addEventListener('click', () => {
  S.mine++;
  let h = '';
  const zeros = Math.floor(S.mine / MINE_CLICKS * 8);
  for (let i = 0; i < 32; i++) h += i < zeros ? '0' : '0123456789abcdef'[Math.floor(Math.random() * 16)];
  const el = $('mineHash');
  sfx.hash();
  if (S.mine >= MINE_CLICKS) {
    S.mine = 0; S.sats += COST;
    el.textContent = '00000000' + h.slice(8) + '  ✓ BLOCK FOUND +100 sats';
    el.classList.add('found'); bump('sats'); sfx.win();
    toast('⛏ ブロック発見！ +100 sats');
  } else { el.textContent = h; el.classList.remove('found'); }
  save(); refreshUI();
});
$('copyLn').addEventListener('click', () => {
  const t = 'brashridge65@walletofsatoshi.com';
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('⚡ コピーしました。ありがとう🙏'), () => toast(t));
});

// on the figure: drag to aim while playing, otherwise drag to orbit; tap to drop / take the prize
let drag = null;
cv.addEventListener('pointerdown', e => {
  drag = { x: e.clientX, y: e.clientY, cx: claw.x, cz: claw.z, yaw: cam.tYaw, moved: false };
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
  if (!drag.moved) return;
  if (mode === 'ready') {
    const ax = screenAxes(), k = 1 / cam.s;
    const ix = dx * k, iy = -dy * k / Math.max(0.35, sp_);
    claw.x = Math.max(RANGE.x0, Math.min(RANGE.x1, drag.cx + ax.rx * ix + ax.ax * iy));
    claw.z = Math.max(RANGE.z0, Math.min(RANGE.z1, drag.cz + ax.rz * ix + ax.az * iy));
  } else {
    if (cam.spin || cam.front) { cam.spin = false; cam.front = false; cam.tPitch = ISO.pitch; refreshUI(); }
    cam.tYaw = drag.yaw + dx * 0.01; cam.yaw = cam.tYaw;
  }
});
cv.addEventListener('pointerup', () => {
  if (drag && !drag.moved) {
    if (mode === 'ready') doDrop();
    else if (mode === 'idle' && S.tray.length) takePrize();
  }
  drag = null;
});

window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (!$('winModal').hidden) {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); closeWin(false); }
    return;
  }
  const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  if (map[e.code]) { input[map[e.code]] = true; e.preventDefault(); audio(); return; }
  if (e.repeat) return;
  if (e.code === 'Space') { e.preventDefault(); if (mode === 'ready') doDrop(); else if (mode === 'idle') insertCoin(); }
  else if (e.code === 'Enter') { e.preventDefault(); if (mode === 'idle') insertCoin(); }
  else if (e.code === 'KeyT') takePrize();
});
window.addEventListener('keyup', e => {
  const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  if (map[e.code]) input[map[e.code]] = false;
});
window.addEventListener('blur', () => { input.left = input.right = input.up = input.down = false; moveHum(false); });
window.addEventListener('resize', resize);
// buttons shouldn't keep focus, so Space always means DROP
document.addEventListener('click', e => { if (e.target.closest('button')) e.target.closest('button').blur(); });

// ---------- boot ----------
function settle() {
  for (let i = 0; i < 900; i++) physics();
  prizes = prizes.filter(p => !inHole(p) && p.y > FLOOR);
  for (const p of prizes) { p.px = p.x; p.py = p.y; p.pz = p.z; }
}
(function boot() {
  resize();
  restock(23, false);
  settle();
  const today = new Date().toISOString().slice(0, 10);
  if (S.lastDaily !== today) {
    const first = !S.lastDaily;
    S.lastDaily = today;
    if (!first) { S.sats += DAILY_BONUS; setTimeout(() => toast(`☀️ デイリーボーナス +${DAILY_BONUS} sats`), 800); }
    else setTimeout(() => toast('ようこそ！ 1,000 sats でスタート。Insert coin を押してね'), 800);
  }
  save(); refreshUI(); renderTicker(); renderShelf(true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => renderShelf(true));
  requestAnimationFrame(frame);
})();
