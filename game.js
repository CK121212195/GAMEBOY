'use strict';
/* SATOSHI CATCHER — crypto claw machine. No dependencies. */

// ---------- constants ----------
const W = 480, H = 640;
const RAIL_Y = 36;
const FLOOR_Y = 608;
const CHUTE_X = 120;          // barrier between prize chute (left) and pit (right)
const BARRIER_TOP = 445;
const HOME_X = 62;
const MIN_X = 62, MAX_X = 444;
const COST = 100;
const PITY_MAX = 7;
const HALVING_EVERY = 21;
const FAUCET_AMOUNT = 300;
const FAUCET_COOLDOWN = 20000;
const DAILY_BONUS = 500;
const PLAY_TIME = 20;
const STEP = 1 / 120;

const RARITY = {
  C: { label: 'COMMON', color: '#b8c4d6' },
  R: { label: 'RARE', color: '#4cc9f0' },
  E: { label: 'EPIC', color: '#c77dff' },
  L: { label: 'LEGENDARY', color: '#ffb703' },
  M: { label: 'MYTHIC', color: '#ff4d6d' },
};

const ITEMS = {
  SATS:    { name: 'サトシ⚡ちゃん', ticker: 'SATS', rarity: 'C', value: 60,   r: 20, grip: .74, w: 18, color: '#f7931a', desc: '1億分の1BTC。小さいけど積もればデカい。ライトニングで光速移動。' },
  DOGE:    { name: 'ドージ犬',       ticker: 'DOGE', rarity: 'C', value: 110,  r: 28, grip: .62, w: 15, color: '#d9b84a', desc: 'Much plush. Very fluffy. Wow. 有名人のひとことで跳ねる。' },
  PEPE:    { name: 'カエルのPEPE',   ticker: 'PEPE', rarity: 'C', value: 90,   r: 26, grip: .64, w: 13, color: '#4fa83d', desc: 'ミームの化身。価値はだいたい雰囲気で決まる。' },
  ADA:     { name: 'エイダ',         ticker: 'ADA',  rarity: 'C', value: 120,  r: 25, grip: .58, w: 12, color: '#2a5bd7', desc: '論文を読んでから動くタイプ。査読済みのふわふわ。' },
  XRP:     { name: 'リップルくん',   ticker: 'XRP',  rarity: 'R', value: 170,  r: 26, grip: .52, w: 10, color: '#2b3440', desc: '送金がとにかく速い。裁判ニュースに一喜一憂。' },
  SOL:     { name: 'ソラナ',         ticker: 'SOL',  rarity: 'R', value: 260,  r: 27, grip: .48, w: 9,  color: '#9945ff', desc: '高速チェーンのグラデぬい。たまに止まって寝る。' },
  RUG:     { name: 'ラグプル絨毯',   ticker: 'RUG',  rarity: 'R', value: 0,    r: 26, grip: .62, w: 6,  color: '#b5172f', desc: '取った瞬間に開発者が逃げた。価値は永遠に0。…でも図鑑は埋まる。' },
  ETH:     { name: 'イーサ',         ticker: 'ETH',  rarity: 'E', value: 450,  r: 30, grip: .40, w: 6,  color: '#627eea', desc: 'ワールドコンピューターの化身。ガス代は気にしないで。' },
  COLD:    { name: 'コールドウォレット', ticker: 'COLD', rarity: 'E', value: 520, r: 24, grip: .45, w: 3, color: '#3d4252', desc: 'Not your keys, not your coins. 秘密鍵をそっと守る。' },
  BTC:     { name: 'ビットコイン',   ticker: 'BTC',  rarity: 'L', value: 900,  r: 34, grip: .30, w: 3,  color: '#f7931a', desc: 'デジタルゴールド。重くて取りにくい。それがまたいい。' },
  GENESIS: { name: 'ジェネシスブロック', ticker: 'BLK0', rarity: 'M', value: 3000, r: 30, grip: .24, w: .8, color: '#ffd166', desc: '2009年1月3日、すべてはここから。「The Times 03/Jan/2009 Chancellor on brink of second bailout for banks」' },
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
const SAVE_KEY = 'satoshi-catcher-v1';
function defaultState() {
  return { sats: 1000, bag: [], dex: {}, plays: 0, wins: 0, streak: 0, bestStreak: 0, pity: 0, fever: 0, lastDaily: '', faucetAt: 0, sound: true, bagSeq: 1, earned: 0 };
}
let S = defaultState();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) S = Object.assign(defaultState(), JSON.parse(raw));
} catch (e) { /* storage unavailable: play without saving */ }
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
}

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
    k.m = k.m * Math.exp(gauss() * vol) + (1 - k.m) * 0.015;
    k.m = Math.min(6, Math.max(0.15, k.m));
  }
}
function fireNews() {
  const n = NEWS[Math.floor(Math.random() * NEWS.length)];
  const targets = n.t === 'ALL' ? TYPES.filter(t => t !== 'RUG') : [n.t];
  for (const t of targets) market[t].m = Math.min(6, Math.max(0.15, market[t].m * n.m));
  lastNews = n.text;
  toast(n.text);
  renderTicker();
  if (!document.getElementById('bagModal').hidden) renderBag();
}
function renderTicker() {
  const el = document.getElementById('ticker');
  let html = '';
  if (lastNews) html += `<span class="news">BREAKING: ${lastNews}</span>`;
  for (const t of TYPES) {
    const p = pct(t);
    const cls = p >= 0 ? 'up' : 'down';
    html += `<span>${ITEMS[t].ticker} ${priceOf(t).toLocaleString()} sats <b class="${cls}">${p >= 0 ? '▲' : '▼'}${Math.abs(p).toFixed(1)}%</b></span>`;
  }
  el.innerHTML = html;
}

// ---------- audio ----------
let actx = null;
function audio() {
  if (!S.sound) return null;
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(freq, dur, type = 'square', vol = 0.06, slide = 0, delay = 0) {
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
  coin() { tone(988, .08, 'square', .07); tone(1319, .28, 'square', .07, 0, .08); },
  drop() { tone(520, .5, 'sawtooth', .03, 180); },
  clank() { tone(140, .09, 'square', .08, 60); tone(900, .05, 'triangle', .05, 300, .02); },
  lift() { tone(180, .7, 'sawtooth', .025, 420); },
  slip() { tone(600, .35, 'triangle', .07, 160); },
  miss() { tone(392, .18, 'square', .05); tone(311, .4, 'square', .05, 0, .18); },
  win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .16, 'square', .06, 0, i * .07)); tone(2093, .5, 'triangle', .05, 0, .45); },
  legend() { [392, 523, 659, 784, 1047, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, .18, 'square', .06, 0, i * .08)); },
  rug() { tone(700, .6, 'sawtooth', .05, 90); tone(200, .5, 'square', .04, 60, .3); },
  sell() { tone(1568, .06, 'square', .05); tone(2093, .2, 'square', .05, 0, .06); },
  tick() { tone(1200, .03, 'square', .025); },
  fanfare() { [262, 330, 392, 523, 392, 523, 659, 784].forEach((f, i) => tone(f, .14, 'sawtooth', .04, 0, i * .09)); },
};
let moveOsc = null, moveGain = null;
function moveHum(on) {
  const a = on ? audio() : actx;
  if (!a) return;
  if (!moveOsc) {
    moveOsc = a.createOscillator(); moveGain = a.createGain();
    moveOsc.type = 'sawtooth'; moveOsc.frequency.value = 70;
    moveGain.gain.value = 0;
    moveOsc.connect(moveGain).connect(a.destination); moveOsc.start();
  }
  moveGain.gain.setTargetAtTime(on && S.sound ? 0.02 : 0, a.currentTime, 0.03);
}
function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } }

// ---------- canvas ----------
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let DPR = 1;
function resize() {
  DPR = Math.min(2.5, window.devicePixelRatio || 1);
  cv.width = W * DPR; cv.height = H * DPR;
}
resize();
window.addEventListener('resize', resize);

// ---------- sprite drawing ----------
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function face(c, r, y = 0.4, eye = 0.075) {
  c.fillStyle = '#1b1020';
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * r * 0.28, r * y, r * eye, r * eye * 1.25, 0, 0, 7); c.fill(); }
  c.fillStyle = '#fff';
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * r * 0.28 - r * 0.02, r * (y - 0.04), r * eye * 0.38, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(255,110,150,.55)';
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * r * 0.5, r * (y + 0.1), r * 0.1, r * 0.06, 0, 0, 7); c.fill(); }
  c.strokeStyle = '#1b1020'; c.lineWidth = Math.max(1, r * 0.04); c.lineCap = 'round';
  c.beginPath(); c.arc(0, r * (y + 0.04), r * 0.07, 0.2, Math.PI - 0.2); c.stroke();
}
function plushBall(c, r, col) {
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, shade(col, 0.45)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.35));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  c.strokeStyle = shade(col, -0.5); c.lineWidth = Math.max(1.2, r * 0.06); c.stroke();
  c.setLineDash([r * 0.12, r * 0.1]); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1, r * 0.035);
  c.beginPath(); c.arc(0, 0, r * 0.84, 0, 7); c.stroke(); c.setLineDash([]);
}
function symbol(c, txt, r, size = 0.72, y = -0.12, col = '#fff') {
  c.font = `900 ${r * size}px "Arial Black", Arial, "Hiragino Sans", sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = r * 0.1; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineJoin = 'round';
  c.strokeText(txt, 0, r * y); c.fillStyle = col; c.fillText(txt, 0, r * y);
}
function drawItem(c, type, r) {
  const it = ITEMS[type];
  c.save();
  switch (type) {
    case 'BTC': plushBall(c, r, it.color); symbol(c, '₿', r, 0.95, -0.12); face(c, r, 0.48, 0.065); break;
    case 'SATS': {
      plushBall(c, r, '#ffb347');
      c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = r * 0.08; c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(r * 0.12, -r * 0.62); c.lineTo(-r * 0.32, r * 0.02); c.lineTo(-r * 0.02, r * 0.02);
      c.lineTo(-r * 0.14, r * 0.5); c.lineTo(r * 0.32, -r * 0.12); c.lineTo(r * 0.02, -r * 0.12); c.closePath();
      c.stroke(); c.fill();
      break;
    }
    case 'ETH': {
      plushBall(c, r, it.color);
      const s = r * 0.62;
      c.translate(0, -r * 0.1);
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.55, s * 0.05); c.lineTo(0, s * 0.32); c.lineTo(-s * 0.55, s * 0.05); c.closePath(); c.fill();
      c.fillStyle = '#c9d3ff'; c.beginPath(); c.moveTo(0, s * 0.45); c.lineTo(s * 0.55, s * 0.17); c.lineTo(0, s * 0.95); c.lineTo(-s * 0.55, s * 0.17); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.55, s * 0.05); c.lineTo(0, s * 0.32); c.closePath(); c.fill();
      break;
    }
    case 'SOL': {
      const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#9945ff'); g.addColorStop(1, '#14f195');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      const g2 = c.createRadialGradient(-r * 0.35, -r * 0.4, 1, 0, 0, r); g2.addColorStop(0, 'rgba(255,255,255,.45)'); g2.addColorStop(1, 'rgba(0,0,0,.25)');
      c.fillStyle = g2; c.fill();
      c.setLineDash([r * 0.12, r * 0.1]); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = r * 0.035; c.beginPath(); c.arc(0, 0, r * 0.84, 0, 7); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#fff';
      for (let i = -1; i <= 1; i++) {
        const y = i * r * 0.24 - r * 0.12, w = r * 0.85, h = r * 0.14, sk = r * 0.14 * (i === 0 ? -1 : 1);
        c.beginPath(); c.moveTo(-w / 2 + sk, y - h / 2); c.lineTo(w / 2 + sk, y - h / 2); c.lineTo(w / 2 - sk, y + h / 2); c.lineTo(-w / 2 - sk, y + h / 2); c.closePath(); c.fill();
      }
      face(c, r, 0.5, 0.06);
      break;
    }
    case 'XRP': plushBall(c, r, it.color); symbol(c, '✕', r, 0.8, -0.12); face(c, r, 0.48, 0.065); break;
    case 'ADA': plushBall(c, r, it.color); symbol(c, '₳', r, 0.85, -0.12); face(c, r, 0.48, 0.065); break;
    case 'DOGE': {
      plushBall(c, r, it.color);
      c.fillStyle = shade(it.color, -0.25);
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * r * 0.45, -r * 0.7); c.lineTo(s * r * 0.85, -r * 0.95); c.lineTo(s * r * 0.8, -r * 0.4); c.closePath(); c.fill(); }
      symbol(c, 'Ð', r, 0.75, -0.1);
      face(c, r, 0.45, 0.065);
      break;
    }
    case 'PEPE': {
      plushBall(c, r, it.color);
      for (const s of [-1, 1]) {
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(s * r * 0.33, -r * 0.3, r * 0.3, r * 0.24, 0, 0, 7); c.fill();
        c.strokeStyle = shade(it.color, -0.5); c.lineWidth = r * 0.05; c.stroke();
        c.fillStyle = '#111'; c.beginPath(); c.arc(s * r * 0.36 + r * 0.06, -r * 0.28, r * 0.11, 0, 7); c.fill();
      }
      c.strokeStyle = '#a3402c'; c.lineWidth = r * 0.12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-r * 0.45, r * 0.32); c.quadraticCurveTo(0, r * 0.52, r * 0.45, r * 0.32); c.stroke();
      break;
    }
    case 'RUG': {
      c.fillStyle = it.color; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      c.strokeStyle = '#ffd166'; c.lineWidth = r * 0.09;
      c.beginPath();
      for (let a = 0; a < Math.PI * 7; a += 0.2) { const rr2 = r * 0.08 + a * r * 0.038; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
      c.stroke();
      c.strokeStyle = shade(it.color, -0.45); c.lineWidth = r * 0.07; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
      c.font = `900 ${r * 0.42}px "Arial Black", Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = r * 0.08; c.strokeText('RUG', 0, 0); c.fillText('RUG', 0, 0);
      break;
    }
    case 'COLD': {
      const w = r * 1.85, h = r * 1.45;
      const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#6b7287'); g.addColorStop(1, '#2a2e3b');
      c.fillStyle = g; rr(c, -w / 2, -h / 2, w, h, r * 0.3); c.fill();
      c.strokeStyle = '#15171f'; c.lineWidth = r * 0.08; c.stroke();
      c.fillStyle = '#9ef0ff'; rr(c, -w * 0.36, -h * 0.34, w * 0.72, h * 0.38, r * 0.08); c.fill();
      c.fillStyle = '#0b3b48'; c.font = `900 ${r * 0.3}px ui-monospace, monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🔑 OK', 0, -h * 0.15);
      c.fillStyle = '#f7931a'; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * w * 0.2, h * 0.28, r * 0.13, 0, 7); c.fill(); }
      break;
    }
    case 'GENESIS': {
      const s = r * 0.92;
      c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.9, -s * 0.5); c.lineTo(0, 0); c.lineTo(-s * 0.9, -s * 0.5); c.closePath(); c.fill();
      c.fillStyle = '#e09f1f'; c.beginPath(); c.moveTo(-s * 0.9, -s * 0.5); c.lineTo(0, 0); c.lineTo(0, s); c.lineTo(-s * 0.9, s * 0.5); c.closePath(); c.fill();
      c.fillStyle = '#b36b00'; c.beginPath(); c.moveTo(s * 0.9, -s * 0.5); c.lineTo(0, 0); c.lineTo(0, s); c.lineTo(s * 0.9, s * 0.5); c.closePath(); c.fill();
      c.strokeStyle = '#5a3500'; c.lineWidth = r * 0.05; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.9, -s * 0.5); c.lineTo(s * 0.9, s * 0.5); c.lineTo(0, s); c.lineTo(-s * 0.9, s * 0.5); c.lineTo(-s * 0.9, -s * 0.5); c.closePath(); c.moveTo(0, 0); c.lineTo(0, s); c.moveTo(0, 0); c.lineTo(s * 0.9, -s * 0.5); c.moveTo(0, 0); c.lineTo(-s * 0.9, -s * 0.5); c.stroke();
      c.fillStyle = '#5a3500'; c.font = `900 ${r * 0.34}px "Arial Black", Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('#0', 0, -s * 0.48);
      c.save(); c.transform(1, 0.55, 0, 1, 0, 0); c.font = `900 ${r * 0.28}px "Arial Black", Arial, sans-serif`; c.fillStyle = '#fff4d0'; c.fillText('₿', -s * 0.45, s * 0.5); c.restore();
      break;
    }
  }
  c.restore();
}
const spriteCache = {};
function sprite(type) {
  const key = type + '@' + DPR;
  if (spriteCache[key]) return spriteCache[key];
  const r = ITEMS[type].r, pad = 10, sc = DPR * 1.5;
  const size = (r + pad) * 2;
  const oc = document.createElement('canvas');
  oc.width = oc.height = Math.ceil(size * sc);
  const c = oc.getContext('2d');
  c.scale(sc, sc); c.translate(size / 2, size / 2);
  // soft shadow
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(2, r * 0.9, r * 0.8, r * 0.22, 0, 0, 7); c.fill();
  drawItem(c, type, r);
  return (spriteCache[key] = { img: oc, size });
}
function paintIcon(canvas, type, locked) {
  const c = canvas.getContext('2d');
  const s = canvas.width;
  c.clearRect(0, 0, s, s);
  c.save(); c.translate(s / 2, s / 2);
  const r = ITEMS[type].r, scale = (s * 0.4) / r;
  c.scale(scale, scale);
  drawItem(c, type, r);
  c.restore();
  canvas.classList.toggle('locked', !!locked);
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
function spawn(type, x, y) {
  const r = ITEMS[type].r;
  const p = { id: uid++, type, r, x, y, px: x + (Math.random() - 0.5), py: y, a: Math.random() * 6.28, inv: 1 / (r * r / 600 * (type === 'BTC' || type === 'GENESIS' ? 1.6 : 1)), held: false };
  prizes.push(p);
  return p;
}
function restock(n, fromTop) {
  for (let i = 0; i < n; i++) {
    const t = pickType();
    const x = CHUTE_X + 70 + Math.random() * (W - CHUTE_X - 100);
    const y = fromTop ? -40 - i * 55 : FLOOR_Y - 30 - Math.floor(i / 7) * 52 - Math.random() * 10;
    spawn(t, fromTop ? x : CHUTE_X + 50 + (i % 7) * 46 + Math.random() * 6, y);
  }
}

// ---------- claw ----------
const claw = { x: HOME_X, len: 0, open: 1, sway: 0, swayV: 0, held: null, plan: null, light: 0 };
function hubY() { return RAIL_Y + 34 + claw.len; }
const MAX_LEN = FLOOR_Y - 60 - (RAIL_Y + 34);
function prongs() {
  const hx = claw.x + claw.sway, hy = hubY();
  const out = [];
  for (const side of [-1, 1]) {
    const a = 0.38 + claw.open * 0.6;
    const a2 = a - 0.75;
    const j = { x: hx + side * Math.sin(a) * 26, y: hy + 8 + Math.cos(a) * 26 };
    const t = { x: j.x + side * Math.sin(a2) * 24, y: j.y + Math.cos(a2) * 24 };
    out.push({ side, base: { x: hx + side * 6, y: hy + 8 }, j, t });
  }
  return out;
}
function colliders() {
  const hx = claw.x + claw.sway, hy = hubY();
  const list = [{ x: hx, y: hy, r: 15 }];
  for (const p of prongs()) {
    list.push({ x: (p.base.x + p.j.x) / 2, y: (p.base.y + p.j.y) / 2, r: 5 });
    list.push({ x: p.j.x, y: p.j.y, r: 5 });
    list.push({ x: (p.j.x + p.t.x) / 2, y: (p.j.y + p.t.y) / 2, r: 5 });
    list.push({ x: p.t.x, y: p.t.y, r: 5 });
  }
  return list;
}

// ---------- physics (position based) ----------
function physics() {
  const g = 1500 * STEP * STEP;
  for (const p of prizes) {
    if (p.held) continue;
    const vx = (p.x - p.px) * 0.996, vy = (p.y - p.py) * 0.996;
    p.px = p.x; p.py = p.y;
    p.x += vx; p.y += vy + g;
  }
  const cols = colliders();
  const n = prizes.length;
  for (let it = 0; it < 7; it++) {
    for (let i = 0; i < n; i++) {
      const a = prizes[i];
      for (let j = i + 1; j < n; j++) {
        const b = prizes[j];
        const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r;
        if (Math.abs(dx) >= min || Math.abs(dy) >= min) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2) || 0.01;
        const wa = a.held ? 0 : a.inv, wb = b.held ? 0 : b.inv, ws = wa + wb;
        if (!ws) continue;
        const o = (min - d) / d / ws;
        a.x -= dx * o * wa; a.y -= dy * o * wa;
        b.x += dx * o * wb; b.y += dy * o * wb;
      }
    }
    for (const p of prizes) {
      if (p.held) continue;
      for (const c of cols) {
        const dx = p.x - c.x, dy = p.y - c.y, min = p.r + c.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2) || 0.01;
        p.x += dx / d * (min - d); p.y += dy / d * (min - d);
      }
      bounds(p);
    }
  }
  for (const p of prizes) {
    if (p.held) continue;
    if (p.x > CHUTE_X && p.y >= FLOOR_Y - p.r - 0.5) {
      p.px = p.x - (p.x - p.px) * 0.86; // floor friction
    }
    p.a += (p.x - p.px) / p.r;
  }
}
function bounds(p) {
  if (p.x > W - 6 - p.r) p.x = W - 6 - p.r;
  if (p.x < 6 + p.r) p.x = 6 + p.r;
  if (p.x >= CHUTE_X && p.y > FLOOR_Y - p.r) p.y = FLOOR_Y - p.r;
  // barrier: vertical segment with rounded top
  const cy = Math.max(BARRIER_TOP, Math.min(H + 100, p.y));
  const dx = p.x - CHUTE_X, dy = p.y - cy, min = p.r + 5;
  const d2 = dx * dx + dy * dy;
  if (d2 < min * min) {
    let d = Math.sqrt(d2);
    let nx, ny;
    if (d < 0.01) { nx = 1; ny = 0; d = 0; } else { nx = dx / d; ny = dy / d; }
    p.x += nx * (min - d); p.y += ny * (min - d);
  }
}

// ---------- game state ----------
let mode = 'attract';   // attract | ready | drop | close | hold | lift | shake | carry | release
let phaseT = 0, timer = 0, playWon = false, playFever = false, liftFrom = 0;
const input = { left: false, right: false };
const fx = { parts: [], texts: [], shake: 0, flash: 0 };
let winQueue = [];
let lastTimerTick = 0;

function insertCoin() {
  if (mode !== 'attract') return;
  if (S.sats < COST) { toast('残高不足… 🚰 Faucet で sats をもらおう'); pulseFaucet(); sfx.miss(); return; }
  S.sats -= COST; S.plays++;
  bumpWallet();
  sfx.coin();
  playWon = false;
  if (S.plays % HALVING_EVERY === 0) {
    S.fever = 3;
    banner('⛏ HALVING!', 'BULL RUN 3プレイ：アームのパワーUP！');
    sfx.fanfare();
  }
  playFever = S.fever > 0;
  mode = 'ready'; timer = PLAY_TIME; lastTimerTick = PLAY_TIME;
  addText(W / 2, 240, `-${COST} sats`, '#ffd166', 26);
  save(); refreshUI();
}
function doDrop() {
  if (mode !== 'ready') return;
  mode = 'drop'; moveHum(false); sfx.drop(); refreshUI();
}
function probeHit() {
  const hx = claw.x + claw.sway, hy = hubY() + 22;
  for (const p of prizes) {
    if (p.held) continue;
    const dx = p.x - hx, dy = p.y - hy;
    if (dx * dx + dy * dy < (p.r + 12) * (p.r + 12)) return true;
  }
  return false;
}
function decideGrab() {
  const hx = claw.x, hy = hubY();
  let best = null, bestD = 1e9;
  for (const p of prizes) {
    if (p.held) continue;
    const dx = Math.abs(p.x - hx), dy = p.y - hy;
    if (dx > p.r + 8 || dy < 6 || dy > 34 + p.r * 1.3) continue;
    const d = Math.hypot(p.x - hx, p.y - (hy + 24 + p.r * 0.55));
    if (d < bestD) { bestD = d; best = p; }
  }
  sfx.clank();
  if (!best) { claw.plan = { kind: 'miss' }; return; }
  const it = ITEMS[best.type];
  const centered = 1 - Math.min(1, Math.abs(best.x - hx) / (best.r + 8));
  let chance = it.grip * (0.4 + 0.6 * centered) + (playFever ? 0.25 : 0);
  if (S.pity >= PITY_MAX) chance = 1;
  chance = Math.min(1, chance);
  const r = Math.random();
  claw.held = best; best.held = true;
  claw.light = 1;
  if (r < chance) claw.plan = { kind: 'win' };
  else if (Math.random() < 0.5) claw.plan = { kind: 'slipLift', at: claw.len * (0.15 + Math.random() * 0.75) };
  else if (Math.random() < 0.3) claw.plan = { kind: 'slipTop' };
  else claw.plan = { kind: 'slipCarry', at: CHUTE_X + 10 + Math.random() * Math.max(10, claw.x - CHUTE_X - 10) };
  buzz(20);
}
function dropHeld(msg) {
  const p = claw.held; if (!p) return;
  p.held = false; claw.held = null;
  p.px = p.x + (mode === 'carry' ? 1.2 : 0) + (Math.random() - 0.5) * 0.6;
  p.py = p.y;
  if (msg) {
    claw.open = 0.35;
    addText(p.x, p.y - p.r - 10, msg, '#ff8fab', 24);
    sfx.slip(); buzz([30, 40, 30]);
  }
}
function heldTarget() {
  const p = claw.held;
  return { x: claw.x + claw.sway, y: hubY() + 24 + p.r * 0.55 };
}

function update(dt) {
  phaseT += dt;
  // claw pendulum sway
  claw.swayV += (-claw.sway * 60 - claw.swayV * 4) * dt;
  claw.sway += claw.swayV * dt;
  claw.light = Math.max(0, claw.light - dt * 2);

  switch (mode) {
    case 'attract':
      claw.open = Math.min(1, claw.open + dt * 2);
      break;
    case 'ready': {
      timer -= dt;
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (dir) {
        const nx = Math.max(MIN_X, Math.min(MAX_X, claw.x + dir * 175 * dt));
        if (nx !== claw.x) claw.swayV -= dir * 40 * dt;
        claw.x = nx;
      }
      moveHum(!!dir);
      if (timer < 5 && Math.ceil(timer) !== Math.ceil(lastTimerTick)) sfx.tick();
      lastTimerTick = timer;
      if (timer <= 0) { timer = 0; doDrop(); }
      break;
    }
    case 'drop':
      claw.len += 270 * dt;
      if (probeHit() || claw.len >= MAX_LEN) {
        claw.len = Math.min(claw.len, MAX_LEN);
        mode = 'close'; phaseT = 0;
      }
      break;
    case 'close':
      claw.open = Math.max(0, claw.open - dt * 1.9);
      if (claw.open <= 0) { decideGrab(); mode = 'hold'; phaseT = 0; }
      break;
    case 'hold':
      if (phaseT > 0.4) { mode = 'lift'; phaseT = 0; liftFrom = claw.len; sfx.lift(); }
      break;
    case 'lift':
      claw.len -= 150 * dt;
      if (claw.held && claw.plan.kind === 'slipLift' && claw.len <= claw.plan.at) dropHeld(pick(['あっ…！', 'スルッ…', 'ぐぬぬ', '握力ぅ…']));
      if (claw.len <= 0) { claw.len = 0; mode = 'shake'; phaseT = 0; claw.swayV += 90; }
      break;
    case 'shake':
      if (claw.held && claw.plan.kind === 'slipTop' && phaseT > 0.12) dropHeld(pick(['ガタン！', 'ゆれた…！', 'そこで!?']));
      if (phaseT > 0.45) { mode = 'carry'; phaseT = 0; }
      break;
    case 'carry':
      claw.x = Math.max(HOME_X, claw.x - 150 * dt);
      if (claw.held && claw.plan.kind === 'slipCarry' && claw.x <= claw.plan.at) dropHeld(pick(['惜しいっ！', 'あと少し…！', 'ノーーー！']));
      if (claw.x <= HOME_X) { mode = 'release'; phaseT = 0; claw.swayV -= 60; }
      break;
    case 'release':
      claw.open = Math.min(1, claw.open + dt * 2.2);
      if (claw.held && claw.open > 0.35) dropHeld(null);
      if (phaseT > 1.5) finishPlay();
      break;
  }
  if (mode !== 'drop' && mode !== 'close' && mode !== 'release' && claw.plan && claw.plan.kind !== 'win' && !claw.held) {
    claw.open = Math.max(0, claw.open - dt * 1.2);
  }
  if (claw.held) {
    const t = heldTarget(), p = claw.held;
    p.x += (t.x - p.x) * Math.min(1, dt * 14);
    p.y += (t.y - p.y) * Math.min(1, dt * 14);
    p.px = p.x; p.py = p.y;
    p.a *= 0.95;
  }
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

function finishPlay() {
  claw.plan = null;
  if (playFever && S.fever > 0) S.fever--;
  if (playWon) {
    S.streak++;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    S.pity = 0;
    if (S.streak >= 2) {
      const bonus = 50 * (S.streak - 1);
      S.sats += bonus; S.earned += bonus;
      addText(W / 2, 200, `🔥 ${S.streak}連続GET！ +${bonus} sats`, '#ffb703', 26);
      bumpWallet();
    }
  } else {
    S.streak = 0;
    S.pity = Math.min(PITY_MAX, S.pity + 1);
    sfx.miss();
    addText(W / 2, 220, S.pity >= PITY_MAX ? '💎 HODLゲージMAX！次は確定！' : pick(['ドンマイ！', 'もう一回！', 'HODLゲージ +1', '次こそ…！']), S.pity >= PITY_MAX ? '#ffd166' : '#a8f0ff', 24);
  }
  if (prizes.length < 18) restock(21 - prizes.length, true);
  mode = 'attract';
  save(); refreshUI();
}

function collect(p) {
  prizes.splice(prizes.indexOf(p), 1);
  if (claw.held === p) claw.held = null;
  const it = ITEMS[p.type];
  const isNew = !S.dex[p.type];
  S.dex[p.type] = (S.dex[p.type] || 0) + 1;
  S.wins++;
  S.bag.push({ id: S.bagSeq++, t: p.type, at: priceOf(p.type) });
  if (mode !== 'attract') playWon = true;
  else { S.pity = 0; } // late roll-in after the play ended still counts
  // juice
  const rare = it.rarity === 'L' || it.rarity === 'M' || it.rarity === 'E';
  for (let i = 0; i < (rare ? 90 : 50); i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, s = 200 + Math.random() * 500;
    fx.parts.push({ x: CHUTE_X / 2, y: H - 40, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.2 + Math.random() * 0.8, max: 2, size: 4 + Math.random() * 5, col: pick(rare ? ['#ffd166', '#f7931a', '#fff', '#ff4fd8'] : ['#ffd166', '#f7931a', '#2ef2ff', '#b6ff3b', '#ff4fd8']), coin: Math.random() < 0.4, rot: Math.random() * 6 });
  }
  fx.shake = rare ? 14 : 8; fx.flash = rare ? 0.8 : 0.4;
  document.getElementById('machine').classList.add('shake');
  setTimeout(() => document.getElementById('machine').classList.remove('shake'), 450);
  const mq = document.getElementById('marquee');
  mq.classList.add('party'); setTimeout(() => mq.classList.remove('party'), 2500);
  if (p.type === 'RUG') sfx.rug(); else if (rare) sfx.legend(); else sfx.win();
  buzz(p.type === 'RUG' ? [200] : [60, 50, 60, 50, 120]);
  addText(CHUTE_X / 2 + 30, H - 120, p.type === 'RUG' ? 'RUGGED!' : 'GET!!', p.type === 'RUG' ? '#ff5470' : '#ffd166', 38);
  winQueue.push({ type: p.type, isNew, bagId: S.bag[S.bag.length - 1].id });
  save(); refreshUI();
  setTimeout(showNextWin, 700);
}

// ---------- effects ----------
function addText(x, y, text, col, size) { fx.texts.push({ x, y, text, col, size, life: 1.6 }); }
function updateFx(dt) {
  for (const p of fx.parts) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += dt * 8; }
  fx.parts = fx.parts.filter(p => p.life > 0 && p.y < H + 20);
  for (const t of fx.texts) { t.y -= 40 * dt; t.life -= dt; }
  fx.texts = fx.texts.filter(t => t.life > 0);
  fx.shake *= Math.pow(0.02, dt);
  fx.flash = Math.max(0, fx.flash - dt * 1.5);
}

// ---------- render ----------
let bgCache = null;
function buildBg() {
  const oc = document.createElement('canvas');
  oc.width = W * DPR; oc.height = H * DPR;
  const c = oc.getContext('2d');
  c.scale(DPR, DPR);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1c0f45'); g.addColorStop(0.6, '#2b1263'); g.addColorStop(1, '#3b1670');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // back wall pattern
  c.save(); c.globalAlpha = 0.07; c.fillStyle = '#fff';
  c.font = '900 30px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const syms = ['₿', 'Ξ', '◎', 'Ð', '₳', '⚡'];
  let k = 0;
  for (let y = 90; y < H; y += 62) for (let x = (y / 62 % 2) * 31; x < W + 40; x += 62) c.fillText(syms[k++ % syms.length], x, y);
  c.restore();
  // spot lights
  for (const x of [140, 340]) {
    const lg = c.createRadialGradient(x, 0, 10, x, 0, 380);
    lg.addColorStop(0, 'rgba(255,240,200,.18)'); lg.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = lg; c.fillRect(0, 0, W, H);
  }
  // floor
  const fg = c.createLinearGradient(0, FLOOR_Y - 20, 0, H);
  fg.addColorStop(0, '#5a2d9c'); fg.addColorStop(1, '#2a0f55');
  c.fillStyle = fg; c.fillRect(CHUTE_X, FLOOR_Y, W - CHUTE_X, H - FLOOR_Y);
  c.fillStyle = '#ff4fd8'; c.fillRect(CHUTE_X, FLOOR_Y, W - CHUTE_X, 3);
  // chute hole
  const hg = c.createLinearGradient(0, BARRIER_TOP, 0, H);
  hg.addColorStop(0, '#0d0420'); hg.addColorStop(1, '#000');
  c.fillStyle = hg; c.fillRect(6, BARRIER_TOP + 40, CHUTE_X - 6, H - BARRIER_TOP - 40);
  c.strokeStyle = '#ffd166'; c.lineWidth = 3; c.setLineDash([10, 8]);
  c.strokeRect(10, BARRIER_TOP + 44, CHUTE_X - 14, H - BARRIER_TOP - 50); c.setLineDash([]);
  c.fillStyle = '#ffd166'; c.font = '900 16px "Arial Black", Arial'; c.textAlign = 'center';
  c.fillText('PRIZE', CHUTE_X / 2 + 3, H - 52);
  c.font = '900 26px Arial'; c.fillText('⬇', CHUTE_X / 2 + 3, H - 22);
  // rail
  c.fillStyle = '#9aa3c7'; c.fillRect(0, RAIL_Y - 8, W, 10);
  c.fillStyle = '#5c6488'; c.fillRect(0, RAIL_Y + 2, W, 4);
  return oc;
}
function render(now) {
  const c = ctx;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!bgCache || bgCache.width !== W * DPR) bgCache = buildBg();
  c.save();
  if (fx.shake > 0.3) c.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
  c.drawImage(bgCache, 0, 0, W, H);

  // drop guide (where the claw will go)
  if (mode === 'ready') {
    const hx = claw.x;
    const lg = c.createLinearGradient(0, hubY(), 0, FLOOR_Y);
    lg.addColorStop(0, 'rgba(46,242,255,.0)'); lg.addColorStop(1, 'rgba(46,242,255,.22)');
    c.fillStyle = lg; c.fillRect(hx - 18, hubY() + 30, 36, FLOOR_Y - hubY() - 30);
    c.strokeStyle = 'rgba(46,242,255,.5)'; c.setLineDash([4, 6]); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(hx, hubY() + 40); c.lineTo(hx, FLOOR_Y); c.stroke(); c.setLineDash([]);
  }

  // prizes
  for (const p of prizes) {
    const s = sprite(p.type);
    c.save(); c.translate(p.x, p.y); c.rotate(p.type === 'COLD' || p.type === 'GENESIS' ? p.a * 0.25 : Math.sin(p.a) * 0.35);
    c.drawImage(s.img, -s.size / 2, -s.size / 2, s.size, s.size);
    c.restore();
  }

  // barrier (acrylic)
  c.fillStyle = 'rgba(180,230,255,.25)'; c.fillRect(CHUTE_X - 5, BARRIER_TOP, 10, H - BARRIER_TOP);
  c.fillStyle = 'rgba(220,245,255,.8)'; c.beginPath(); c.arc(CHUTE_X, BARRIER_TOP, 5, 0, 7); c.fill();
  c.fillRect(CHUTE_X - 1, BARRIER_TOP, 2, H - BARRIER_TOP);

  drawClaw(c, now);

  // effects
  for (const p of fx.parts) {
    c.globalAlpha = Math.min(1, p.life);
    c.fillStyle = p.col;
    if (p.coin) {
      c.save(); c.translate(p.x, p.y); c.scale(Math.cos(p.rot), 1);
      c.beginPath(); c.arc(0, 0, p.size * 1.3, 0, 7); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)'; c.font = `900 ${p.size * 1.8}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₿', 0, 1);
      c.restore();
    } else c.fillRect(p.x, p.y, p.size, p.size * 0.6);
  }
  c.globalAlpha = 1;
  for (const t of fx.texts) {
    c.globalAlpha = Math.min(1, t.life * 1.5);
    c.font = `900 ${t.size}px "Dela Gothic One", "M PLUS Rounded 1c", sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 6; c.strokeStyle = 'rgba(20,6,50,.9)'; c.lineJoin = 'round';
    c.strokeText(t.text, t.x, t.y); c.fillStyle = t.col; c.fillText(t.text, t.x, t.y);
  }
  c.globalAlpha = 1;

  // glass reflection
  const gl = c.createLinearGradient(0, 0, W, H);
  gl.addColorStop(0, 'rgba(255,255,255,.08)'); gl.addColorStop(0.3, 'rgba(255,255,255,0)'); gl.addColorStop(0.62, 'rgba(255,255,255,0)'); gl.addColorStop(0.68, 'rgba(255,255,255,.06)'); gl.addColorStop(0.75, 'rgba(255,255,255,0)');
  c.fillStyle = gl; c.fillRect(0, 0, W, H);
  if (fx.flash > 0) { c.fillStyle = `rgba(255,230,160,${fx.flash * 0.35})`; c.fillRect(0, 0, W, H); }
  c.restore();

  // overlays
  if (mode === 'attract') {
    const blink = Math.floor(now / 500) % 2 === 0;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (blink) {
      c.font = '400 34px "Dela Gothic One", sans-serif';
      c.lineWidth = 8; c.strokeStyle = '#2a0b4f'; c.strokeText('INSERT COIN', W / 2 + 30, 170);
      c.fillStyle = '#ffd166'; c.fillText('INSERT COIN', W / 2 + 30, 170);
    }
    c.font = '800 15px "M PLUS Rounded 1c", sans-serif';
    c.lineWidth = 5; c.strokeStyle = '#2a0b4f';
    const msg = S.sats >= COST ? `1プレイ ${COST} sats ・ Enter / COINボタン` : '残高不足 → 🚰 Faucetへ';
    c.strokeText(msg, W / 2 + 30, 208); c.fillStyle = '#fff'; c.fillText(msg, W / 2 + 30, 208);
  }
  if (mode === 'ready') {
    const t = Math.ceil(timer);
    c.font = '400 30px "Dela Gothic One", sans-serif'; c.textAlign = 'right'; c.textBaseline = 'top';
    c.lineWidth = 6; c.strokeStyle = '#2a0b4f'; c.strokeText(String(t), W - 14, 52);
    c.fillStyle = t <= 5 ? '#ff5470' : '#2ef2ff'; c.fillText(String(t), W - 14, 52);
  }
}
function drawClaw(c, now) {
  const hx = claw.x + claw.sway, hy = hubY();
  // carriage
  c.fillStyle = '#d7dcef'; rr(c, claw.x - 26, RAIL_Y - 14, 52, 22, 6); c.fill();
  c.fillStyle = '#7d86ad'; c.fillRect(claw.x - 26, RAIL_Y + 2, 52, 5);
  c.fillStyle = mode === 'ready' ? (Math.floor(now / 250) % 2 ? '#ff4fd8' : '#2ef2ff') : '#ffb703';
  c.beginPath(); c.arc(claw.x, RAIL_Y - 3, 4, 0, 7); c.fill();
  // cable
  c.strokeStyle = '#c9cfe6'; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(claw.x, RAIL_Y + 6); c.lineTo(hx, hy - 12); c.stroke();
  // prongs
  const ps = prongs();
  for (const p of ps) {
    c.strokeStyle = '#8e97bd'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(p.base.x, p.base.y); c.lineTo(p.j.x, p.j.y); c.lineTo(p.t.x, p.t.y); c.stroke();
    c.strokeStyle = '#eef1ff'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(p.base.x, p.base.y); c.lineTo(p.j.x, p.j.y); c.lineTo(p.t.x, p.t.y); c.stroke();
    c.fillStyle = '#ff4fd8'; c.beginPath(); c.arc(p.t.x, p.t.y, 4, 0, 7); c.fill();
  }
  // middle (back) prong
  const a = 0.38 + claw.open * 0.6;
  c.strokeStyle = 'rgba(142,151,189,.8)'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(hx, hy + 8); c.lineTo(hx, hy + 8 + Math.cos(a) * 26 + 18); c.stroke();
  // hub
  const hg = c.createLinearGradient(hx - 18, hy - 14, hx + 18, hy + 14);
  hg.addColorStop(0, '#f2f4ff'); hg.addColorStop(1, '#8e97bd');
  c.fillStyle = hg; rr(c, hx - 18, hy - 14, 36, 26, 9); c.fill();
  c.strokeStyle = '#5c6488'; c.lineWidth = 2; c.stroke();
  c.fillStyle = claw.light > 0 ? `rgba(255,209,102,${0.5 + claw.light * 0.5})` : (playFever && mode !== 'attract' ? '#ff3d3d' : '#f7931a');
  c.beginPath(); c.arc(hx, hy - 1, 6, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.font = '900 8px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₿', hx, hy - 1);
}

// ---------- loop ----------
let last = performance.now(), acc = 0, tickAcc = 0, newsAt = performance.now() + 15000;
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.1) dt = 0.1;
  acc += dt;
  while (acc >= STEP) {
    update(STEP);
    physics();
    for (const p of prizes.slice()) {
      if (!p.held && p.x < CHUTE_X - 2 && p.y > BARRIER_TOP + p.r + 18) collect(p);
      else if (p.y > H + 80) prizes.splice(prizes.indexOf(p), 1);
    }
    acc -= STEP;
  }
  updateFx(dt);
  tickAcc += dt;
  if (tickAcc > 1.5) { tickAcc = 0; marketTick(); renderTicker(); if (!document.getElementById('bagModal').hidden) renderBag(); }
  if (now > newsAt) { fireNews(); newsAt = now + 20000 + Math.random() * 20000; }
  render(now);
  requestAnimationFrame(frame);
}

// ---------- UI ----------
const $ = id => document.getElementById(id);
function bumpWallet() {
  const el = $('sats').parentElement;
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
function refreshUI() {
  $('sats').textContent = S.sats.toLocaleString();
  const f = $('pityFill');
  f.style.width = (S.pity / PITY_MAX * 100) + '%';
  f.classList.toggle('full', S.pity >= PITY_MAX);
  $('halving').textContent = `${HALVING_EVERY - (S.plays % HALVING_EVERY)}`;
  $('bagCount').textContent = S.bag.length;
  const found = TYPES.filter(t => S.dex[t]).length;
  $('dexCount').textContent = `${found}/${TYPES.length}`;
  const fever = S.fever > 0;
  $('fever').hidden = !fever;
  $('feverLeft').textContent = S.fever;
  $('machine').classList.toggle('fever', fever);
  const mb = $('mainBtn');
  mb.classList.remove('drop', 'busy', 'poor');
  if (mode === 'attract') {
    if (S.sats >= COST) { $('mainTop').textContent = 'COIN'; $('mainSub').textContent = `${COST} sats 投入`; }
    else { $('mainTop').textContent = 'COIN'; $('mainSub').textContent = '残高不足'; mb.classList.add('poor'); }
  } else if (mode === 'ready') {
    $('mainTop').textContent = 'DROP!'; $('mainSub').textContent = 'アームを下ろす'; mb.classList.add('drop');
  } else {
    $('mainTop').textContent = '…'; $('mainSub').textContent = 'キャッチ中'; mb.classList.add('busy');
  }
  updateFaucet();
}
function updateFaucet() {
  const b = $('faucetBtn');
  const wait = Math.max(0, S.faucetAt + FAUCET_COOLDOWN - Date.now());
  const need = S.sats < COST;
  b.classList.toggle('ready', need && wait === 0);
  b.textContent = wait > 0 ? `🚰 ${Math.ceil(wait / 1000)}s` : '🚰 Faucet';
}
setInterval(updateFaucet, 500);
function pulseFaucet() { const b = $('faucetBtn'); b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 400, iterations: 2 }); }

let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
function banner(big, small) {
  const b = $('banner');
  b.hidden = false; b.innerHTML = `${big}<small>${small}</small>`;
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  setTimeout(() => { b.hidden = true; }, 2300);
}
function openModal(id) { $(id).hidden = false; }
function closeModal(id) { $(id).hidden = true; }
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', e => { e.target.closest('.modal').hidden = true; }));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m && m.id !== 'winModal') m.hidden = true; }));

let currentWin = null;
function showNextWin() {
  if (!$('winModal').hidden || !winQueue.length) return;
  currentWin = winQueue.shift();
  const it = ITEMS[currentWin.type], rar = RARITY[it.rarity];
  const rug = currentWin.type === 'RUG';
  $('winCard').classList.toggle('rug', rug);
  $('winTitle').textContent = rug ? 'RUGGED…😇' : (it.rarity === 'M' || it.rarity === 'L' ? 'JACKPOT!!' : 'GET!!');
  $('winNew').hidden = !currentWin.isNew;
  $('winRarity').textContent = '★'.repeat('CRELM'.indexOf(it.rarity) + 1) + ' ' + rar.label;
  $('winRarity').style.color = rar.color;
  $('winName').textContent = `${it.name}（${it.ticker}）`;
  $('winDesc').textContent = it.desc;
  $('winValue').textContent = priceOf(currentWin.type).toLocaleString();
  $('winSell').disabled = rug;
  $('winSell').textContent = rug ? '売れません（流動性ゼロ）' : '即売りで利確';
  paintIcon($('winSprite'), currentWin.type);
  openModal('winModal');
}
function closeWin() { closeModal('winModal'); currentWin = null; setTimeout(showNextWin, 200); }
$('winHodl').addEventListener('click', () => { toast('💎🙌 ガチホ！バッグに入れました'); closeWin(); });
$('winSell').addEventListener('click', () => { if (currentWin) sellItem(currentWin.bagId); closeWin(); });

function sellItem(bagId) {
  const i = S.bag.findIndex(b => b.id === bagId);
  if (i < 0) return 0;
  const b = S.bag[i];
  const v = priceOf(b.t);
  S.bag.splice(i, 1);
  S.sats += v; S.earned += v;
  sfx.sell(); bumpWallet();
  const diff = v - b.at;
  toast(`${ITEMS[b.t].ticker} を ${v.toLocaleString()} sats で売却${diff ? `（取得時比 ${diff > 0 ? '+' : ''}${diff}）` : ''}`);
  save(); refreshUI();
  return v;
}
function renderBag() {
  const list = $('bagList');
  let total = 0;
  if (!S.bag.length) {
    list.innerHTML = '<p class="empty">まだ空っぽ。ぬいぐるみをつかみ取ろう！</p>';
  } else {
    const prev = list.scrollTop;
    list.innerHTML = '';
    for (const b of S.bag.slice().reverse()) {
      const it = ITEMS[b.t], v = priceOf(b.t);
      total += v;
      const d = b.at ? (v - b.at) / b.at * 100 : 0;
      const row = document.createElement('div');
      row.className = 'bag-item';
      const icon = document.createElement('canvas'); icon.width = icon.height = 88;
      paintIcon(icon, b.t);
      row.appendChild(icon);
      const info = document.createElement('div');
      info.innerHTML = `<div class="nm" style="color:${RARITY[it.rarity].color}">${it.name}</div><div class="px">${v.toLocaleString()} sats <span class="${d >= 0 ? 'up' : 'down'}">${b.at ? (d >= 0 ? '▲' : '▼') + Math.abs(d).toFixed(1) + '%' : ''}</span></div>`;
      row.appendChild(info);
      const btn = document.createElement('button');
      btn.textContent = b.t === 'RUG' ? '捨てる' : '売る';
      btn.addEventListener('click', () => { sellItem(b.id); renderBag(); });
      row.appendChild(btn);
      list.appendChild(row);
    }
    list.scrollTop = prev;
  }
  $('bagTotal').textContent = total.toLocaleString();
}
$('bagBtn').addEventListener('click', () => { renderBag(); openModal('bagModal'); });
$('sellAll').addEventListener('click', () => {
  if (!S.bag.length) return;
  let sum = 0;
  for (const b of S.bag) sum += priceOf(b.t);
  S.sats += sum; S.earned += sum; S.bag = [];
  sfx.sell(); bumpWallet(); toast(`全部売却！ +${sum.toLocaleString()} sats`);
  save(); refreshUI(); renderBag();
});
function renderDex() {
  const grid = $('dexGrid'); grid.innerHTML = '';
  for (const t of TYPES) {
    const it = ITEMS[t], n = S.dex[t] || 0;
    const cell = document.createElement('div');
    cell.className = 'dex-cell' + (n ? '' : ' locked');
    const icon = document.createElement('canvas'); icon.width = icon.height = 128;
    paintIcon(icon, t);
    cell.appendChild(icon);
    const nm = document.createElement('div'); nm.className = 'nm';
    nm.textContent = n ? it.name : '？？？'; nm.style.color = RARITY[it.rarity].color;
    const ct = document.createElement('div'); ct.className = 'ct';
    ct.textContent = n ? `×${n}` : RARITY[it.rarity].label;
    cell.append(nm, ct);
    grid.appendChild(cell);
  }
  const found = TYPES.filter(t => S.dex[t]).length;
  $('dexStats').innerHTML = `コンプ率 <b>${found}/${TYPES.length}</b>　・　${S.plays}プレイ / ${S.wins}GET　・　最高${S.bestStreak}連続`;
}
$('dexBtn').addEventListener('click', () => { renderDex(); openModal('dexModal'); });
$('faucetBtn').addEventListener('click', () => {
  const wait = S.faucetAt + FAUCET_COOLDOWN - Date.now();
  if (wait > 0) { toast(`蛇口がチャージ中… あと${Math.ceil(wait / 1000)}秒`); return; }
  if (S.sats >= COST * 3) { toast('🚰 Faucetは残高が少ないときだけ使えます'); return; }
  S.sats += FAUCET_AMOUNT; S.faucetAt = Date.now();
  sfx.coin(); bumpWallet(); toast(`🚰 Faucetから +${FAUCET_AMOUNT} sats ！`);
  save(); refreshUI();
});
function syncSoundBtn() { $('soundBtn').textContent = S.sound ? '🔊' : '🔇'; }
$('soundBtn').addEventListener('click', () => { S.sound = !S.sound; if (!S.sound) moveHum(false); syncSoundBtn(); save(); });
$('copyLn').addEventListener('click', () => {
  const t = 'brashridge65@walletofsatoshi.com';
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('⚡ コピーしました！ありがとう🙏'), () => toast(t));
});

// controls
function mainAction() {
  if (mode === 'attract') {
    if (!$('winModal').hidden) return;
    insertCoin();
  } else if (mode === 'ready') doDrop();
}
$('mainBtn').addEventListener('click', e => { e.currentTarget.blur(); mainAction(); });
function holdBtn(el, key) {
  const on = e => { e.preventDefault(); input[key] = true; el.classList.add('on'); audio(); };
  const off = () => { input[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointerleave', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
holdBtn($('leftBtn'), 'left');
holdBtn($('rightBtn'), 'right');
// drag on the machine to aim, tap to drop
let dragging = false;
function canvasX(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; }
cv.addEventListener('pointerdown', e => {
  if (mode === 'attract') { mainAction(); return; }
  if (mode !== 'ready') return;
  dragging = true; cv.setPointerCapture(e.pointerId);
  dragStartX = canvasX(e); dragMoved = false;
});
let dragStartX = 0, dragMoved = false;
cv.addEventListener('pointermove', e => {
  if (!dragging || mode !== 'ready') return;
  const x = canvasX(e);
  if (Math.abs(x - dragStartX) > 8) dragMoved = true;
  if (dragMoved) {
    const nx = Math.max(MIN_X, Math.min(MAX_X, x));
    claw.swayV -= (nx - claw.x) * 0.6;
    claw.x = nx;
  }
});
cv.addEventListener('pointerup', () => {
  if (dragging && !dragMoved && mode === 'ready') doDrop();
  dragging = false;
});
window.addEventListener('keydown', e => {
  if (e.repeat && (e.code === 'Space' || e.code === 'Enter')) return;
  const anyModal = [...document.querySelectorAll('.modal')].some(m => !m.hidden);
  if (anyModal) {
    if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      if (!$('winModal').hidden) closeWin(); else document.querySelectorAll('.modal').forEach(m => { if (m.id !== 'winModal') m.hidden = true; });
    }
    return;
  }
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') { input.left = true; e.preventDefault(); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') { input.right = true; e.preventDefault(); }
  else if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter' || e.code === 'KeyS') { e.preventDefault(); mainAction(); }
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
});
window.addEventListener('blur', () => { input.left = input.right = false; moveHum(false); });

// ---------- boot ----------
(function boot() {
  restock(21, false);
  for (let i = 0; i < 400; i++) physics(); // let the pile settle
  prizes = prizes.filter(p => p.x > CHUTE_X); // nothing starts in the chute
  for (const p of prizes) { p.px = p.x; p.py = p.y; }
  const today = new Date().toISOString().slice(0, 10);
  if (S.lastDaily !== today) {
    const first = !S.lastDaily;
    S.lastDaily = today;
    if (!first) { S.sats += DAILY_BONUS; setTimeout(() => toast(`☀️ デイリーボーナス +${DAILY_BONUS} sats！`), 800); }
    else setTimeout(() => toast('ようこそ！1,000 sats をプレゼント。まずはCOINを投入！'), 800);
  }
  syncSoundBtn();
  save(); refreshUI(); renderTicker();
  requestAnimationFrame(frame);
})();
