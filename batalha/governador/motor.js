'use strict';
// =====================================================================
// Batalha do voto · frentes estaduais (2º turno para governador)
// =====================================================================
const TH = window.TH;
const TSE = 'https://resultados.tse.jus.br/oficial', CICLO = 'ele2026';
const HIST_URL = 'https://raw.githubusercontent.com/lucashang07/laboratorio-voto-2026/dados/historico/';
const DAYS = { '6260': '25/10/2026', '6259': '04/10/2026' };
const UF0 = TH.uf, UFNOME = TH.nome, PREPF = 'no';
const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dec = (v, d) => v.toFixed(d).replace('.', ',');
const fmtN = n => Math.round(n).toLocaleString('pt-BR');
const fmtP = (v, d = 1) => v == null || !isFinite(v) ? '·' : dec(v, d) + '%';
const fmtBig = n => { const a = Math.abs(n); if (a >= 1e6) return dec(a / 1e6, a >= 1e7 ? 1 : 2) + ' milhões'; if (a >= 1e3) return fmtN(a / 1e3) + ' mil'; return fmtN(a); };
const fmtMi = n => n >= 1e6 ? dec(n / 1e6, 1) + ' mi' : n >= 1e3 ? Math.round(n / 1e3) + ' mil' : fmtN(n);
const hhmm = m => { const t = Math.round(17 * 60 + m), h = Math.floor(t / 60), mi = t % 60; return String(h % 24).padStart(2, '0') + 'h' + String(mi).padStart(2, '0'); };
const clk = m => { const t = Math.round(17 * 60 + m), h = Math.floor(t / 60), mi = t % 60; return String(h % 24).padStart(2, '0') + ':' + String(mi).padStart(2, '0'); };
const hplus = m => { const t = Math.max(0, Math.round(m)); return 'H+' + Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const logit = p => { p = clamp(p, 1e-4, 1 - 1e-4); return Math.log(p / (1 - p)); };
const sig = x => 1 / (1 + Math.exp(-x));
const easeOut = k => 1 - Math.pow(1 - k, 3);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const params = new URLSearchParams(location.search);
const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const MOBILE = !!(window.matchMedia && (matchMedia('(max-width: 640px)').matches || matchMedia('(pointer: coarse)').matches));
const CONDF = '"Barlow Condensed","Arial Narrow",sans-serif', STENF = '"Black Ops One",Impact,sans-serif', TYPEF = '"Special Elite","Courier New",monospace';
const spaced = (t, n = 1) => t.split('').join(n > 1 ? '\u2009\u2009' : '\u2009');
const titleCase = s => String(s).toLowerCase().split(' ').map(w => ['de', 'do', 'da', 'dos', 'das', 'e'].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const SHORTN = { 'PROFESSORA DORINHA': 'Dorinha', 'PROFESSORA MARIA DO CARMO': 'Maria do Carmo', 'VICENTINHO JÚNIOR': 'Vicentinho', 'CADU DE LULA': 'Cadu de Lula', 'ALLYSON': 'Allyson', 'LORENZO PAZOLINI': 'Pazolini', 'RICARDO FERRAÇO': 'Ferraço', 'CELINA LEÃO': 'Celina', 'LEANDRO GRASS': 'Grass', 'OMAR AZIZ': 'Omar Aziz', 'MAILZA ASSIS': 'Mailza', 'ALAN RICK': 'Alan Rick', 'DOUGLAS RUAS': 'Douglas Ruas', 'EDUARDO PAES': 'Eduardo Paes' };
const CA = TH.cands[0], CB = TH.cands[1];
const META = { a: titleCase(CA.n), b: titleCase(CB.n), ashort: SHORTN[CA.n] || titleCase(CA.n).split(' ')[0], bshort: SHORTN[CB.n] || titleCase(CB.n).split(' ')[0], ap: CA.p, bp: CB.p };
const CMETA = { live: META, sim: META };
const DATEL = { live: '25 out 2026', sim: 'simulação' };
const COLF = '#f0a028', COLL = '#28b4d2', COLF2 = '#ffd089', COLL2 = '#9fe3f2';
// ---------------------------------------------------------------------
// Células (cada uma pertence a um município real) e setores do estado
// ---------------------------------------------------------------------
const SQ3 = Math.sqrt(3), N = TH.cells.q.length, RR = TH.R, PHI = TH.phi, KMU = TH.R * 111.2;
const MUNS = TH.muns.map((m, i) => Object.assign({ i, two: m.a + m.b, lean1: (m.a + m.b) ? m.a / (m.a + m.b) : 0.5 }, m));
const MUNBYC = new Map(MUNS.map(m => [m.c, m]));
const NCELLM = new Array(MUNS.length).fill(0); TH.cells.mu.forEach(k => { NCELLM[k]++; });
const HX = [];
for (let i = 0; i < N; i++) { const q = TH.cells.q[i], r = TH.cells.r[i], mu = MUNS[TH.cells.mu[i]]; HX.push({ i, q, r, x: SQ3 * (q + r / 2), y: 1.5 * r, mu, e: mu.te / Math.max(1, NCELLM[mu.i]), lean: mu.lean1, frac: 0, own: null, str: 0, uf: 's0' }); }
const KEY = new Map(HX.map(h => [h.q + ',' + h.r, h]));
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
HX.forEach(h => { h.nb = DIRS.map(([dq, dr]) => KEY.get((h.q + dq) + ',' + (h.r + dr)) || null); });
const NSEC = MUNS.length < 3 ? 1 : N > 1000 ? 6 : 5;
const SEC = (() => {
  const cx0 = HX.reduce((a, h) => a + h.x, 0) / N, cy0 = HX.reduce((a, h) => a + h.y, 0) / N;
  if (NSEC === 1) return { cents: [[cx0, cy0]], c0: [cx0, cy0] };
  let cents = [];
  for (let k = 0; k < NSEC; k++) { const ang = 2 * Math.PI * k / NSEC + 0.3; let best = HX[0], bd = -1e18; for (const h of HX) { const d = (h.x - cx0) * Math.cos(ang) + (h.y - cy0) * Math.sin(ang); if (d > bd) { bd = d; best = h; } } cents.push([cx0 + (best.x - cx0) * 0.6, cy0 + (best.y - cy0) * 0.6]); }
  for (let it = 0; it < 14; it++) { const acc = cents.map(() => [0, 0, 0]); for (const h of HX) { let bk = 0, bd = 1e18; cents.forEach((c, k) => { const d = (h.x - c[0]) ** 2 + (h.y - c[1]) ** 2; if (d < bd) { bd = d; bk = k; } }); acc[bk][0] += h.x; acc[bk][1] += h.y; acc[bk][2]++; } cents = cents.map((c, k) => acc[k][2] ? [acc[k][0] / acc[k][2], acc[k][1] / acc[k][2]] : c); }
  return { cents, c0: [cx0, cy0] };
})();
HX.forEach(h => { let bk = 0, bd = 1e18; SEC.cents.forEach((c, k) => { const d = (h.x - c[0]) ** 2 + (h.y - c[1]) ** 2; if (d < bd) { bd = d; bk = k; } }); h.uf = 's' + bk; });
const UFS = SEC.cents.map((c, k) => 's' + k);
const MUNSEC = MUNS.map(() => ({})); HX.forEach(h => { MUNSEC[h.mu.i][h.uf] = (MUNSEC[h.mu.i][h.uf] || 0) + 1; });
MUNS.forEach(m => { const o = MUNSEC[m.i]; let best = 's0', bv = -1; for (const k in o) if (o[k] > bv) { bv = o[k]; best = k; } m.sec = best; });
const SECMUNS = {}; UFS.forEach(u => { SECMUNS[u] = MUNS.filter(m => m.sec === u); });
const UFN = {};
// cada setor leva o nome da capital, se ela estiver nele, ou da maior cidade dele ("Setor de Mossoró")
UFS.forEach((u, k) => { const big = SECMUNS[u].find(m => m.cap) || SECMUNS[u].slice().sort((a, b) => b.te - a.te)[0]; UFN[u] = big ? `Setor de ${big.n}` : `Setor ${k + 1}`; });
const PREP = {}, REG = {}, REGN = {}, REGS = [], REGC = {};
const emUF = u => UFN[u] || '';
const BYUF = {}; UFS.forEach(u => { BYUF[u] = HX.filter(h => h.uf === u); });
const EUF = {}; UFS.forEach(u => { EUF[u] = BYUF[u].reduce((a, h) => a + h.e, 0); });
const LAND = HX;
const KUF = { k22: {}, k26: {}, s22: {}, s26: {} };
const VX = [], VY = []; for (let a = 0; a < 6; a++) { const an = Math.PI / 180 * (60 * a - 30); VX.push(Math.cos(an)); VY.push(Math.sin(an)); }
const EDGEV = [[0, 1], [5, 0], [4, 5], [3, 4], [2, 3], [1, 2]];
function hexPath(h, sc) { const p = new Path2D(); for (let a = 0; a < 6; a++) { const x = h.x + VX[a] * sc, y = h.y + VY[a] * sc; a ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath(); return p; }
HX.forEach(h => { h.path = hexPath(h, 1.16); h.path1 = hexPath(h, 1.0); });
const NKEY = MUNS.length <= 3 ? 1 : MUNS.length <= 25 ? 6 : 10;
const CITIES = (() => { const arr = MUNS.slice().sort((a, b) => b.te - a.te).slice(0, NKEY); const cap = MUNS.find(m => m.cap); if (cap && !arr.includes(cap)) arr[arr.length - 1] = cap; return arr; })();
const CAPS = CITIES.map(m => ({ uf: 'c' + m.c, n: m.n, x: m.x, y: m.y, nat: m.cap ? 1 : 0, mu: m }));
const CAPOF = {}; CAPS.forEach(c => { CAPOF[c.uf] = c; });
const WB = (() => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const h of HX) { x0 = Math.min(x0, h.x); x1 = Math.max(x1, h.x); y0 = Math.min(y0, h.y); y1 = Math.max(y1, h.y); } const m = Math.max(2.5, 0.04 * Math.max(x1 - x0, y1 - y0)); return { x0: x0 - m, x1: x1 + m, y0: y0 - m, y1: y1 + m }; })();
WB.w = WB.x1 - WB.x0; WB.h = WB.y1 - WB.y0;
function ringsPath(rings, close) { const P = new Path2D(); for (const r of rings) { for (let i = 0; i < r.length; i += 2) { const x = r[i] / 10, y = r[i + 1] / 10; i ? P.lineTo(x, y) : P.moveTo(x, y); } if (close) P.closePath(); } return P; }
const P_BR = ringsPath(TH.geo.st, true), P_ALLST = P_BR;
const P_STATES = { mb: ringsPath(TH.geo.mb, true) };
const P_NB = ringsPath(TH.geo.nb.map(n => n.r).concat(TH.geo.nc), true);
const P_RV = [new Path2D(), new Path2D(), new Path2D()];
TH.geo.rv.forEach(l => { const P = P_RV[l.w - 1]; for (let i = 0; i < l.p.length; i += 2) { const x = l.p[i] / 10, y = l.p[i + 1] / 10; i ? P.lineTo(x, y) : P.moveTo(x, y); } });
const IMG = { x0: TH.img[0], y0: TH.img[1], x1: TH.img[2], y1: TH.img[3] };
const GEO = { lb: TH.geo.lb.map(l => Object.assign({}, l, { k: 'c' })), rl: [] };
const lonX = lon => (lon - TH.lonc) * PHI / RR, latY = lat => -lat / RR;
// ---------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------
const S = { mode: 'live', E: '6260', frames: [], idx: -1, follow: true, munFrac: {}, eleito: null, status: 'load', sound: false, events: [], shownEv: 0, playing: false, speed: 3, timer: null, int: {}, mom: {}, simT: 50, simSeed: 1, xf0: -1e9, tok: 0, numA: null, numB: null };
function ufData(fr, key) { return fr && fr.mun ? (fr.mun[key] || null) : null; }

// ---------------------------------------------------------------------
// Modelo de território
// ---------------------------------------------------------------------
function computeTerritory(fr, live) { assignTerritory(fr, S.mode === 'r26' ? 'o26' : 'o22', S.mode === 'r22' ? 's22' : 'ls', live, 'frac', 'own', 'str'); }
function assignTerritory(fr, orderKey, leanKey, live, fFrac, fOwn, fStr) {
  for (const u of UFS) {
    const d = ufData(fr, u), hs = BYUF[u];
    if (!hs.length) continue;
    const f = d && d.ts ? d.st / d.ts : 0;
    if (live && S.munFrac[u]) {
      const mf = S.munFrac[u];
      hs.forEach(h => { if (!h.m.length) { h.nf = f; return; } let w = 0, a = 0; h.m.forEach(([c, wt]) => { const v = mf[c]; if (v != null) { a += wt * v; w += wt; } }); h.nf = w ? a / w : f; });
    } else if (EUF[u] === 0) { const k = Math.round(f * hs.length); hs.forEach((h, j) => { h.nf = j < k ? 1 : 0; }); }
    else {
      const ord = hs.slice().sort((a, b) => a[orderKey] - b[orderKey] || a.i - b.i), target = f * EUF[u]; let cum = 0, K = -Infinity, part = null;
      for (const h of ord) { if (h.e === 0) continue; if (cum + h.e <= target + 1e-9) { cum += h.e; K = h[orderKey]; } else { part = h; break; } }
      hs.forEach(h => { h.nf = h[orderKey] <= K ? 1 : 0; });
      if (part && part.e) { part.nf = clamp((target - cum) / part.e, 0, 1); if (part.nf > 0.5) K = Math.max(K, part[orderKey]); }
      hs.forEach(h => { if (h.e === 0 && h[orderKey] <= K) h.nf = 1; });
      if (f >= 0.999) hs.forEach(h => { h.nf = 1; });
    }
    const two = d ? d.F + d.L : 0, sF = two ? d.F / two : 0.5;
    const rev = hs.filter(h => h.nf > 0.001).sort((a, b) => b[leanKey] - a[leanKey] || a.i - b.i);
    const tw = rev.reduce((a, h) => a + h.e * h.nf, 0);
    let cum = 0, cutLean = null, prevF = null;
    rev.forEach((h, j) => {
      const w = h.e * h.nf, p = tw > 0 ? (cum + w / 2) / tw : (j + 0.5) / rev.length; cum += w;
      h.nown = two ? (p < sF ? 'F' : 'L') : null;
      if (h.nown === 'F') prevF = h; else if (cutLean == null) cutLean = prevF ? (prevF[leanKey] + h[leanKey]) / 2 : h[leanKey];
    });
    if (cutLean == null) cutLean = prevF ? prevF[leanKey] : 0.5;
    rev.forEach(h => { h.nstr = clamp(Math.abs(h[leanKey] - cutLean) / 0.14, 0, 1); });
    hs.forEach(h => { if (h.nf <= 0.001) { h.nown = null; h.nstr = 0; } h[fOwn] = h.nown; if (fStr) h[fStr] = h.nstr; h[fFrac] = h.nf; });
  }
}
function territory(side) { let a = 0; for (const h of LAND) if (h.own === side) a += h.frac; return 100 * a / LAND.length; }
function statesLed(fr, side) { let n = 0; for (const u of UFS) { if (u === 'zz') continue; const d = ufData(fr, u); if (d && d.st > 0 && (d.F + d.L) > 0 && ((side === 'F') === (d.F >= d.L))) n++; } return n; }
function centroidHex(hs) { let x = 0, y = 0; hs.forEach(h => { x += h.x; y += h.y; }); x /= hs.length; y /= hs.length; let best = hs[0], bd = 1e18; for (const h of hs) { const d = (h.x - x) ** 2 + (h.y - y) ** 2; if (d < bd) { bd = d; best = h; } } return [best.x, best.y, x, y]; }
// intensidade dos combates e momento por estado
function computeDynamics() {
  const fr = S.frames[S.idx]; if (!fr) return;
  let j5 = S.idx; while (j5 > 0 && S.frames[j5].m > fr.m - 5) j5--;
  let j10 = S.idx; while (j10 > 0 && S.frames[j10].m > fr.m - 10) j10--;
  const f5 = S.frames[j5], f10 = S.frames[j10];
  for (const u of UFS) {
    const d = fr.uf[u]; if (!d || !d.ts) { S.int[u] = 0; S.mom[u] = 0; continue; }
    const d5 = f5.uf[u], d10 = f10.uf[u];
    const act = j5 === S.idx ? 0.04 : (d.st - (d5 ? d5.st : 0)) / d.ts;
    const rem = 1 - d.st / d.ts, two = d.F + d.L, mg = two ? Math.abs(d.F - d.L) / two : 1, close = 1 - clamp(mg / 0.3, 0, 1);
    S.int[u] = !d.st ? 0 : rem <= 0.0005 ? 0.03 : clamp(0.16 + 5 * act, 0, 1) * (0.45 + 0.55 * close);
    const t10 = d10 ? d10.F + d10.L : 0;
    S.mom[u] = two && t10 && j10 !== S.idx ? 100 * (d.F / two - d10.F / t10) : 0;
  }
}

// ---------------------------------------------------------------------
// Canvas, câmera e camadas
// ---------------------------------------------------------------------
const cv = $('#cv'), ctx = cv.getContext('2d');
const G = { W: 0, H: 0, dpr: 1, s: 1, hx: 0, hy: 0 };
const CAM = { x: 0, y: 0, z: 1, tx: 0, ty: 0, tz: 1, user: false, until: 0, last: -1e9, moving: true, auto: true, init: false };
const SHAKE = { a: 0, t0: 0 };
const mk = () => document.createElement('canvas');
const BASE = mk(), BCTX = BASE.getContext('2d');
const TW = mk(), TWO = mk(), SCR = mk(), FM = mk(), BRM = mk(), SMALL = mk(), FOGC = mk(), FOGX = FOGC.getContext('2d'), VIG = mk();
let KT = 5, BASE_DIRTY = true, MAPVIS = true;
let PART_F = null, PART_L = null;
const RELIEF = new Image();
RELIEF.decoding = 'async';
RELIEF.onload = () => { BASE_DIRTY = true; };
RELIEF.src = 'relevo-' + UF0 + '.jpg';
function setWorld(c, scale) { const sc = scale == null ? G.dpr : scale, kk = G.s * CAM.z; c.setTransform(sc * kk, 0, 0, sc * kk, sc * (G.W / 2 - CAM.x * kk), sc * (G.H / 2 - CAM.y * kk)); }
function w2s(x, y) { const kk = G.s * CAM.z; return [G.W / 2 + (x - CAM.x) * kk, G.H / 2 + (y - CAM.y) * kk]; }
function s2w(px, py) { const kk = G.s * CAM.z; return [CAM.x + (px - G.W / 2) / kk, CAM.y + (py - G.H / 2) / kk]; }
function layout() {
  const box = $('#mapbox'), W = box.clientWidth, narrow = W < 600;
  let H = Math.round(Math.min(window.innerHeight * (narrow ? 0.62 : 0.82), W * WB.h / WB.w * 1.02));
  H = Math.max(H, narrow ? 340 : 520);
  if (TV.on) H = box.clientHeight || window.innerHeight - 46;
  G.W = W; G.H = H; G.s = Math.min(W / WB.w, H / WB.h); G.dpr = Math.min(2, window.devicePixelRatio || 1);
  G.hx = WB.x0 + WB.w / 2; G.hy = WB.y0 + WB.h / 2;
  cv.width = Math.round(W * G.dpr); cv.height = Math.round(H * G.dpr); cv.style.height = H + 'px';
  if (!CAM.init || !CAM.user) { CAM.tx = G.hx; CAM.ty = G.hy; CAM.tz = 1; }
  if (!CAM.init) { CAM.x = G.hx; CAM.y = G.hy; CAM.z = 1; CAM.init = true; }
  BASE.width = cv.width; BASE.height = cv.height;
  FOGC.width = Math.ceil(cv.width / 2); FOGC.height = Math.ceil(cv.height / 2);
  KT = clamp(G.s * G.dpr * 0.75, 3.5, 12);
  for (const c of [TW, TWO, SCR, FM, BRM]) { c.width = Math.ceil(WB.w * KT); c.height = Math.ceil(WB.h * KT); }
  const bx = BRM.getContext('2d'); bx.setTransform(KT, 0, 0, KT, -WB.x0 * KT, -WB.y0 * KT); bx.fillStyle = '#fff'; bx.fill(P_ALLST);
  VIG.width = Math.max(1, Math.round(W / 2)); VIG.height = Math.max(1, Math.round(H / 2));
  const vx = VIG.getContext('2d'), gr = vx.createRadialGradient(VIG.width / 2, VIG.height / 2, Math.min(VIG.width, VIG.height) * 0.32, VIG.width / 2, VIG.height / 2, Math.max(VIG.width, VIG.height) * 0.72);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); vx.fillStyle = gr; vx.fillRect(0, 0, VIG.width, VIG.height);
  BASE_DIRTY = true;
  renderTerritory(true);
  updateScaleBar();
  startLoop();
}
function clampCam() {
  const hw = G.W / 2 / (G.s * CAM.tz), hh = G.H / 2 / (G.s * CAM.tz);
  CAM.tx = WB.w > 2 * hw ? clamp(CAM.tx, WB.x0 + hw, WB.x1 - hw) : G.hx;
  CAM.ty = WB.h > 2 * hh ? clamp(CAM.ty, WB.y0 + hh, WB.y1 - hh) : G.hy;
}
function camFocus(x, y, z, hold) {
  const now = performance.now();
  if (CAM.user || !CAM.auto || REDUCED) return;
  if (now - CAM.last < 6500) return;
  CAM.last = now; CAM.tx = x; CAM.ty = y; CAM.tz = z; clampCam(); CAM.until = now + hold;
}
function camHome() { CAM.tx = G.hx; CAM.ty = G.hy; CAM.tz = 1; CAM.until = 0; }
function updateCamera(dt, now) {
  if (!CAM.user && CAM.until && now > CAM.until) camHome();
  const k = 1 - Math.exp(-dt * 2.3), ox = CAM.x, oy = CAM.y, oz = CAM.z;
  CAM.x += (CAM.tx - CAM.x) * k; CAM.y += (CAM.ty - CAM.y) * k; CAM.z += (CAM.tz - CAM.z) * k;
  if (Math.abs(CAM.tx - CAM.x) < 0.004 && Math.abs(CAM.ty - CAM.y) < 0.004 && Math.abs(CAM.tz - CAM.z) < 0.0004) { CAM.x = CAM.tx; CAM.y = CAM.ty; CAM.z = CAM.tz; }
  const moved = CAM.x !== ox || CAM.y !== oy || CAM.z !== oz;
  if (moved) { BASE_DIRTY = true; updateScaleBar(); }
  if (SHAKE.a > 0.05) { const age = (now - SHAKE.t0) / 1000, a = SHAKE.a * Math.exp(-age * 5.5); if (a < 0.3) { SHAKE.a = 0; cv.style.transform = ''; } else cv.style.transform = `translate(${((Math.random() * 2 - 1) * a).toFixed(1)}px,${((Math.random() * 2 - 1) * a).toFixed(1)}px)`; }
}
function shake(a) { if (REDUCED) return; SHAKE.a = Math.max(SHAKE.a, a); SHAKE.t0 = performance.now(); }
function updateScaleBar() { const kk = G.s * CAM.z, km = kk * (500 / 36.6); let L = 500, px = km; if (px > 130) { L = 250; px = kk * (250 / 36.6); } if (px < 50) { L = 1000; px = kk * (1000 / 36.6); } $('#scale').innerHTML = `<i style="width:${Math.round(px)}px"></i>${L} km`; }

// --- textura de fumaça (ruído fractal que se repete) ---
function makeSmoke(size, seed, kind) {
  const c = mk(); c.width = c.height = size; const x = c.getContext('2d'), img = x.createImageData(size, size), rnd = mulberry32(seed);
  const oct = [[4, 0.5], [8, 0.27], [16, 0.15], [32, 0.08]];
  const grids = oct.map(([n]) => { const g = new Float32Array(n * n); for (let i = 0; i < n * n; i++) g[i] = rnd(); return g; });
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    let v = 0, A = 0;
    for (let k = 0; k < oct.length; k++) { const n = oct[k][0], amp = oct[k][1], g = grids[k], gx = px / size * n, gy = py / size * n, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, x1 = (x0 + 1) % n, y1 = (y0 + 1) % n, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); const a = g[y0 * n + x0], b = g[y0 * n + x1], c2 = g[y1 * n + x0], d = g[y1 * n + x1]; v += amp * ((a * (1 - sx) + b * sx) * (1 - sy) + (c2 * (1 - sx) + d * sx) * sy); A += amp; }
    v /= A; const i = (py * size + px) * 4;
    if (kind === 0) { const t = clamp((v - 0.28) / 0.5, 0, 1); img.data[i] = 14 + 34 * t; img.data[i + 1] = 16 + 33 * t; img.data[i + 2] = 13 + 28 * t; img.data[i + 3] = 230; }
    else { const t = clamp((v - 0.52) / 0.3, 0, 1), s = t * t * (3 - 2 * t); img.data[i] = 128; img.data[i + 1] = 124; img.data[i + 2] = 110; img.data[i + 3] = Math.round(80 * s); }
  }
  x.putImageData(img, 0, 0); return c;
}
const SMOKE0 = makeSmoke(256, 7, 0), SMOKE1 = makeSmoke(256, 23, 1);
const PAT0 = FOGX.createPattern(SMOKE0, 'repeat'), PAT1 = FOGX.createPattern(SMOKE1, 'repeat');
function hatchPat(col) { const c = mk(); c.width = c.height = 8; const x = c.getContext('2d'); x.strokeStyle = col; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-1, 9); x.lineTo(9, -1); x.moveTo(-1, 1); x.lineTo(1, -1); x.moveTo(7, 9); x.lineTo(9, 7); x.stroke(); return ctx.createPattern(c, 'repeat'); }
const HPAT = { F: hatchPat('rgba(255,200,120,.85)'), L: hatchPat('rgba(140,225,245,.85)') };
const GRAIN = (() => { const c = mk(); c.width = c.height = 128; const x = c.getContext('2d'), img = x.createImageData(128, 128); for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 22; } x.putImageData(img, 0, 0); return ctx.createPattern(c, 'repeat'); })();

// --- território: lavagem colorida + neblina (raster em coordenadas de mundo) ---
function blurInto(src, dst, f) {
  SMALL.width = Math.max(1, Math.round(src.width * f)); SMALL.height = Math.max(1, Math.round(src.height * f));
  const sc = SMALL.getContext('2d'); sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high'; sc.drawImage(src, 0, 0, SMALL.width, SMALL.height);
  const d = dst.getContext('2d'); d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, dst.width, dst.height); d.imageSmoothingEnabled = true; d.imageSmoothingQuality = 'high'; d.drawImage(SMALL, 0, 0, dst.width, dst.height);
}
function renderTerritory(instant) {
  const o = TWO.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'copy'; o.drawImage(TW, 0, 0); o.globalCompositeOperation = 'source-over';
  const s = SCR.getContext('2d'); s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, SCR.width, SCR.height); s.setTransform(KT, 0, 0, KT, -WB.x0 * KT, -WB.y0 * KT);
  const pf = new Path2D(), pl = new Path2D(); let nf = 0, nl = 0;
  for (const h of LAND) {
    if (!h.own || h.frac < 0.04) continue;
    const a = h.frac >= 0.6 ? 0.66 + 0.34 * h.str : 0.25 + 0.45 * h.frac;
    s.fillStyle = h.own === 'F' ? `rgba(245,150,20,${a.toFixed(3)})` : `rgba(30,175,215,${a.toFixed(3)})`; s.fill(h.path);
    if (h.frac < 0.6) { if (h.own === 'F') { pf.addPath(h.path1); nf++; } else { pl.addPath(h.path1); nl++; } }
  }
  PART_F = nf ? pf : null; PART_L = nl ? pl : null;
  blurInto(SCR, TW, 0.2);
  const t = TW.getContext('2d'); t.globalCompositeOperation = 'destination-in'; t.drawImage(BRM, 0, 0); t.globalCompositeOperation = 'source-over';
  s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, SCR.width, SCR.height); s.setTransform(KT, 0, 0, KT, -WB.x0 * KT, -WB.y0 * KT); s.fillStyle = '#fff';
  for (const h of LAND) { const v = 1 - h.frac; if (v < 0.03) continue; s.globalAlpha = v; s.fill(h.path); }
  s.globalAlpha = 1;
  blurInto(SCR, FM, 0.18);
  const f = FM.getContext('2d'); f.globalCompositeOperation = 'destination-in'; f.drawImage(BRM, 0, 0); f.globalCompositeOperation = 'source-over';
  S.xf0 = instant ? -1e9 : performance.now();
}

// --- base: relevo, rios, fronteiras e rótulos (refeita quando a câmera mexe) ---
function renderBase() {
  const b = BCTX, kk = G.s * CAM.z;
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
  b.fillStyle = '#0a1219'; b.fillRect(0, 0, BASE.width, BASE.height);
  setWorld(b);
  if (RELIEF.complete && RELIEF.naturalWidth) b.drawImage(RELIEF, IMG.x0, IMG.y0, IMG.x1 - IMG.x0, IMG.y1 - IMG.y0);
  b.strokeStyle = 'rgba(214,220,190,.075)'; b.lineWidth = 1 / kk; b.beginPath();
  for (let lon = -80; lon <= -25; lon += 5) { b.moveTo(lonX(lon), latY(9)); b.lineTo(lonX(lon), latY(-38)); }
  for (let lat = 5; lat >= -35; lat -= 5) { b.moveTo(lonX(-81), latY(lat)); b.lineTo(lonX(-25), latY(lat)); }
  b.stroke();
  b.strokeStyle = 'rgba(6,6,4,.6)'; b.lineWidth = 1.1 / kk; b.stroke(P_NB);
  b.strokeStyle = 'rgba(98,152,186,.78)'; [1.7, 1.15, 0.7].forEach((w, i) => { b.lineWidth = w / kk * Math.min(1.5, CAM.z); b.stroke(P_RV[i]); });
  b.setLineDash([7 / kk, 2.6 / kk, 1.3 / kk, 2.6 / kk]); b.strokeStyle = 'rgba(238,230,192,.36)'; b.lineWidth = 1 / kk;
  for (const u in P_STATES) b.stroke(P_STATES[u]);
  b.setLineDash([]);
  b.strokeStyle = 'rgba(5,5,3,.9)'; b.lineWidth = 2.6 / kk; b.stroke(P_BR);
  b.strokeStyle = 'rgba(238,230,192,.32)'; b.lineWidth = 0.9 / kk; b.stroke(P_BR);
  b.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  const zf = clamp(CAM.z, 1, 1.7), sm = G.W < 600 ? 0.8 : 1;
  b.textAlign = 'center'; b.textBaseline = 'middle';
  for (const lb of GEO.lb) {
    const [x, y] = w2s(lb.x, lb.y); if (x < -150 || x > G.W + 150 || y < -40 || y > G.H + 40) continue;
    if (lb.k === 'c') { b.font = `600 ${Math.round(12 * zf * sm)}px ${CONDF}`; b.fillStyle = 'rgba(218,210,180,.42)'; b.fillText(spaced(lb.t), x, y); }
    else if (lb.k === 'o') { b.font = `italic 500 ${Math.round(15 * sm)}px ${CONDF}`; b.fillStyle = 'rgba(140,176,198,.38)'; b.fillText(spaced(lb.t, 2), x, y); }
    else if (lb.k === 'r' && G.W >= 600) { b.font = `${Math.round(19 * zf)}px ${STENF}`; b.fillStyle = 'rgba(245,232,190,.085)'; b.fillText(spaced(lb.t), x, y); }
  }
  if (G.W >= 600 || CAM.z > 1.4) {
    b.font = `italic 500 ${Math.round(11 * Math.min(1.3, zf))}px ${CONDF}`;
    for (const rl of GEO.rl) {
      const [x, y] = w2s(rl.x, rl.y); if (x < -60 || x > G.W + 60 || y < -20 || y > G.H + 20) continue;
      b.save(); b.translate(x, y); b.rotate(rl.a); b.lineWidth = 3; b.strokeStyle = 'rgba(5,8,10,.55)'; b.strokeText(rl.t, 0, -5); b.fillStyle = 'rgba(160,198,220,.8)'; b.fillText(rl.t, 0, -5); b.restore();
    }
  }
  b.font = `600 10px ${CONDF}`; b.fillStyle = 'rgba(230,226,207,.42)';
  for (let lon = -75; lon <= -30; lon += 5) { const [x] = w2s(lonX(lon), 0); if (x > 170 && x < G.W - 170) b.fillText(-lon + '°O', x, G.H - 10); }
  b.textAlign = 'right';
  for (let lat = 5; lat >= -35; lat -= 5) { const [, y] = w2s(0, latY(lat)); if (y > 60 && y < G.H - 60) b.fillText(lat === 0 ? '0°' : Math.abs(lat) + '°' + (lat > 0 ? 'N' : 'S'), G.W - 12, y); }
  b.textAlign = 'left'; b.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------------
// Linha de frente (cadeias de arestas entre os dois lados, suavizadas)
// ---------------------------------------------------------------------
let FRONT = [];
const vk = p => Math.round(p[0] * 100) + ',' + Math.round(p[1] * 100);
function chaikin(pts, closed, it) {
  for (let k = 0; k < it; k++) {
    const o = [], n = pts.length; if (n < 3) return pts;
    if (!closed) o.push(pts[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = pts[i], b = pts[(i + 1) % n]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    if (!closed) o.push(pts[n - 1]);
    pts = o;
  }
  return pts;
}
function buildFront() { FRONT = buildFrontFor('own', 'frac'); }
function buildFrontFor(fo, ff) {
  const edges = [];
  for (const h of LAND) {
    if (h[fo] !== 'F' || h[ff] < 0.5) continue;
    for (let d = 0; d < 6; d++) {
      const n = h.nb[d]; if (!n || n.uf === 'zz' || n[fo] !== 'L' || n[ff] < 0.5) continue;
      const [a, b] = EDGEV[d], p = [h.x + VX[b], h.y + VY[b]], q = [h.x + VX[a], h.y + VY[a]];
      edges.push({ p, q, sk: vk(p), ek: vk(q), uf: h.uf, uf2: n.uf });
    }
  }
  const out = new Map(), inc = new Map(); edges.forEach(e => { out.set(e.sk, e); inc.set(e.ek, e); });
  const seen = new Set(), chains = [];
  for (const e of edges) {
    if (seen.has(e)) continue;
    let s = e, g = 0; while (g++ < 20000) { const pr = inc.get(s.sk); if (!pr || pr === e || seen.has(pr)) break; s = pr; }
    const pts = [s.p], ufs = new Set(); let cur = s, closed = false; g = 0;
    while (cur && !seen.has(cur) && g++ < 40000) { seen.add(cur); pts.push(cur.q); ufs.add(cur.uf); ufs.add(cur.uf2); const nx = out.get(cur.ek); if (nx === s) { closed = true; break; } cur = nx; }
    if (closed && pts.length > 2) pts.pop();
    if (pts.length < 3) continue;
    const red = pts.filter((p, i) => i === 0 || i === pts.length - 1 || i % 2 === 0);
    const ch = finishChain(red.length >= 3 ? red : pts, closed, [...ufs]);
    if (ch.len >= 2.6) chains.push(ch);
  }
  return chains;
}
function finishChain(raw, closed, ufs) {
  const pts = chaikin(raw, closed, 3), n = pts.length, OFF = 0.3;
  const path = new Path2D(), lp = new Path2D(), rp = new Path2D(), cum = [0], nrm = [];
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
    nrm.push([ty, -tx]);
    if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i], [nx, ny] = nrm[i];
    if (i) { path.lineTo(x, y); lp.lineTo(x + nx * OFF, y + ny * OFF); rp.lineTo(x - nx * OFF, y - ny * OFF); }
    else { path.moveTo(x, y); lp.moveTo(x + nx * OFF, y + ny * OFF); rp.moveTo(x - nx * OFF, y - ny * OFF); }
  }
  if (closed) { path.closePath(); lp.closePath(); rp.closePath(); }
  const teeth = []; const len = cum[n - 1];
  for (let d = 0.8, i = 0; d < len; d += 1.9) { while (i < n - 2 && cum[i + 1] < d) i++; const k = (d - cum[i]) / ((cum[i + 1] - cum[i]) || 1), x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k; teeth.push([x, y, nrm[i][0], nrm[i][1]]); }
  let I = 0, M = 0; ufs.forEach(u => { I = Math.max(I, S.int[u] || 0); M += S.mom[u] || 0; }); M /= ufs.length || 1;
  return { pts, closed, path, lp, rp, cum, nrm, len, teeth, ufs, I, M };
}

// ---------------------------------------------------------------------
// Ofensivas (setas), unidades e partículas
// ---------------------------------------------------------------------
let ARROWS = [], ABASE = {};
const UNITS = new Map();
let PARTS = [];
const MAXP = MOBILE ? 170 : 480, MAXA = MOBILE ? 3 : 7;
function resetFX() { ARROWS = []; ABASE = {}; UNITS.clear(); PARTS = []; FRONT = []; }
function nearestSide(side, to, notUf) { let best = null, bd = 1e18; for (const h of LAND) { if (h.own !== side || h.frac < 0.5 || h.uf === notUf) continue; const d = (h.x - to[0]) ** 2 + (h.y - to[1]) ** 2; if (d < bd) { bd = d; best = h; } } return best ? [best.x, best.y] : null; }
function pushArrow(side, from, to, gain, uf) {
  let dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy);
  if (L < 0.5) return;
  dx /= L; dy /= L;
  if (L < 3.2) { from = [to[0] - dx * 3.4, to[1] - dy * 3.4]; L = 3.4; }
  if (L > 22) { from = [to[0] - dx * 22, to[1] - dy * 22]; L = 22; }
  const sgn = ((uf.charCodeAt(0) + uf.charCodeAt(1) + (side === 'F' ? 1 : 0)) % 2) ? 1 : -1;
  const cx = (from[0] + to[0]) / 2 + dy * L * 0.2 * sgn, cy = (from[1] + to[1]) / 2 - dx * L * 0.2 * sgn;
  ARROWS.push({ side, x0: from[0], y0: from[1], cx, cy, x1: to[0], y1: to[1], len: L, w: 0.95 * (1 + 0.7 * Math.min(1, gain / 25)), t0: performance.now(), life: S.playing ? clamp(5200 / Math.sqrt(S.speed), 2400, 6500) : 7000 });
  while (ARROWS.length > MAXA) ARROWS.shift();
}
function updateArrows() {
  const fr = S.frames[S.idx]; if (!fr) return;
  for (const u of UFS) {
    if (u === 'zz' || BYUF[u].length < 6) continue;
    for (const side of ['F', 'L']) {
      const key = u + side, cur = BYUF[u].filter(h => h.own === side && h.frac >= 0.5), base = ABASE[key];
      if (!base) { ABASE[key] = { ids: new Set(cur.map(h => h.i)), m: fr.m }; continue; }
      if (fr.m - base.m < 5) continue;
      const gained = cur.filter(h => !base.ids.has(h.i)), need = Math.max(4, Math.round(0.07 * BYUF[u].length));
      if (gained.length >= need) {
        const old = cur.filter(h => base.ids.has(h.i)), c = centroidHex(gained), to = [c[2], c[3]];
        const from = old.length >= 2 ? (() => { const o = centroidHex(old); return [o[2], o[3]]; })() : nearestSide(side, to, u);
        if (from) pushArrow(side, from, to, gained.length, u);
        ABASE[key] = { ids: new Set(cur.map(h => h.i)), m: fr.m };
      } else if (fr.m - base.m > 30) ABASE[key] = { ids: new Set(cur.map(h => h.i)), m: fr.m };
    }
  }
}
function updateUnits() {
  const fr = S.frames[S.idx], seen = new Set(); if (!fr) return;
  for (const u of UFS) {
    if (u === 'zz') continue;
    const hs = BYUF[u]; if (hs.length < (MOBILE ? 90 : 22)) continue;
    const d = ufData(fr, u); if (!d || !d.st) continue;
    const rev = hs.filter(h => h.own && h.frac >= 0.5); if (rev.length < 3) continue;
    const nF = rev.filter(h => h.own === 'F').length;
    for (const side of ['F', 'L']) {
      const held = rev.filter(h => h.own === side); if (held.length < 4 || held.length / rev.length < 0.3) continue;
      if (MOBILE && (side === 'F') !== (nF * 2 >= rev.length)) continue;
      const c = centroidHex(held), key = u + side; seen.add(key);
      let un = UNITS.get(key); if (!un) { un = { side, uf: u, x: c[0], y: c[1], a: 0 }; UNITS.set(key, un); }
      un.tx = c[0]; un.ty = c[1]; un.votes = side === 'F' ? d.F : d.L; un.ta = 1;
    }
  }
  for (const [k, un] of UNITS) if (!seen.has(k)) un.ta = 0;
}
function samplePoint(f) {
  const r = Math.random() * f.len, c = f.cum; let lo = 0, hi = c.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c[mid] < r) lo = mid; else hi = mid; }
  const k = (r - c[lo]) / ((c[hi] - c[lo]) || 1), a = f.pts[lo], b = f.pts[hi];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, f.nrm[lo][0], f.nrm[lo][1]];
}
function spawnN(exp, fn) { let n = Math.floor(exp); if (Math.random() < exp - n) n++; for (let i = 0; i < n && PARTS.length < MAXP; i++) fn(); }
function emitFront(dt) {
  if (REDUCED) return;
  const kk = G.s * CAM.z;
  for (const f of FRONT) {
    const I = f.I; if (I < 0.02) continue;
    const base = f.len * kk / 100;
    const pF = clamp(0.5 + 0.12 * f.M, 0.2, 0.8);
    spawnN(2.1 * I * base * dt, () => { const [x, y, nx, ny] = samplePoint(f), s = Math.random() < pF ? -1 : 1, o = 0.3 + Math.random() * 1.1; PARTS.push({ k: 'fl', x: x + nx * o * s, y: y + ny * o * s, t: 0, life: 0.13 + Math.random() * 0.08, r: 2 + Math.random() * 2.4 }); });
    spawnN(0.36 * I * base * dt, () => { const [x, y, nx, ny] = samplePoint(f), s = Math.random() < pF ? -1 : 1, o = 0.4 + Math.random() * 1.4; blast(x + nx * o * s, y + ny * o * s, 1); });
    spawnN(1.5 * I * base * dt, () => { const [x, y, nx, ny] = samplePoint(f), s = Math.random() < pF ? 1 : -1, o0 = 0.9 + Math.random() * 1.2, o1 = 0.5 + Math.random() * 1.2; PARTS.push({ k: 'tr', x0: x + nx * o0 * s, y0: y + ny * o0 * s, x1: x - nx * o1 * s, y1: y - ny * o1 * s, side: s > 0 ? 'F' : 'L', t: 0, life: 0.22 + Math.random() * 0.12 }); });
    spawnN(0.5 * I * base * dt, () => { const [x, y, nx, ny] = samplePoint(f), o = (Math.random() * 2 - 1) * 1.2; smoke(x + nx * o, y + ny * o, 1); });
  }
}
function smoke(x, y, sz) { if (PARTS.length < MAXP) PARTS.push({ k: 'sm', x, y, vx: 0.22 + Math.random() * 0.2, vy: -0.12 - Math.random() * 0.1, t: 0, life: 2.4 + Math.random() * 1.8, r0: 3 * sz, r1: (12 + Math.random() * 8) * sz }); }
function blast(x, y, sz) {
  PARTS.push({ k: 'bl', x, y, t: 0, life: 0.55 + 0.25 * sz, r: 9 * sz });
  for (let i = 0; i < 3 + 4 * sz && PARTS.length < MAXP; i++) { const a = Math.random() * 6.283, v = (1.2 + Math.random() * 2.6) * Math.sqrt(sz); PARTS.push({ k: 'sp', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, t: 0, life: 0.35 + Math.random() * 0.3 }); }
  if (Math.random() < 0.7) smoke(x, y, sz);
}
function bigBlast(x, y) {
  PARTS.push({ k: 'sw', x, y, t: 0, life: 1.0, r: 150 });
  blast(x, y, 3.2);
  for (let i = 0; i < 7; i++) smoke(x + (Math.random() * 2 - 1) * 1.2, y + (Math.random() * 2 - 1) * 1.2, 2.2);
  const fl = $('#flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
  shake(7);
}

// ---------------------------------------------------------------------
// Desenho de cada quadro
// ---------------------------------------------------------------------
let WASH_OP = params.get('wash') || 'color';
function nightK() { const fr = S.frames[S.idx]; if (!fr) return 0.25; return clamp((fr.m - 52) / 48, 0, 1); }
function drawFrame(now, dt) {
  const c = ctx, kk = G.s * CAM.z;
  if (BASE_DIRTY) { renderBase(); BASE_DIRTY = false; }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'copy'; c.drawImage(BASE, 0, 0); c.globalCompositeOperation = 'source-over';
  // lavagem de território sobre o relevo
  setWorld(c);
  const xf = clamp((now - S.xf0) / 520, 0, 1);
  c.globalCompositeOperation = WASH_OP;
  if (xf < 1) { c.globalAlpha = 1 - xf; c.drawImage(TWO, WB.x0, WB.y0, WB.w, WB.h); c.globalAlpha = xf; }
  c.drawImage(TW, WB.x0, WB.y0, WB.w, WB.h);
  c.globalAlpha = 1;
  if (WASH_OP === 'source-over') { c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.9; c.drawImage(BASE, 0, 0, BASE.width, BASE.height, (CAM.x * kk - G.W / 2) / kk, (CAM.y * kk - G.H / 2) / kk, G.W / kk, G.H / kk); c.globalAlpha = 1; }
  c.globalCompositeOperation = 'source-over';
  // áreas em disputa (hachura)
  for (const side of ['F', 'L']) { const P = side === 'F' ? PART_F : PART_L; if (!P) continue; setWorld(c); c.save(); c.clip(P); c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.fillStyle = HPAT[side]; c.globalAlpha = 0.85; c.fillRect(0, 0, G.W, G.H); c.restore(); c.globalAlpha = 1; }
  // neblina de guerra (fumaça que se move)
  drawFog(c, now);
  // luz do dia / noite
  const nk = nightK();
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (nk > 0) { c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${Math.round(255 - 152 * nk)},${Math.round(255 - 130 * nk)},${Math.round(255 - 84 * nk)})`; c.fillRect(0, 0, cv.width, cv.height); }
  else { const fr = S.frames[S.idx], m = fr ? fr.m : 0, w = clamp(1 - m / 52, 0, 1) * 0.6; if (w > 0) { c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(255,${Math.round(255 - 22 * w)},${Math.round(255 - 52 * w)})`; c.fillRect(0, 0, cv.width, cv.height); } }
  c.globalCompositeOperation = 'source-over';
  drawFront(c, now);
  drawGhost(c);
  drawArrows(c, now);
  drawUnits(c, dt);
  drawCapitals(c, now);
  if (MAPVIS) emitFront(dt);
  drawParticles(c, dt);
  drawLights(c, now, nk);
  c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(VIG, 0, 0, cv.width, cv.height);
  if (!MOBILE) { c.globalAlpha = 0.55; c.fillStyle = GRAIN; c.setTransform(1, 0, 0, 1, Math.floor(Math.random() * 128), Math.floor(Math.random() * 128)); c.fillRect(-128, -128, cv.width + 128, cv.height + 128); c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0); }
  sndTick(now);
}
function drawFog(c, now) {
  const f = FOGX, W2 = FOGC.width, H2 = FOGC.height, t = REDUCED ? 0 : now / 1000;
  f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'source-over'; f.globalAlpha = 1; f.clearRect(0, 0, W2, H2);
  const sx = G.s * CAM.z / 7;
  try { PAT0.setTransform(new DOMMatrix([sx * 1.3, 0, 0, sx * 1.3, (t * 7) % 512, (t * 3) % 512])); PAT1.setTransform(new DOMMatrix([sx * 2, 0, 0, sx * 2, -(t * 13) % 512, (t * 5) % 512])); } catch (e) {}
  f.fillStyle = PAT0; f.fillRect(0, 0, W2, H2);
  f.fillStyle = PAT1; f.fillRect(0, 0, W2, H2);
  f.globalCompositeOperation = 'destination-in'; setWorld(f, G.dpr / 2); f.drawImage(FM, WB.x0, WB.y0, WB.w, WB.h);
  f.globalCompositeOperation = 'source-over';
  c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(FOGC, 0, 0, cv.width, cv.height);
}
function drawFront(c, now) {
  if (!FRONT.length) return;
  const kk = G.s * CAM.z, fl = 0.5 + 0.5 * Math.sin(now / 90);
  setWorld(c);
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.globalCompositeOperation = 'lighter';
  for (const f of FRONT) { if (f.I < 0.02) continue; c.strokeStyle = `rgba(255,${Math.round(96 + 50 * fl)},30,${(0.08 + 0.26 * f.I).toFixed(3)})`; c.lineWidth = (5 + 9 * f.I) / kk; c.stroke(f.path); }
  c.globalCompositeOperation = 'source-over';
  for (const f of FRONT) {
    c.strokeStyle = 'rgba(10,6,3,.82)'; c.lineWidth = 3.4 / kk; c.stroke(f.path);
    c.strokeStyle = 'rgba(255,190,90,.95)'; c.lineWidth = 1.5 / kk; c.stroke(f.lp);
    c.strokeStyle = 'rgba(120,220,245,.95)'; c.stroke(f.rp);
    if (f.I > 0.05) { c.strokeStyle = `rgba(255,214,140,${(0.25 + 0.6 * f.I * fl).toFixed(3)})`; c.lineWidth = 1 / kk; c.setLineDash([3 / kk, 5 / kk]); c.lineDashOffset = -now / 40 / kk; c.stroke(f.path); c.setLineDash([]); }
    if (Math.abs(f.M) >= 0.04 && f.teeth.length) {
      const adv = f.M > 0 ? 'F' : 'L', sg = adv === 'F' ? 1 : -1, hb = 0.32, ht = 0.75;
      c.fillStyle = adv === 'F' ? 'rgba(255,190,90,.95)' : 'rgba(120,220,245,.95)'; c.beginPath();
      for (const [x, y, nx, ny] of f.teeth) { const bx = x + nx * 0.3 * sg, by = y + ny * 0.3 * sg, tx = -ny, ty = nx; c.moveTo(bx + tx * hb, by + ty * hb); c.lineTo(bx - tx * hb, by - ty * hb); c.lineTo(x - nx * ht * sg, y - ny * ht * sg); c.closePath(); }
      c.fill();
    }
  }
}
function drawGhost(c) {
  if (!GH.chains.length) return;
  const kk = G.s * CAM.z; setWorld(c); c.lineCap = 'round'; c.setLineDash([3.5 / kk, 4.5 / kk]);
  c.strokeStyle = 'rgba(8,8,6,.35)'; c.lineWidth = 2.4 / kk; for (const f of GH.chains) c.stroke(f.path);
  c.strokeStyle = 'rgba(248,244,226,.6)'; c.lineWidth = 1.2 / kk; for (const f of GH.chains) c.stroke(f.path);
  c.setLineDash([]);
}
function bez(a, t) { const u = 1 - t, x = u * u * a.x0 + 2 * u * t * a.cx + t * t * a.x1, y = u * u * a.y0 + 2 * u * t * a.cy + t * t * a.y1, dx = 2 * u * (a.cx - a.x0) + 2 * t * (a.x1 - a.cx), dy = 2 * u * (a.cy - a.y0) + 2 * t * (a.y1 - a.cy), L = Math.hypot(dx, dy) || 1; return [x, y, dx / L, dy / L]; }
function drawArrows(c, now) {
  if (!ARROWS.length) return;
  const kk = G.s * CAM.z;
  ARROWS = ARROWS.filter(a => now - a.t0 < a.life);
  setWorld(c);
  for (const a of ARROWS) {
    const age = now - a.t0, tEnd = easeOut(clamp(age / 1100, 0, 1)), fade = clamp((a.life - age) / 1200, 0, 1) * clamp(age / 200, 0, 1);
    if (tEnd < 0.06) continue;
    const headLen = Math.min(0.36, 3.0 / a.len), tNeck = Math.max(0.04, tEnd - headLen * tEnd), n = 20, Lp = [], Rp = [];
    const wT = a.w * 0.35, wN = a.w, wH = a.w * 2.4;
    for (let i = 0; i <= n; i++) { const t = tNeck * i / n, [px, py, tx, ty] = bez(a, t), w = wT + (wN - wT) * (i / n), nx = ty, ny = -tx; Lp.push([px + nx * w / 2, py + ny * w / 2]); Rp.push([px - nx * w / 2, py - ny * w / 2]); }
    const [hx, hy, htx, hty] = bez(a, tNeck), [ex, ey] = bez(a, tEnd), hnx = hty, hny = -htx;
    const P = new Path2D(); P.moveTo(Lp[0][0], Lp[0][1]); for (const p of Lp) P.lineTo(p[0], p[1]);
    P.lineTo(hx + hnx * wH / 2, hy + hny * wH / 2); P.lineTo(ex, ey); P.lineTo(hx - hnx * wH / 2, hy - hny * wH / 2);
    for (let i = Rp.length - 1; i >= 0; i--) P.lineTo(Rp[i][0], Rp[i][1]); P.closePath();
    const col = a.side === 'F' ? '240,160,40' : '40,180,210', g = c.createLinearGradient(a.x0, a.y0, ex, ey);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.45, `rgba(${col},${(0.5 * fade).toFixed(3)})`); g.addColorStop(1, `rgba(${col},${(0.95 * fade).toFixed(3)})`);
    c.fillStyle = g; c.fill(P);
    c.strokeStyle = `rgba(6,6,4,${(0.8 * fade).toFixed(3)})`; c.lineWidth = 1.3 / kk; c.stroke(P);
  }
}
function echelon(v) { return v >= 8e6 ? 'XXXXX' : v >= 3e6 ? 'XXXX' : v >= 1e6 ? 'XXX' : v >= 3e5 ? 'XX' : v >= 1e5 ? 'X' : 'III'; }
function haloText(c, t, x, y, fill) { c.lineWidth = 3; c.strokeStyle = 'rgba(5,5,3,.85)'; c.strokeText(t, x, y); c.fillStyle = fill; c.fillText(t, x, y); }
function drawUnits(c, dt) {
  if (!UNITS.size) return;
  const k = 1 - Math.exp(-dt * 2.6), ka = 1 - Math.exp(-dt * 4), list = [];
  for (const [key, un] of UNITS) {
    un.x += (un.tx - un.x) * k; un.y += (un.ty - un.y) * k; un.a += (un.ta - un.a) * ka;
    if (un.ta === 0 && un.a < 0.03) { UNITS.delete(key); continue; }
    const [sx, sy] = w2s(un.x, un.y); list.push({ un, sx, sy });
  }
  const sep = MOBILE ? 20 : 30;
  for (let it = 0; it < 2; it++) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const A = list[i], B = list[j], dx = B.sx - A.sx, dy = B.sy - A.sy, d = Math.hypot(dx, dy) || 0.01; if (d < sep) { const p = (sep - d) / 2, ux = dx / d, uy = dy / d; A.sx -= ux * p; A.sy -= uy * p; B.sx += ux * p; B.sy += uy * p; } }
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  const w = MOBILE ? 18 : 24, h = MOBILE ? 12 : 16;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  for (const { un, sx: x, sy: y } of list) {
    c.globalAlpha = un.a;
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x - w / 2 + 2, y - h / 2 + 2, w, h);
    c.fillStyle = un.side === 'F' ? '#b8770f' : '#167f99'; c.fillRect(x - w / 2, y - h / 2, w, h);
    c.strokeStyle = '#f1eedd'; c.lineWidth = 1.3; c.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1);
    c.beginPath(); c.moveTo(x - w / 2 + 1.5, y - h / 2 + 1.5); c.lineTo(x + w / 2 - 1.5, y + h / 2 - 1.5); c.moveTo(x + w / 2 - 1.5, y - h / 2 + 1.5); c.lineTo(x - w / 2 + 1.5, y + h / 2 - 1.5); c.lineWidth = 1; c.stroke();
    c.font = `800 ${MOBILE ? 8 : 9.5}px ${CONDF}`; haloText(c, echelon(un.votes), x, y - h / 2 - 3, '#f1eedd');
    c.font = `700 ${MOBILE ? 9.5 : 11}px ${CONDF}`; haloText(c, fmtMi(un.votes), x, y + h / 2 + (MOBILE ? 10 : 12), un.side === 'F' ? '#ffe0a8' : '#bff0fb');
  }
  c.globalAlpha = 1;
}
function drawStar(c, x, y, r, fill) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 1.3; c.strokeStyle = '#0b0b08'; c.stroke(); }
function leaderOf(fr, u) { const d = ufData(fr, u); return d && d.st > 0 && (d.F + d.L) ? (d.F >= d.L ? 'F' : 'L') : null; }
function drawCapitals(c, now) {
  const fr = S.frames[S.idx], z = CAM.z, full = z >= 1.45;
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.textBaseline = 'alphabetic';
  for (const cp of CAPS) {
    const [x, y] = w2s(cp.x, cp.y); if (x < -30 || x > G.W + 30 || y < -30 || y > G.H + 30) continue;
    const ld = leaderOf(fr, cp.uf), col = ld ? (ld === 'F' ? '#4f8df2' : '#e8473a') : '#a19f8c';
    if (cp.nat) drawStar(c, x, y, 7, col);
    else { c.beginPath(); c.arc(x, y, 3.7, 0, 6.283); c.fillStyle = col; c.fill(); c.lineWidth = 1.4; c.strokeStyle = '#0b0b08'; c.stroke(); c.beginPath(); c.arc(x, y, 6.2, 0, 6.283); c.strokeStyle = 'rgba(241,238,221,.6)'; c.lineWidth = 1; c.stroke(); }
    if (G.W >= 600 || full) { c.textAlign = 'left'; c.font = `700 ${full ? 11.5 : 10.5}px ${CONDF}`; haloText(c, full ? spaced(cp.n.toUpperCase()) : cp.uf.toUpperCase(), x + 8, y + 4, 'rgba(241,238,221,.92)'); }
  }
  // frota do Exterior
  const zf = CAPOF.zz, [fx, fy] = w2s(zf.x, zf.y);
  if (fx < -30 || fx > G.W + 30 || fy < -30 || fy > G.H + 30) return;
  const ld = leaderOf(fr, 'zz'), col = ld ? (ld === 'F' ? '#4f8df2' : '#e8473a') : '#a19f8c', bob = REDUCED ? 0 : Math.sin(now / 700) * 1.2, sc = MOBILE ? 0.8 : 1;
  c.save(); c.translate(fx, fy + bob); c.scale(sc, sc);
  c.beginPath(); c.moveTo(-17, -1); c.lineTo(17, -1); c.lineTo(12, 5); c.lineTo(-13, 5); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = '#0b0b08'; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = col; c.fillRect(-6, -6, 10, 5); c.strokeRect(-6, -6, 10, 5); c.fillRect(-2, -11, 3, 5); c.beginPath(); c.moveTo(6, -3); c.lineTo(14, -5); c.stroke();
  c.strokeStyle = 'rgba(160,200,230,.5)'; c.beginPath(); c.moveTo(-22, 7); c.quadraticCurveTo(-30, 8, -36, 10); c.stroke();
  c.restore();
  c.textAlign = 'center'; c.font = `700 ${MOBILE ? 9.5 : 10.5}px ${CONDF}`; { const lt = spaced(G.W < 600 ? 'EXTERIOR' : 'FROTA EXTERIOR'), tw = c.measureText(lt).width; haloText(c, lt, Math.min(fx, G.W - tw / 2 - 6), fy + 20 * sc, 'rgba(241,238,221,.88)'); }
  c.textAlign = 'left';
}
function drawParticles(c, dt) {
  if (!PARTS.length) return;
  const kk = G.s * CAM.z;
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  const keep = [];
  for (const p of PARTS) {
    p.t += dt; if (p.t >= p.life) continue; keep.push(p);
    const k = p.t / p.life;
    if (p.k === 'sm') {
      p.x += p.vx * dt; p.y += p.vy * dt; const [x, y] = w2s(p.x, p.y), r = (p.r0 + (p.r1 - p.r0) * k) * Math.min(1.5, CAM.z);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(96,94,84,${(0.3 * (1 - k) * Math.min(1, p.t * 4)).toFixed(3)})`; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    }
  }
  c.globalCompositeOperation = 'lighter';
  for (const p of keep) {
    const k = p.t / p.life;
    if (p.k === 'fl') { const [x, y] = w2s(p.x, p.y), r = p.r * (1 - k * 0.5); const g = c.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, `rgba(255,236,190,${(1 - k).toFixed(3)})`); g.addColorStop(1, 'rgba(255,140,40,0)'); c.fillStyle = g; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
    else if (p.k === 'bl') { const [x, y] = w2s(p.x, p.y), r = p.r * (0.3 + 0.9 * easeOut(k)); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,240,200,${(0.95 * (1 - k)).toFixed(3)})`); g.addColorStop(0.35, `rgba(255,150,50,${(0.7 * (1 - k)).toFixed(3)})`); g.addColorStop(1, 'rgba(120,30,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); }
    else if (p.k === 'sp') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 2.2 * dt; const [x, y] = w2s(p.x, p.y); c.fillStyle = `rgba(255,${Math.round(190 - 90 * k)},80,${(1 - k).toFixed(3)})`; c.fillRect(x - 1, y - 1, 2, 2); }
    else if (p.k === 'tr') { const x = p.x0 + (p.x1 - p.x0) * k, y = p.y0 + (p.y1 - p.y0) * k, bx = p.x0 + (p.x1 - p.x0) * Math.max(0, k - 0.25), by = p.y0 + (p.y1 - p.y0) * Math.max(0, k - 0.25), [sx, sy] = w2s(x, y), [tx, ty] = w2s(bx, by); c.strokeStyle = p.side === 'F' ? 'rgba(255,215,150,.9)' : 'rgba(170,235,250,.9)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(tx, ty); c.lineTo(sx, sy); c.stroke(); }
    else if (p.k === 'sw') { const [x, y] = w2s(p.x, p.y), r = p.r * easeOut(k) * Math.min(1.4, CAM.z); c.strokeStyle = `rgba(255,236,200,${(0.7 * (1 - k)).toFixed(3)})`; c.lineWidth = 3 * (1 - k) + 0.8; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.stroke(); }
  }
  c.globalCompositeOperation = 'source-over';
  PARTS = keep;
}
function drawLights(c, now, nk) {
  if (nk < 0.05) return;
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.globalCompositeOperation = 'lighter';
  const fr = S.frames[S.idx];
  for (const cp of CAPS) {
    const [x, y] = w2s(cp.x, cp.y); if (x < -40 || x > G.W + 40 || y < -40 || y > G.H + 40) continue;
    const d = ufData(fr, cp.uf), on = d && d.st > 0 ? 1 : 0.55, fl = REDUCED ? 1 : 0.86 + 0.14 * Math.sin(now / 170 + cp.x * 3), r = (cp.nat ? 24 : 17) * fl * Math.min(1.7, CAM.z);
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,206,130,${(0.42 * nk * on).toFixed(3)})`); g.addColorStop(1, 'rgba(255,206,130,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.globalCompositeOperation = 'source-over';
}
let RAF = 0, LASTT = 0;
function loop(now) {
  RAF = 0;
  if (document.hidden || (!MAPVIS && !REC.on)) return;
  const minDt = MOBILE ? 30 : 14;
  if (now - LASTT < minDt) { RAF = requestAnimationFrame(loop); return; }
  const dt = Math.min(0.1, (now - LASTT) / 1000 || 0.016); LASTT = now;
  updateCamera(dt, now);
  tvTour(now);
  drawFrame(now, dt);
  RAF = requestAnimationFrame(loop);
}
function startLoop() { if (!RAF) RAF = requestAnimationFrame(loop); }

// ---------------------------------------------------------------------
// Painéis
// ---------------------------------------------------------------------
function insignia(side) { const c = side === 'F' ? '#c07a12' : '#137a92'; return `<svg class="ins" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="${c}" stroke="#e6e2cf" stroke-width="2"/><circle cx="22" cy="22" r="14.5" fill="none" stroke="rgba(230,226,207,.45)" stroke-width="1"/><path d="M22 10.5l3.1 7.3 7.9.6-6 5.1 1.9 7.7-6.9-4.2-6.9 4.2 1.9-7.7-6-5.1 7.9-.6z" fill="#e6e2cf"/></svg>`; }
function momOf(side) {
  const fr = S.frames[S.idx]; if (!fr || S.idx < 1) return '';
  let j = S.idx; while (j > 0 && S.frames[j].m > fr.m - 10) j--; if (j === S.idx) return '';
  const f0 = S.frames[j], br = fr.br, vv = br.F + br.L + (br.O || 0), v0 = f0.br.F + f0.br.L + (f0.br.O || 0); if (!v0 || !vv) return '';
  const d = side === 'F' ? 100 * br.F / vv - 100 * f0.br.F / v0 : 100 * br.L / vv - 100 * f0.br.L / v0;
  if (Math.abs(d) < 0.05) return '<span style="color:var(--mut)">estável</span>';
  return d > 0 ? `<span style="color:var(--ok)">▲ ${dec(d, 1)} p.p.</span>` : `<span style="color:var(--bad)">▼ ${dec(-d, 1)} p.p.</span>`;
}
function renderBoard() {
  const fr = S.frames[S.idx], M = CMETA[S.mode], br = fr ? fr.br : null;
  const vv = br ? br.F + br.L + (br.O || 0) : 0, pa = vv ? 100 * br.F / vv : null, pb = vv ? 100 * br.L / vv : null, po = vv ? 100 * (br.O || 0) / vv : 0, pst = br && br.ts ? 100 * br.st / br.ts : 0;
  const lead = vv ? (br.F >= br.L ? 'F' : 'L') : null, fin = br && br.st >= br.ts && (S.mode === 'r22' || S.mode === 'sim');
  const win = { F: S.eleito === 'F' || (fin && br.F > br.L), L: S.eleito === 'L' || (fin && br.L > br.F) }, wtx = S.mode === 'live' ? 'eleito' : 'venceu';
  const lastOf = side => { const ev = S.events.filter(e => e.k <= S.idx && e.side === side && e.short).pop(); return ev ? `${clk(ev.m)} · ${esc(ev.short)}` : 'Aguardando o primeiro combate.'; };
  const card = side => {
    const isF = side === 'F', p = isF ? pa : pb, v = br ? (isF ? br.F : br.L) : null;
    const bd = win[side] ? `<span class="badge win">${wtx}</span>` : lead === side ? '<span class="badge">na frente</span>' : '';
    const bdM = bd.replace('class="badge', 'class="badge showM'), bdD = bd.replace('class="badge', 'class="badge hideM');
    return `<div class="hd">${insignia(side)}<div><div class="rank">${isF ? '' : bdM}Alto comando ${isF ? 'azul' : 'vermelho'}${isF ? bdM : ''}</div><div class="nm">${esc(isF ? M.a : M.b)}</div></div></div>
      <div class="big${p == null ? ' off' : ''}">${p == null ? '00,00%' : fmtP(p, 2)}</div>
      <div class="sub">${isF ? '' : bdD}${v != null ? fmtN(v) + ' votos' : 'votos válidos'}${isF ? bdD : ''}</div>
      <div class="stats"><div class="stat"><span>Território</span><b>${dec(territory(side), 1)}% do mapa</b></div><div class="stat"><span>Capitais</span><b>${statesLed(fr, side)} de 27</b></div><div class="stat"><span>Avanço 10 min</span><b>${momOf(side) || '<span style="color:var(--mut)">aguardando</span>'}</b></div></div>
      <div class="last">${lastOf(side)}</div>`;
  };
  $('#hqA').innerHTML = card('F'); $('#hqB').innerHTML = card('L');
  $('#tugA').style.width = (pa != null ? pa : 50) + '%'; $('#tugO').style.width = po + '%'; $('#tugB').style.width = (pb != null ? pb : 50) + '%';
  $('#knot').style.left = (pa != null ? pa + po / 2 : 50) + '%';
  $('#tugLa').textContent = pa != null ? `${M.ashort} ${fmtP(pa, 2)}` : `Azul (${M.ashort})`; $('#tugLb').textContent = pb != null ? `${fmtP(pb, 2)} ${M.bshort}` : `Vermelho (${M.bshort})`;
  $('#progFill').style.width = pst + '%'; $('#progL').textContent = `Território apurado: ${fmtP(pst, 2)}`; $('#progR').textContent = br ? `${fmtN(br.st)} de ${fmtN(br.ts)} seções${po > 0.05 ? ` · outros ${fmtP(po, 1)}` : ''}` : '';
  $('#hudPct').textContent = fmtP(pst, pst >= 99.995 || pst === 0 ? 0 : 1);
  const dl = S.mode === 'live' && DAYS[S.E] ? (() => { const [d, mo, y] = DAYS[S.E].split('/'); return `${+d} ${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][+mo - 1]} ${y}`; })() : DATEL[S.mode];
  $('#hudTL').innerHTML = `Carta de situação · <span>${esc(dl)}</span><b>${fr ? clk(fr.m) + ' · ' + hplus(fr.m) : 'H-0'}</b>`;
  renderFronts(fr); renderUfGrid(fr);
  const lg = [`<span><i style="background:var(--F)"></i>Azul · ${esc(M.ashort)}</span>`, `<span><i style="background:var(--L)"></i>Vermelho · ${esc(M.bshort)}</span>`, '<span><i style="background:#2c2f27;border:1px solid #555"></i>Neblina de guerra (não apurado)</span>', '<span><i style="background:repeating-linear-gradient(135deg,#9cc1ff 0 2px,transparent 2px 5px)"></i>Área em disputa</span>', '<span><i style="background:linear-gradient(#6098ff 0 35%,#140a05 35% 65%,#ff604c 65%)"></i>Linha de frente</span>', '<span><i style="background:#2b62c4;outline:1px solid #f1eedd"></i>Unidade (votos no estado)</span>'];
  if (S.mode === 'r26') lg.push('<span><i style="background:#8b7bd8"></i>Outros (só no cabo de guerra)</span>');
  if (ghostActive()) lg.push('<span><i style="height:0;border-top:2px dashed #f5f0dc;border-radius:0"></i>Fantasma de 2022 (mesmo % apurado)</span>');
  $('#legend').innerHTML = lg.join('');
  renderGhostUI(fr); renderReinf(fr); bolRender();
}
function renderFronts(fr) {
  const el = $('#fronts');
  if (!el.children.length) el.innerHTML = REGS.map(g => `<div class="front" data-g="${g}"><span class="fn">Frente ${REGN[g]}</span><div class="fb"><i class="a" style="background:var(--F);width:0"></i><i class="f" style="background:#30342b;width:100%"></i><i class="b" style="background:var(--L);width:0"></i></div><span class="fv">·</span></div>`).join('');
  for (const row of el.children) {
    const g = row.dataset.g, hs = LAND.filter(h => REG[h.uf] === g); let a = 0, b = 0; hs.forEach(h => { if (h.own === 'F') a += h.frac; else if (h.own === 'L') b += h.frac; });
    const n = hs.length, pa = 100 * a / n, pb = 100 * b / n;
    row.querySelector('.a').style.width = pa + '%'; row.querySelector('.b').style.width = pb + '%'; row.querySelector('.f').style.width = Math.max(0, 100 - pa - pb) + '%';
    let F = 0, L = 0; UFS.forEach(u => { if (REG[u] !== g) return; const d = ufData(fr, u); if (d) { F += d.F; L += d.L; } });
    row.querySelector('.fv').textContent = F + L ? `votos ${dec(100 * F / (F + L), 1)}% x ${dec(100 * L / (F + L), 1)}%` : 'sem combate';
  }
}
const UFORD = ['sp', 'mg', 'rj', 'ba', 'rs', 'pr', 'pe', 'ce', 'pa', 'sc', 'go', 'ma', 'am', 'es', 'pb', 'rn', 'mt', 'al', 'pi', 'df', 'ms', 'se', 'ro', 'to', 'ac', 'ap', 'rr', 'zz'];
let GRID_SILENT = false;
function renderUfGrid(fr) {
  const el = $('#ufgrid'), M = CMETA[S.mode];
  if (!el.children.length) el.innerHTML = UFORD.map(u => `<div class="uft" data-uf="${u}">${u === 'zz' ? 'EXT' : u.toUpperCase()}<small>·</small><i style="width:0"></i></div>`).join('');
  for (const t of el.children) {
    const u = t.dataset.uf, d = ufData(fr, u), two = d ? d.F + d.L : 0, vv = d ? two + (d.O || 0) : 0, f = d && d.ts ? d.st / d.ts : 0;
    const ld = d && d.st > 0 && two ? (d.F >= d.L ? 'F' : 'L') : null, sh = ld ? 100 * (ld === 'F' ? d.F : d.L) / vv : 0, mg = ld ? Math.abs(d.F - d.L) / two : 0;
    if (t.dataset.lead && ld && t.dataset.lead !== ld && !GRID_SILENT) { t.classList.remove('flip'); void t.offsetWidth; t.classList.add('flip'); }
    t.dataset.lead = ld || '';
    t.style.background = ld ? `rgba(${ld === 'F' ? '52,118,232' : '222,52,38'},${(0.28 + 0.6 * clamp(mg / 0.3, 0, 1)).toFixed(2)})` : '';
    t.querySelector('small').textContent = ld ? `${ld === 'F' ? M.ashort : M.bshort} ${dec(sh, 1)}%` : (f > 0 ? 'apurando' : 'neblina');
    t.querySelector('i').style.width = (100 * f).toFixed(1) + '%';
    t.title = `${UFN[u]}: ${dec(100 * f, 1)}% apurado` + (ld ? ` · ${M.ashort} ${dec(100 * d.F / vv, 1)}% x ${dec(100 * d.L / vv, 1)}% ${M.bshort}` : '');
  }
}

// ---------------------------------------------------------------------
// Comunicados (eventos)
// ---------------------------------------------------------------------
const VERB_FLAG = ['estabelecem posição', 'tomam a capital', 'fincam bandeira', 'ocupam as primeiras linhas'];
function buildEvents() {
  const ev = [], M = CMETA[S.mode], nm = s => s === 'F' ? M.ashort : M.bshort;
  const FN = s => s === 'F' ? `forças azuis (${M.ashort})` : `forças vermelhas (${M.bshort})`;
  const leadUF = {}, swept = {}; let natLead = null, decided = false, started = false, mi = 0, nflag = 0; const miles = [10, 25, 50, 75, 90, 99];
  S.frames.forEach((fr, k) => {
    const br = fr.br, vv = br.F + br.L + (br.O || 0), pst = br.ts ? 100 * br.st / br.ts : 0;
    if (!vv) return;
    if (!started) { started = true; ev.push({ k, m: fr.m, side: null, kind: 'start', t: `Início das hostilidades. Chegam os primeiros relatórios do front: ${fmtP(pst, 2)} das seções apuradas.` }); }
    for (const u of UFS) {
      const d = fr.uf[u]; if (!d || !d.st || !(d.F + d.L)) continue;
      const f = d.st / d.ts, L = d.F >= d.L ? 'F' : 'L', sh = 100 * (L === 'F' ? d.F : d.L) / (d.F + d.L + (d.O || 0));
      if (!leadUF[u]) { if (f >= 0.01) { leadUF[u] = L; const vb = u === 'zz' ? 'assumem o comando da frota' : VERB_FLAG[nflag++ % VERB_FLAG.length]; ev.push({ k, m: fr.m, side: L, kind: 'flag', uf: u, t: `${cap1(FN(L))} ${vb} ${emUF(u)}: ${fmtP(sh, 1)} com ${fmtP(100 * f, 0)} apurado.`, short: `posição ${emUF(u)}` }); } }
      else if (leadUF[u] !== L && f >= 0.03) { leadUF[u] = L; ev.push({ k, m: fr.m, side: L, kind: 'flip', uf: u, big: true, t: `Virada ${emUF(u)}! ${cap1(FN(L))} rompem a linha inimiga e tomam ${u === 'zz' ? 'a frota' : 'o estado'} com ${fmtP(100 * f, 0)} apurado.`, short: `virada ${emUF(u)}`, banner: ['Virada ' + emUF(u), `${cap1(FN(L))} tomam ${u === 'zz' ? 'a frota' : 'a capital'}`] }); }
    }
    const NL = br.F >= br.L ? 'F' : 'L';
    if (natLead && NL !== natLead && pst >= 1) ev.push({ k, m: fr.m, side: NL, kind: 'nat', big: true, t: `VIRADA NACIONAL. ${cap1(FN(NL))} assumem a liderança da guerra com ${fmtP(pst, 1)} do território apurado.`, short: 'virada nacional', banner: ['Virada nacional', `${cap1(FN(NL))} assumem a liderança`] });
    natLead = NL;
    while (mi < miles.length && pst >= miles[mi]) { const g = ghostActive() ? ghostFrameAt(miles[mi] / 100) : null, gv = g ? g.br.F + g.br.L : 0; ev.push({ k, m: fr.m, side: NL, kind: 'mile', t: `Relatório de situação: ${miles[mi]}% do território apurado. Azul ${fmtP(100 * br.F / vv, 2)} x ${fmtP(100 * br.L / vv, 2)} vermelho.` + (gv ? ` Em 2022, nesse ponto: Jair ${fmtP(100 * g.br.F / gv, 2)} x ${fmtP(100 * g.br.L / gv, 2)} Lula.` : '') }); mi++; }
    for (const g of REGS) {
      const us = UFS.filter(u => REG[u] === g); let st = 0, ts = 0; const owners = new Set();
      us.forEach(u => { const d = fr.uf[u]; if (d) { st += d.st; ts += d.ts; owners.add(d.st && (d.F + d.L) ? (d.F >= d.L ? 'F' : 'L') : '?'); } });
      if (ts && st / ts >= 0.5 && owners.size === 1 && !owners.has('?')) { const s = [...owners][0], key = g + s; if (!swept[key]) { swept[key] = 1; ev.push({ k, m: fr.m, side: s, kind: 'sweep', reg: g, big: true, t: `${cap1(FN(s))} dominam a Frente ${REGN[g]}: todas as capitais da região estão sob seu controle.`, short: `domínio da Frente ${REGN[g]}` }); } }
    }
    if (S.mode !== 'r26' && !decided && br.te > 0 && br.st < br.ts && Math.abs(br.F - br.L) > br.te - br.est) {
      decided = true; const w = br.F > br.L ? 'F' : 'L', o = w === 'F' ? 'L' : 'F';
      ev.push({ k, m: fr.m, side: w, kind: 'decid', big: true, t: `Vitória matemática de ${nm(w)}: a vantagem (${fmtBig(Math.abs(br.F - br.L))} de votos) já supera todo o efetivo que falta apurar (${fmtBig(br.te - br.est)} de eleitores). Nem com todos ao lado de ${nm(o)} haveria virada.`, short: 'vitória matemática', banner: ['Vitória matemática', `${nm(w)} não pode mais ser alcançado`] });
    }
    if (br.st >= br.ts && !ev.some(e => e.kind === 'end')) {
      const w = br.F >= br.L ? 'F' : 'L', pw = fmtP(100 * (w === 'F' ? br.F : br.L) / vv, 2), dm = Math.abs(br.F - br.L), mgs = dm < 1e6 ? `vantagem de ${fmtN(dm)} votos` : `vantagem de ${fmtBig(dm)} de votos`;
      ev.push({ k, m: fr.m, side: w, kind: 'end', big: true, short: S.mode === 'r26' ? 'terminou o 1º turno na frente' : 'cessar-fogo na frente', t: S.mode === 'r26' ? `Cessar-fogo. Fim do 1º turno: ${nm(w)} termina na frente, com ${pw} dos válidos (${mgs}).` : S.mode === 'live' ? `Cessar-fogo. Território 100% apurado: ${nm(w)} termina com ${pw} dos válidos (${mgs}).` : `Cessar-fogo. Fim da ${S.mode === 'sim' ? 'simulação' : 'batalha'}: ${nm(w)} vence com ${pw} dos válidos (${mgs}).`, banner: ['Cessar-fogo', S.mode === 'r26' ? `${nm(w)} termina na frente` : S.mode === 'live' ? `${nm(w)} na frente com 100%` : `${nm(w)} vence com ${pw}`] });
    }
  });
  if (S.mode === 'live' && S.eleito) { const fr = S.frames[S.frames.length - 1]; ev.push({ k: S.frames.length - 1, m: fr.m, side: S.eleito, kind: 'eleito', big: true, short: 'eleito pelo TSE', t: `O TSE declara ${S.eleito === 'F' ? M.a : M.b} eleito presidente.`, banner: ['Fim da guerra', `${S.eleito === 'F' ? M.a : M.b} eleito`] }); }
  ev.forEach((e, i) => e.n = i + 1);
  return ev;
}
let TYPEJOB = null;
function renderFeed() {
  const el = $('#feed'), list = S.events.filter(e => e.k <= S.idx);
  const sig = list.length + '|' + S.mode + '|' + (list.length ? list[list.length - 1].t : '');
  if (el.dataset.sig === sig) return;
  const grew = list.length > S.shownEv && el.dataset.mode === S.mode;
  el.dataset.sig = sig; el.dataset.mode = S.mode; S.shownEv = list.length;
  el.innerHTML = list.length ? list.slice().reverse().map((e, j) => `<li class="${e.side || ''} ${e.big ? 'big' : ''} ${grew && j === 0 ? 'new' : ''}"><div class="ch"><span>Comunicado nº ${String(e.n).padStart(3, '0')}</span><span>${clk(e.m)}</span></div><div class="ct">${esc(e.t)}</div></li>`).join('') : '<li><div class="ch"><span>Comunicado</span><span>·</span></div><div class="ct">Nenhum combate ainda. Os comunicados do front aparecem aqui conforme a apuração avança.</div></li>';
  if (grew && !REDUCED && (!S.playing || S.speed <= 3)) { const ct = el.querySelector('li .ct'); if (ct) typewrite(ct); }
  updTicker();
}
function typewrite(elm) {
  if (TYPEJOB) clearInterval(TYPEJOB.id);
  const full = elm.textContent; let i = 0; elm.textContent = '';
  sndTeletype(Math.min(10, Math.ceil(full.length / 14)));
  TYPEJOB = { id: setInterval(() => { i = Math.min(full.length, i + 3); elm.textContent = full.slice(0, i); if (i >= full.length) { clearInterval(TYPEJOB.id); TYPEJOB = null; } }, 16) };
}
function showBanner(b, side, m) {
  BANNER_NOW = { b, side, m, t0: performance.now() };
  const el = $('#banner');
  el.innerHTML = `<div class="bk">Despacho urgente · ${clk(m)}${S.mode === 'sim' ? ' · simulação' : S.mode !== 'live' ? ' · reprise' : ''}</div><div class="bt" style="color:${side === 'F' ? '#ffd089' : side === 'L' ? '#9fe3f2' : '#fff'}">${esc(b[0])}</div><div class="bs">${esc(b[1] || '')}</div>`;
  el.style.borderTopColor = side === 'F' ? 'var(--F)' : side === 'L' ? 'var(--L)' : 'var(--amber)';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function fireEffects(prevIdx) {
  const fresh = S.events.filter(e => e.k > prevIdx && e.k <= S.idx);
  if (!fresh.length) return;
  const many = fresh.length > 14;
  let camEv = null, rank = { nat: 5, decid: 4, end: 4, eleito: 6, flip: 3, sweep: 2 };
  for (const e of fresh) {
    if (e.kind === 'flag' && e.uf && !many) { const c = CAPOF[e.uf]; if (c) blast(c.x, c.y, 1.6); sndBoom(0.5, 0, false); }
    if (e.kind === 'flip' && e.uf) { const c = CAPOF[e.uf]; if (c) bigBlast(c.x, c.y); sndBoom(0.1, (w2s(c.x, c.y)[0] / G.W) * 1.6 - 0.8, true); }
    if (e.kind === 'nat') { shake(9); sndSiren(); const fl = $('#flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); }
    if (e.kind === 'decid' || e.kind === 'end' || e.kind === 'eleito') sndBugle();
    if (rank[e.kind] && (!camEv || rank[e.kind] > rank[camEv.kind])) camEv = e;
  }
  const ban = fresh.filter(e => e.banner).pop();
  if (ban && fresh.length < 40) showBanner(ban.banner, ban.side, ban.m);
  narEvents(fresh);
  alrEvents(fresh);
  if (camEv) {
    if (camEv.kind === 'flip' && CAPOF[camEv.uf]) camFocus(CAPOF[camEv.uf].x, CAPOF[camEv.uf].y, camEv.uf === 'zz' ? 1.6 : 2.0, 2600);
    else if (camEv.kind === 'sweep' && REGC[camEv.reg]) camFocus(REGC[camEv.reg][0], REGC[camEv.reg][1], 1.5, 2400);
    else if (camEv.kind === 'nat') camFocus(G.hx, G.hy, 1.08, 2200);
    else if ((camEv.kind === 'end' || camEv.kind === 'eleito') && !CAM.user) camHome();
  }
}

// ---------------------------------------------------------------------
// Aplicar um quadro
// ---------------------------------------------------------------------
function setIdx(i, opts = {}) {
  if (!S.frames.length) return;
  const prev = S.idx; S.idx = clamp(i, 0, S.frames.length - 1);
  if (S.idx < prev || opts.reset) { ARROWS = []; ABASE = {}; }
  const live = S.mode === 'live' && S.idx === S.frames.length - 1;
  computeTerritory(S.frames[S.idx], live);
  computeDynamics();
  renderTerritory(!!opts.instant);
  buildFront();
  updateGhost();
  if (!opts.silent) updateArrows(); else { ABASE = {}; updateArrows(); }
  updateUnits();
  if (opts.instant) for (const un of UNITS.values()) { un.x = un.tx; un.y = un.ty; un.a = un.ta; }
  GRID_SILENT = !!opts.silent || S.idx < prev;
  renderFeed(); renderBoard(); renderTime();
  if (!opts.silent && S.idx > prev) fireEffects(prev);
}

// ---------------------------------------------------------------------
// Linha do tempo
// ---------------------------------------------------------------------
function renderTime() {
  const el = $('#timeBox'), n = S.frames.length;
  if (!n) { el.innerHTML = ''; el.dataset.built = ''; return; }
  const rep = S.mode !== 'live';
  if (!el.dataset.built || el.dataset.mode !== S.mode) {
    el.innerHTML = `${rep ? `<button class="btn pri" id="tPlay">Assistir</button><div class="seg" id="tSpd">${[1, 3, 10].map(v => `<button data-v="${v}" class="${S.speed === v ? 'on' : ''}">${v}×</button>`).join('')}</div>` : `<button class="btn" id="tLive">Ao vivo</button>`}<input type="range" id="tRange" min="0" max="${n - 1}" value="${S.idx}"><span class="clk" id="tClk"></span>`;
    el.dataset.built = 1; el.dataset.mode = S.mode;
    $('#tRange').oninput = e => { stopPlay(); S.follow = +e.target.value >= S.frames.length - 1; setIdx(+e.target.value, { silent: true }); };
    if (rep) { $('#tPlay').onclick = () => S.playing ? stopPlay() : startPlay(); $$('#tSpd button').forEach(b => b.onclick = () => { S.speed = +b.dataset.v; $$('#tSpd button').forEach(x => x.classList.toggle('on', x === b)); if (S.playing) startPlay(true); }); }
    else $('#tLive').onclick = () => { S.follow = true; setIdx(S.frames.length - 1, { silent: true }); };
  }
  const r = $('#tRange'); r.max = n - 1; r.value = S.idx;
  $('#tClk').textContent = clk(S.frames[S.idx].m);
  const pb = $('#tPlay'); if (pb) pb.textContent = S.playing ? 'Pausar' : (S.idx >= n - 1 ? 'Rever' : 'Assistir');
  const lb = $('#tLive'); if (lb) lb.classList.toggle('on', S.idx === n - 1);
}
function startPlay(keep) {
  clearInterval(S.timer);
  if (!keep && S.idx >= S.frames.length - 1) setIdx(0, { silent: true, instant: true, reset: true });
  S.playing = true;
  S.timer = setInterval(() => { if (S.idx >= S.frames.length - 1) { stopPlay(); return; } setIdx(S.idx + 1); }, Math.round(760 / S.speed));
  renderTime();
}
function stopPlay() { clearInterval(S.timer); S.playing = false; const pb = $('#tPlay'); if (pb) pb.textContent = S.idx >= S.frames.length - 1 ? 'Rever' : 'Assistir'; }

// ---------------------------------------------------------------------
// Fontes de dados: TSE ao vivo, coletor, reprises e simulação
// ---------------------------------------------------------------------
const pad6 = e => String(e).padStart(6, '0');
async function getJSON(url, timeout = 15000) { const c = new AbortController(), t = setTimeout(() => c.abort(), timeout); try { const r = await fetch(url, { cache: 'no-store', signal: c.signal }); if (r.status === 404 || r.status === 403) { const e = new Error('404'); e.code = 404; throw e; } if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); } }
const ENS = {};
function loadEns(key) { if (!ENS[key]) ENS[key] = getJSON('../apuracao/ensaio-' + key + '.json', 30000).catch(e => { delete ENS[key]; throw e; }); return ENS[key]; }
function ensCum(d) {
  if (d._cum) return d._cum;
  const ks = d.cands.map(c => c.k), nk = ks.length; let mx = 0;
  for (const u of d.ufs) { const b = d.bins[u]; if (b.length) mx = Math.max(mx, b[b.length - 1][0]); }
  const cum = {};
  for (const u of d.ufs) { const b = d.bins[u], arr = new Array(mx + 1), acc = new Array(5 + nk).fill(0); let i = 0; for (let m = 0; m <= mx; m++) { while (i < b.length && b[i][0] <= m) { for (let j = 1; j < b[i].length; j++) acc[j - 1] += b[i][j]; i++; } arr[m] = acc.slice(); } cum[u] = arr; }
  return (d._cum = { mx, ks, cum });
}
function framesFromEns(d, kF) {
  const { mx, ks, cum } = ensCum(d), iF = ks.indexOf(kF), iL = ks.indexOf('L'), iO = ks.indexOf('o');
  const frames = []; let lastSt = 0;
  for (let m = 0; m <= mx; m++) {
    let st = 0; for (const u of d.ufs) st += cum[u][m][0];
    if (st <= lastSt) continue; lastSt = st;
    const fr = { m, at: 'r' + m, uf: {}, br: { st: 0, ts: 0, est: 0, te: 0, F: 0, L: 0, O: 0 } };
    for (const u of d.ufs) { const a = cum[u][m], x = { st: a[0], ts: d.nsec[u], est: a[1], te: d.apt[u], F: a[5 + iF], L: a[5 + iL], O: iO >= 0 ? a[5 + iO] : 0 }; fr.uf[u] = x; for (const k in x) fr.br[k] += x[k]; }
    frames.push(fr);
  }
  return frames;
}
function buildSim(d22, d26, T, seed) {
  const c22 = ensCum(d22), c26 = ensCum(d26), iJ = c22.ks.indexOf('J'), iL22 = c22.ks.indexOf('L'), iF = c26.ks.indexOf('F'), iL = c26.ks.indexOf('L'), iO = c26.ks.indexOf('o');
  const rnd = mulberry32(seed * 7919 + 13), U = d26.ufs, st = {};
  for (const u of U) { const a = c26.cum[u][c26.mx], F = a[5 + iF], L = a[5 + iL], O = a[5 + iO]; st[u] = { V: F + L + O, s: F / (F + L), eps: gauss(rnd) * (u === 'zz' ? 0.2 : 0.075), nsec: d26.nsec[u], apt: d26.apt[u] }; }
  const tot = U.reduce((a, u) => a + st[u].V, 0), share = dl => U.reduce((a, u) => a + st[u].V * sig(logit(st[u].s) + st[u].eps + dl), 0) / tot;
  let lo = -4, hi = 4; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (share(mid) < T) lo = mid; else hi = mid; }
  const dl = (lo + hi) / 2; U.forEach(u => { st[u].p = sig(logit(st[u].s) + st[u].eps + dl); });
  const mx = c22.mx, fin = {}; U.forEach(u => { const a = c22.cum[u][mx]; fin[u] = { J: a[5 + iJ], L: a[5 + iL22], sec: d22.nsec[u] }; });
  const frames = []; let lastSec = 0;
  for (let m = 0; m <= mx; m++) {
    let sec = 0; U.forEach(u => { sec += c22.cum[u][m][0]; });
    if (sec <= lastSec) continue; lastSec = sec;
    const fr = { m, at: 's' + m, uf: {}, br: { st: 0, ts: 0, est: 0, te: 0, F: 0, L: 0, O: 0 } };
    for (const u of U) {
      const a = c22.cum[u][m], f2 = fin[u], frac = f2.sec ? a[0] / f2.sec : 0, two = a[5 + iJ] + a[5 + iL22], ftwo = f2.J + f2.L;
      let drift = 0; if (two > 0 && ftwo > 0) drift = clamp(logit(a[5 + iJ] / two) - logit(f2.J / ftwo), -0.7, 0.7) * Math.min(1, two / (0.02 * ftwo));
      const p = sig(logit(st[u].p) + drift), valid = frac * st[u].V;
      const x = { st: Math.round(frac * st[u].nsec), ts: st[u].nsec, est: Math.round(frac * st[u].apt), te: st[u].apt, F: Math.round(valid * p), L: Math.round(valid * (1 - p)), O: 0 };
      fr.uf[u] = x; for (const k in x) fr.br[k] += x[k];
    }
    frames.push(fr);
  }
  return frames;
}
function parseU(j) { const o = { st: +j.s.st, ts: +j.s.ts, est: +(j.e && j.e.est) || 0, te: +(j.e && j.e.te) || 0, c: {}, eleito: null, dt: j.dt || j.dg, ht: j.ht || j.hg }; const walk = x => { if (!x || typeof x !== 'object') return; if (Array.isArray(x)) { x.forEach(walk); return; } if (Array.isArray(x.cand)) x.cand.forEach(c => { o.c[c.n] = +c.vap || 0; if (c.e === 's' && /^eleit/i.test(c.st || '')) o.eleito = c.n; }); for (const k in x) if (k !== 'cand' && typeof x[k] === 'object') walk(x[k]); }; walk(j.carg); return o; }
function toFD(x) { const F = x.c['22'] || 0, L = x.c['13'] || 0; let O = 0; for (const k in x.c) if (k !== '22' && k !== '13') O += x.c[k]; return { st: x.st, ts: x.ts, est: x.est, te: x.te, F, L, O }; }
function tseMin(dt, ht, day) { if (!dt || !ht) return null; const [d, mo, y] = dt.split('/').map(Number), [h, mi, se] = ht.split(':').map(Number), [d0, mo0, y0] = day.split('/').map(Number); return (Date.UTC(y, mo - 1, d, h, mi, se) - Date.UTC(y0, mo0 - 1, d0, 17, 0, 0)) / 60000; }
const LIVE = { uf: {}, key: {}, busy: false, last: 0, next: 0, abAt: {}, abKey: {} };
async function detectE() { if (params.get('e')) return params.get('e'); try { const j = await getJSON(TSE + '/comum/config/ele-c.json', 10000); for (const pl of j.pl || []) if (pl.c === CICLO) for (const e of pl.e || []) { if (e.t === '2' && e.tp === '8') return e.cd; if (e.t === '1' && e.tp === '8' && e.cdt2) return e.cdt2; } } catch (e) {} return '6258'; }
async function loadHistory() {
  try {
    const o = await getJSON(HIST_URL + 'e' + pad6(S.E) + '.json?t=' + Math.floor(Date.now() / 120000), 12000);
    const ks = o.ks, iF = ks.indexOf('22'), iL = ks.indexOf('13'), oth = 5 + ks.length;
    return o.snaps.map(a => { const fr = { m: a[0], at: a[1], uf: {}, br: { st: a[2][0], ts: a[2][1], est: a[2][2], te: a[2][3], F: a[2][5 + iF] || 0, L: a[2][5 + iL] || 0, O: a[2][oth] || 0 } }; UFS.forEach((u, i) => { const x = a[3][i]; if (x) fr.uf[u] = { st: x[0], ts: x[1], est: x[2], te: x[3], F: x[5 + iF] || 0, L: x[5 + iL] || 0, O: x[oth] || 0 }; }); return fr; });
  } catch (e) { return []; }
}
async function fetchLive() {
  const E = S.E, base = `${TSE}/${CICLO}/${E}/dados`;
  let ab = null; try { ab = await getJSON(`${base}/br/br-e${pad6(E)}-ab.json`); } catch (e) { if (e.code !== 404) throw e; }
  const br = parseU(await getJSON(`${base}/br/br-c0001-e${pad6(E)}-u.json`));
  const keyOf = u => { const a = ab && (ab.abr || []).find(x => x.cdabr === u); return a ? (a.s && a.s.st) + '|' + a.ht + '|' + a.dt : null; };
  const need = UFS.filter(u => !LIVE.uf[u] || keyOf(u) === null || LIVE.key[u] !== keyOf(u));
  await Promise.allSettled(need.map(async u => { const j = await getJSON(`${base}/${u}/${u}-c0001-e${pad6(E)}-u.json`); LIVE.uf[u] = toFD(parseU(j)); LIVE.key[u] = keyOf(u); }));
  const every = (MOBILE ? 180 : 120) * 1000;
  const due = UFS.filter(u => u !== 'zz' && LIVE.uf[u] && LIVE.uf[u].st > 0 && LIVE.uf[u].st < LIVE.uf[u].ts && (Date.now() - (LIVE.abAt[u] || 0) > every) && LIVE.abKey[u] !== keyOf(u));
  await Promise.allSettled(due.map(async u => { const j = await getJSON(`${base}/${u}/${u}-e${pad6(E)}-ab.json`, 20000); const mf = {}; (j.abr || []).forEach(a => { if (a.tpabr === 'mun') { const te = +a.e.te, est = +a.e.est; mf[+a.cdabr] = te ? est / te : (+a.s.ts ? +a.s.st / +a.s.ts : 0); } }); S.munFrac[u] = mf; LIVE.abAt[u] = Date.now(); LIVE.abKey[u] = keyOf(u); }));
  UFS.forEach(u => { const x = LIVE.uf[u]; if (x && x.st >= x.ts && x.ts) { const mf = {}; BYUF[u].forEach(h => h.m.forEach(([c]) => { mf[c] = 1; })); S.munFrac[u] = mf; } });
  const fr = { m: tseMin(br.dt, br.ht, DAYS[E] || br.dt), at: br.dt + ' ' + br.ht, br: toFD(br), uf: {} };
  UFS.forEach(u => { if (LIVE.uf[u]) fr.uf[u] = LIVE.uf[u]; });
  S.eleito = br.eleito === '22' ? 'F' : br.eleito === '13' ? 'L' : null;
  return fr;
}
const PERIOD = 60000;
async function refreshLive(manual) {
  if (S.mode !== 'live' || LIVE.busy) return;
  LIVE.busy = true; const tok = S.tok;
  try {
    const fr = await fetchLive();
    if (tok !== S.tok || S.mode !== 'live') { LIVE.busy = false; return; }
    if (fr.br.st > 0) {
      const last = S.frames[S.frames.length - 1];
      if (!last || last.at !== fr.at) { S.frames.push(fr); S.frames.sort((a, b) => a.m - b.m); } else S.frames[S.frames.length - 1] = fr;
      S.events = buildEvents();
      if (S.follow) setIdx(S.frames.length - 1); else renderTime();
      S.status = fr.br.st >= fr.br.ts ? 'final' : 'live';
    } else S.status = 'zero';
    S.err = '';
    if (manual) toast('Dados atualizados com o TSE');
  } catch (e) { if (e.code === 404) S.status = 'nofile'; else { S.err = 'sem resposta do TSE'; if (!S.frames.length) S.status = 'err'; } }
  LIVE.busy = false; LIVE.last = Date.now(); LIVE.next = LIVE.last + PERIOD;
  renderStatus();
}
function renderStatus() {
  const p = $('#pill'), t = $('#pillTx'), st = $('#stamp');
  if (S.mode !== 'live') {
    p.className = 'pill ' + (S.mode === 'sim' ? 'sim' : 'rep'); t.textContent = S.mode === 'sim' ? 'Simulação' : S.mode === 'r22' ? 'Reprise · 2022' : 'Reprise · 1º turno';
    st.hidden = false; st.className = 'stamp' + (S.mode === 'sim' ? ' sim' : ''); st.textContent = S.mode === 'sim' ? 'Simulação' : 'Reprise';
    $('#overlay').hidden = true; return;
  }
  const map = { live: ['live', 'Ao vivo'], final: ['ok', 'Apuração concluída'], zero: ['wait', 'Aguardando os números'], nofile: ['wait', 'Aguardando o 2º turno'], err: ['wait', 'Sem conexão com o TSE'], load: ['wait', 'Carregando'] };
  const [c, tx] = map[S.status] || map.load; p.className = 'pill ' + c; t.textContent = tx + (S.err && S.frames.length ? ' · ' + S.err : '');
  st.hidden = !S.frames.length; st.className = 'stamp live'; st.textContent = S.status === 'final' ? 'Concluída' : 'Ao vivo';
  renderOverlay();
}
function renderOverlay() {
  const ov = $('#overlay');
  if (S.mode !== 'live' || S.frames.length) { ov.hidden = true; return; }
  const tgt = Date.UTC(2026, 9, 25, 20, 0, 0), left = Math.max(0, tgt - Date.now());
  const v = [Math.floor(left / 864e5), Math.floor(left % 864e5 / 36e5), Math.floor(left % 36e5 / 6e4), Math.floor(left % 6e4 / 1e3)];
  ov.hidden = false;
  if (!ov.dataset.built) {
    ov.innerHTML = `<div class="card"><h2 id="ovH"></h2><p>Quando o TSE publicar os primeiros números, a neblina de guerra começa a se dissipar e os dois exércitos avançam pelo território. Até lá, simule a batalha ou reveja a guerra de 2022.</p><div class="cd" id="cd"></div><div class="ovbtns"><button class="btn pri" id="goSim">Simular a batalha</button><button class="btn" id="goR22">Reprise de 2022</button></div></div>`;
    ov.dataset.built = 1; $('#goSim').onclick = () => setMode('sim', true); $('#goR22').onclick = () => setMode('r22', true);
  }
  $('#ovH').textContent = S.status === 'zero' ? 'Tropas em posição' : S.status === 'err' ? 'Sem conexão com o TSE' : 'A batalha começa às 17h de 25/10';
  $('#cd').innerHTML = left > 0 ? ['dias', 'horas', 'min', 'seg'].map((l, i) => `<div><b>${i ? String(v[i]).padStart(2, '0') : v[i]}</b><span>${l}</span></div>`).join('') : '<div><b>agora</b><span>tentando a cada minuto</span></div>';
}

// ---------------------------------------------------------------------
// Simulação: painel de controle
// ---------------------------------------------------------------------
function renderSimBox() {
  const el = $('#simBox');
  if (S.mode !== 'sim') { el.hidden = true; return; }
  el.hidden = false;
  if (!el.dataset.built) {
    el.innerHTML = `<div class="row"><span class="lbl">Placar final simulado</span><input type="range" id="simT" min="40" max="60" step="0.5"><span class="res" id="simRes"></span></div><div class="row" style="margin-top:8px"><button class="btn pri" id="simNew">Nova batalha</button><button class="btn" id="simEven">Empate 50 x 50</button><span style="color:var(--mut);font-size:13px" id="simSeedL"></span></div><p>Ritmo de apuração real do 2º turno de 2022, estado por estado, e mapa de votos do 1º turno de 2026, ajustado para o placar que você escolher, com pequenas variações por estado. Jogo de cenário, não é previsão.</p>`;
    el.dataset.built = 1;
    const sl = $('#simT');
    sl.oninput = () => { S.simT = +sl.value; simLabel(); };
    sl.onchange = () => { S.simT = +sl.value; runSim(); };
    $('#simNew').onclick = () => { S.simSeed = 1 + Math.floor(Math.random() * 9999); runSim(); };
    $('#simEven').onclick = () => { S.simT = 50; $('#simT').value = 50; runSim(); };
  }
  $('#simT').value = S.simT; simLabel();
}
function simLabel() { $('#simRes').innerHTML = `<span class="a">Flávio ${dec(S.simT, 1)}%</span> x <span class="b">${dec(100 - S.simT, 1)}% Lula</span>`; $('#simSeedL').textContent = `Batalha nº ${S.simSeed}`; }
async function runSim() {
  stopPlay(); simLabel();
  const tok = ++S.tok;
  const [d22, d26] = await Promise.all([loadEns('2t2022'), loadEns('1t2026')]);
  if (tok !== S.tok || S.mode !== 'sim') return;
  S.frames = buildSim(d22, d26, S.simT / 100, S.simSeed); S.events = buildEvents(); S.shownEv = 0; $('#feed').dataset.sig = '';
  resetFX(); PARTS = [];
  const u = new URL(location.href); u.searchParams.set('modo', 'simulacao'); u.searchParams.set('placar', String(S.simT)); u.searchParams.set('batalha', String(S.simSeed)); history.replaceState(null, '', u);
  setIdx(0, { silent: true, instant: true, reset: true }); startPlay(); renderStatus();
}

// ---------------------------------------------------------------------
// Modos
// ---------------------------------------------------------------------
async function setMode(m, autoplay) {
  stopPlay(); S.mode = m; S.frames = []; S.idx = -1; S.events = []; S.follow = true; S.eleito = null; S.shownEv = 0;
  const tok = ++S.tok;
  $$('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  const u = new URL(location.href); ['modo', 'placar', 'batalha'].forEach(k => u.searchParams.delete(k));
  if (m !== 'live') u.searchParams.set('modo', m === 'r22' ? '2022' : m === 'r26' ? '1t2026' : 'simulacao');
  history.replaceState(null, '', u);
  HX.forEach(h => { h.own = null; h.frac = 0; h.str = 0; });
  resetFX(); GH.chains = []; GH.fr = null; renderTerritory(true); camHome(); CAM.user = false; $('#chipBack').hidden = true;
  $('#feed').innerHTML = ''; $('#feed').dataset.sig = ''; $('#timeBox').dataset.built = ''; $('#timeBox').innerHTML = ''; $('#ufgrid').innerHTML = ''; $('#fronts').innerHTML = '';
  renderStatus(); renderBoard(); renderFeed(); renderSimBox();
  if (m === 'live' || m === 'sim') ghostEnsure();
  $('#note').innerHTML = m === 'live' ? 'Ao vivo: votos e percentuais oficiais do TSE a cada minuto. A neblina se dissipa seguindo o andamento de cada município informado pelo TSE.' : m === 'r22' ? 'Reprise do 2º turno de 2022 (Jair x Lula), montada com os boletins de urna do TSE na ordem em que chegaram naquela noite. Use a barra para avançar ou voltar no tempo.' : m === 'r26' ? 'Reprise do 1º turno de 2026. Os votos dos outros candidatos aparecem em roxo no cabo de guerra. Ordem de chegada aproximada pelo horário de totalização de cada zona.' : 'Simulação: ritmo real de 2022 com o mapa do 1º turno de 2026, até o placar escolhido. Clique em "Nova batalha" para outra versão da noite.';
  if (m === 'live') {
    S.E = await detectE();
    const hist = await loadHistory();
    if (tok !== S.tok) return;
    if (hist.length) { S.frames = hist; S.events = buildEvents(); setIdx(S.frames.length - 1, { silent: true, instant: true }); }
    await refreshLive(false);
  } else if (m === 'sim') {
    $('#pillTx').textContent = 'Preparando a simulação';
    await runSim();
  } else {
    $('#pillTx').textContent = 'Carregando reprise';
    const d = await loadEns(m === 'r22' ? '2t2022' : '1t2026');
    if (tok !== S.tok) return;
    S.frames = framesFromEns(d, m === 'r22' ? 'J' : 'F'); S.events = buildEvents();
    if (autoplay) { setIdx(0, { silent: true, instant: true, reset: true }); startPlay(); } else setIdx(S.frames.length - 1, { silent: true, instant: true });
    renderStatus();
  }
}

// ---------------------------------------------------------------------
// Som de batalha (sintetizado, sem arquivos)
// ---------------------------------------------------------------------
const SND = { ac: null, master: null, nextBoom: 0, nextMg: 0, rg: null };
const sndGen = () => !!SND.ac && (S.sound || REC.on);
function sndInit() {
  if (SND.ac) return true;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  const ac = SND.ac = new AC();
  const comp = SND.comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5;
  const spk = SND.spk = ac.createGain(); spk.gain.value = 0; comp.connect(spk); spk.connect(ac.destination);
  const master = SND.master = ac.createGain(); master.gain.value = 0.85; master.connect(comp);
  const len = ac.sampleRate * 2, wb = ac.createBuffer(1, len, ac.sampleRate), bb = ac.createBuffer(1, len, ac.sampleRate), w = wb.getChannelData(0), b = bb.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++) { const r = Math.random() * 2 - 1; w[i] = r; last = (last + 0.02 * r) / 1.02; b[i] = last * 3.5; }
  SND.white = wb; SND.brown = bb;
  const rum = ac.createBufferSource(); rum.buffer = bb; rum.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 120; const rg = SND.rg = ac.createGain(); rg.gain.value = 0.35; rum.connect(lp); lp.connect(rg); rg.connect(master); rum.start();
  const wind = ac.createBufferSource(); wind.buffer = wb; wind.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 430; bp.Q.value = 0.6; const wg = ac.createGain(); wg.gain.value = 0.03; const lfo = ac.createOscillator(); lfo.frequency.value = 0.07; const lg = ac.createGain(); lg.gain.value = 0.022; lfo.connect(lg); lg.connect(wg.gain); lfo.start(); wind.connect(bp); bp.connect(wg); wg.connect(master); wind.start();
  return true;
}
function outNode(pan) { const ac = SND.ac; if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(SND.master); return p; } return SND.master; }
function sndBoom(dist, pan, big) {
  if (!sndGen()) return; const ac = SND.ac, t = ac.currentTime + 0.01, dur = big ? 3.2 : 1.5 + dist;
  const src = ac.createBufferSource(); src.buffer = SND.white;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(big ? 1800 : 1000 * (1 - dist * 0.6) + 150, t); lp.frequency.exponentialRampToValueAtTime(55, t + dur * 0.7);
  const g = ac.createGain(), peak = (big ? 0.95 : 0.5) * (1 - 0.6 * dist);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(lp); lp.connect(g); g.connect(outNode(pan)); src.start(t, Math.random() * 1.2); src.stop(t + dur + 0.1);
  const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(big ? 72 : 58, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.55);
  og.gain.setValueAtTime(peak * 0.9, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.65); o.connect(og); og.connect(SND.master); o.start(t); o.stop(t + 0.7);
}
function sndMg(pan) {
  if (!sndGen()) return; const ac = SND.ac, n = 6 + Math.floor(Math.random() * 10), t0 = ac.currentTime + 0.02, gap = 0.058 + Math.random() * 0.03, out = outNode(pan), dist = 0.4 + Math.random() * 0.5;
  for (let i = 0; i < n; i++) { const t = t0 + i * gap, s = ac.createBufferSource(); s.buffer = SND.white; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 + Math.random() * 600; bp.Q.value = 1.1; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11 * (1 - dist * 0.6), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055); s.connect(bp); bp.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.07); }
}
function sndSiren() {
  if (!sndGen()) return; const ac = SND.ac, t = ac.currentTime + 0.02, g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.075, t + 0.4); g.gain.setValueAtTime(0.075, t + 6.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 7.4); lp.connect(g); g.connect(SND.master);
  [0, 4].forEach(det => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.detune.value = det; for (let c = 0; c < 2; c++) { const b = t + c * 3.6; o.frequency.setValueAtTime(330, b); o.frequency.linearRampToValueAtTime(820, b + 1.8); o.frequency.linearRampToValueAtTime(330, b + 3.6); } o.connect(lp); o.start(t); o.stop(t + 7.5); });
}
function sndTeletype(n) {
  if (!sndGen()) return; const ac = SND.ac; let t = ac.currentTime + 0.02;
  for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = 1150; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.022, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); o.connect(g); g.connect(SND.master); o.start(t); o.stop(t + 0.04); t += 0.05 + Math.random() * 0.05; }
}
function sndBugle() {
  if (!sndGen()) return; const ac = SND.ac; let t = ac.currentTime + 0.05;
  const notes = [[392, 0.2], [523.25, 0.2], [659.25, 0.2], [783.99, 0.5], [659.25, 0.2], [783.99, 0.9]];
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300; const g0 = ac.createGain(); g0.gain.value = 0.09; lp.connect(g0); g0.connect(SND.master);
  for (const [f, d] of notes) { const o = ac.createOscillator(), g = ac.createGain(), v = ac.createOscillator(), vg = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = f; v.frequency.value = 5.5; vg.gain.value = 3; v.connect(vg); vg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.04); g.gain.setValueAtTime(1, t + d * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(lp); o.start(t); v.start(t); o.stop(t + d + 0.05); v.stop(t + d + 0.05); t += d * 0.92; }
}
function sndTick(now) {
  if (!sndGen()) return;
  let I = 0; for (const f of FRONT) I += f.I * f.len; I = clamp(I / 160, 0, 1);
  if (SND.rg) SND.rg.gain.setTargetAtTime(0.18 + 0.5 * I, SND.ac.currentTime, 0.8);
  if (now > SND.nextBoom) { if (I > 0.03) sndBoom(0.45 + Math.random() * 0.5, Math.random() * 1.6 - 0.8, false); SND.nextBoom = now + (1800 + Math.random() * 4200) / (0.25 + 1.6 * I); }
  if (now > SND.nextMg) { if (I > 0.12) sndMg(Math.random() * 1.4 - 0.7); SND.nextMg = now + (3500 + Math.random() * 7000) / (0.3 + I); }
}
function sndToggle() {
  S.sound = !S.sound;
  if (S.sound) { if (!sndInit()) { S.sound = false; toast('Este navegador não suporta áudio'); return; } SND.ac.resume(); SND.spk.gain.setTargetAtTime(1, SND.ac.currentTime, 0.4); SND.nextBoom = 0; }
  else if (SND.ac) SND.spk.gain.setTargetAtTime(0, SND.ac.currentTime, 0.2);
  $('#btnSom').textContent = 'Som: ' + (S.sound ? 'on' : 'off'); $('#btnSom').classList.toggle('on', S.sound);
}

// ---------------------------------------------------------------------
// Interação: dica, zoom no estado
// ---------------------------------------------------------------------
function hexAt(x, y) { const r = y / 1.5, q = x / SQ3 - r / 2; let rx = Math.round(q), rz = Math.round(r), ry = Math.round(-q - r); const dx = Math.abs(rx - q), dz = Math.abs(rz - r), dy = Math.abs(ry + q + r); if (dx > dy && dx > dz) rx = -ry - rz; else if (dz > dy) rz = -rx - ry; return KEY.get(rx + ',' + rz) || null; }
function evXY(ev) { const r = cv.getBoundingClientRect(), p = ev.touches ? ev.touches[0] : ev.changedTouches ? ev.changedTouches[0] : ev; return [p.clientX - r.left, p.clientY - r.top, r]; }
function showTip(ev) {
  const [px, py, r] = evXY(ev), [wx, wy] = s2w(px, py), h = hexAt(wx, wy), tip = $('#tip');
  if (!h) { tip.hidden = true; return; }
  const fr = S.frames[S.idx], d = ufData(fr, h.uf), M = CMETA[S.mode];
  const vv = d ? d.F + d.L + (d.O || 0) : 0, a = vv ? 100 * d.F / vv : null, b = vv ? 100 * d.L / vv : null, o = vv ? 100 * (d.O || 0) / vv : 0, f = d && d.ts ? 100 * d.st / d.ts : 0;
  const ld = vv ? (d.F >= d.L ? 'azul (' + M.ashort + ')' : 'vermelho (' + M.bshort + ')') : null;
  tip.innerHTML = `<b>${esc(UFN[h.uf])}</b>${h.uf !== 'zz' ? `<span style="color:var(--mut)"> · capital ${esc((CAPOF[h.uf] || {}).n || '')}</span>` : ''}<br><span style="color:var(--mut)">${fmtP(f, 1)} apurado</span>${vv ? `<div class="bar"><div style="width:${a}%;background:var(--F)"></div><div style="width:${o}%;background:#8b7bd8"></div><div style="width:${b}%;background:var(--L)"></div></div>${esc(M.ashort)} <b style="color:var(--F2)">${fmtP(a, 1)}</b> · ${esc(M.bshort)} <b style="color:var(--L2)">${fmtP(b, 1)}</b><br>Capital sob controle ${ld}` : '<br>Coberto pela neblina de guerra.'}<br><span style="color:var(--mut)">Este setor: ${h.frac > 0.04 && h.own ? (h.own === 'F' ? 'azul' : 'vermelho') + (h.frac < 0.6 ? ', em disputa' : '') : 'neblina'}</span><br><span style="color:var(--mut);font-size:12px">${CAM.user ? 'Clique para voltar ao mapa' : 'Clique para aproximar'}</span>`;
  tip.hidden = false; const tw = tip.offsetWidth, th = tip.offsetHeight; let lx = px + 16, ly = py + 16; if (lx + tw > r.width) lx = px - tw - 16; if (ly + th > r.height) ly = py - th - 16; tip.style.left = Math.max(4, lx) + 'px'; tip.style.top = Math.max(4, ly) + 'px';
}
function zoomAt(ev) {
  const [px, py] = evXY(ev);
  if (CAM.user) { CAM.user = false; camHome(); $('#chipBack').hidden = true; return; }
  const [wx, wy] = s2w(px, py), h = hexAt(wx, wy); if (!h) return;
  const c = CAPOF[h.uf], big = BYUF[h.uf].length;
  CAM.user = true; CAM.tx = (wx + (c ? c.x : wx)) / 2; CAM.ty = (wy + (c ? c.y : wy)) / 2; CAM.tz = big > 150 ? 1.8 : big > 40 ? 2.4 : 3.0; clampCam(); CAM.until = 0;
  $('#chipBack').hidden = false;
}
cv.addEventListener('mousemove', showTip);
cv.addEventListener('mouseleave', () => { $('#tip').hidden = true; });
cv.addEventListener('click', ev => { zoomAt(ev); $('#tip').hidden = true; });
$('#chipBack').onclick = () => { CAM.user = false; camHome(); $('#chipBack').hidden = true; };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#mediaModal').hidden) $('#mediaModal').hidden = true; else if (!$('#regras').hidden) $('#regras').hidden = true; else if (TV.on) tvToggle(false); else if (CAM.user) { CAM.user = false; camHome(); $('#chipBack').hidden = true; } } });

// ---------------------------------------------------------------------
// Imagem para compartilhar
// ---------------------------------------------------------------------
function saveImage() {
  const W = 1200, H = 1380, c = mk(); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#0a0c09'; x.fillRect(0, 0, W, H);
  const fr = S.frames[S.idx], M = CMETA[S.mode], br = fr ? fr.br : null, vv = br ? br.F + br.L + (br.O || 0) : 0;
  x.textAlign = 'center'; x.fillStyle = '#e6e2cf'; x.font = `48px ${STENF}`; x.fillText('BATALHA DO VOTO', W / 2, 74);
  x.font = `600 24px ${CONDF}`; x.fillStyle = '#878a74'; x.fillText(spaced(((S.mode === 'live' ? '2º turno 2026' : S.mode === 'sim' ? 'Simulação do 2º turno 2026' : S.mode === 'r22' ? 'Reprise do 2º turno de 2022' : 'Reprise do 1º turno de 2026') + (fr ? ` · ${clk(fr.m)} · ${dec(100 * br.st / br.ts, 1)}% apurado` : '')).toUpperCase()), W / 2, 112);
  if (vv) {
    x.font = `64px ${STENF}`; x.textAlign = 'left'; x.fillStyle = '#9cc1ff'; x.fillText(dec(100 * br.F / vv, 2) + '%', 50, 196); x.textAlign = 'right'; x.fillStyle = '#ff9f90'; x.fillText(dec(100 * br.L / vv, 2) + '%', W - 50, 196);
    x.font = `800 28px ${CONDF}`; x.textAlign = 'left'; x.fillStyle = '#e6e2cf'; x.fillText(M.a.toUpperCase(), 52, 234); x.textAlign = 'right'; x.fillText(M.b.toUpperCase(), W - 52, 234);
    x.font = `600 22px ${CONDF}`; x.fillStyle = '#878a74'; x.textAlign = 'left'; x.fillText(`Território ${dec(territory('F'), 1)}% · ${statesLed(fr, 'F')} capitais`, 52, 264); x.textAlign = 'right'; x.fillText(`Território ${dec(territory('L'), 1)}% · ${statesLed(fr, 'L')} capitais`, W - 52, 264);
  }
  const mw = W - 60, mh = Math.min(H - 380, mw * cv.height / cv.width), my = 296;
  x.drawImage(cv, 30 + (mw - mh * cv.width / cv.height) / 2, my, mh * cv.width / cv.height, mh);
  x.strokeStyle = 'rgba(230,226,207,.25)'; x.strokeRect(30.5, my + 0.5, mw - 1, mh - 1);
  x.textAlign = 'center'; x.font = `600 22px ${CONDF}`; x.fillStyle = '#878a74'; x.fillText(spaced('VOTOCRUZADO.COM.BR/BATALHA · DADOS OFICIAIS DO TSE'), W / 2, H - 30);
  c.toBlob(b => offerFile(b, 'batalha-do-voto.png', 'image'), 'image/png');
}
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

// ---------------------------------------------------------------------
// Fantasma de 2022: onde estava a frente com o mesmo % apurado
// ---------------------------------------------------------------------
const GH = { on: true, frames: null, pst: null, chains: [], fr: null, loading: false };
const ghostActive = () => GH.on && (S.mode === 'live' || S.mode === 'sim') && !!GH.frames;
async function ghostEnsure() {
  if (GH.frames || GH.loading) return;
  GH.loading = true;
  try { const d = await loadEns('2t2022'); GH.frames = framesFromEns(d, 'J'); GH.pst = GH.frames.map(f => f.br.st / f.br.ts); } catch (e) {}
  GH.loading = false;
  if (S.frames.length && ghostActive()) { S.events = buildEvents(); S.shownEv = 0; $('#feed').dataset.sig = ''; setIdx(S.idx, { silent: true }); }
}
function ghostFrameAt(p) {
  const a = GH.pst; if (!a || !a.length) return null;
  let lo = 0, hi = a.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (a[mid] < p) lo = mid; else hi = mid; }
  return Math.abs(a[lo] - p) <= Math.abs(a[hi] - p) ? GH.frames[lo] : GH.frames[hi];
}
function updateGhost() {
  GH.chains = []; GH.fr = null;
  if (!ghostActive()) return;
  const fr = S.frames[S.idx]; if (!fr || !fr.br.ts || !fr.br.st) return;
  const g = ghostFrameAt(fr.br.st / fr.br.ts); if (!g) return;
  GH.fr = g;
  assignTerritory(g, 'o22', 's22', false, 'gfrac', 'gown', null);
  GH.chains = buildFrontFor('gown', 'gfrac');
}
function renderGhostUI(fr) {
  const gt = $('#tugGhost'), gl = $('#ghostLine'), can = (S.mode === 'live' || S.mode === 'sim') && fr;
  if (!can) { gt.hidden = true; gl.hidden = true; return; }
  if (!GH.on) { gt.hidden = true; gl.hidden = false; gl.innerHTML = '<button id="btnGhost">mostrar o fantasma de 2022</button>'; bindGhostBtn(); return; }
  if (!GH.fr) { gt.hidden = true; gl.hidden = true; return; }
  const g = GH.fr.br, gv = g.F + g.L, gp = 100 * g.F / gv, gpst = 100 * g.st / g.ts;
  gt.hidden = false; gt.style.left = gp + '%';
  gl.hidden = false; gl.innerHTML = `<i></i><span>Fantasma de 2022: com ${dec(gpst, 1)}% apurado, Jair tinha ${dec(gp, 2)}% x ${dec(100 - gp, 2)}% Lula.</span><button id="btnGhost">ocultar</button>`;
  bindGhostBtn();
}
function bindGhostBtn() { const b = $('#btnGhost'); if (b) b.onclick = () => { GH.on = !GH.on; if (GH.on) ghostEnsure(); S.events = buildEvents(); $('#feed').dataset.sig = ''; setIdx(S.idx, { silent: true }); }; }

// ---------------------------------------------------------------------
// Reforços a caminho: o que ainda falta apurar e como essas áreas votaram
// ---------------------------------------------------------------------
function renderReinf(fr) {
  const el = $('#reinf'); if (!el) return;
  if (!fr) { el.innerHTML = '<div class="rf-empty">Quando a apuração começar, este painel mostra quantos eleitores ainda faltam, onde estão e como essas áreas votaram no 1º turno.</div>'; return; }
  const r22 = S.mode === 'r22', r26 = S.mode === 'r26', hind = r22 || r26, lk = r22 ? 'l22' : 'lean', kk = r26 ? KUF.k26 : KUF.k22, sk = r22 ? KUF.s22 : KUF.s26, M = CMETA[S.mode];
  const per = {}; let TOT = 0, F = 0, L = 0;
  for (const u of UFS) {
    const d = ufData(fr, u); if (!d) continue;
    const rem = Math.max(0, (d.te || 0) - (d.est || 0)); if (rem < 1) continue;
    let w = 0, a = 0; for (const h of BYUF[u]) { const ww = h.e * (1 - h.frac); if (ww > 0) { w += ww; a += ww * h[lk]; } }
    const lean = w > 0 ? a / w : sk[u], two = rem * kk[u], f = two * lean, g = REG[u];
    per[g] = per[g] || { rem: 0, F: 0, L: 0 }; per[g].rem += rem; per[g].F += f; per[g].L += two - f;
    TOT += rem; F += f; L += two - f;
  }
  if (TOT < 1) { el.innerHTML = '<div class="rf-empty">Todas as tropas já chegaram: território 100% apurado.</div>'; return; }
  const te = fr.br.te || TOT, pf = 100 * F / (F + L), saldo = F - L, lead = fr.br.F - fr.br.L;
  const nmS = v => v >= 0 ? M.ashort : M.bshort, sg = v => '+' + fmtMi(Math.abs(v));
  const rows = [...REGS, 'EX'].filter(g => per[g] && per[g].rem >= 1).sort((a, b) => per[b].rem - per[a].rem).map(g => {
    const p = per[g], sp = 100 * p.F / (p.F + p.L);
    return `<div class="rf-row"><span class="rf-n">${g === 'EX' ? 'Exterior' : REGN[g]}</span><div class="rf-b"><i style="width:${sp.toFixed(1)}%;background:var(--F)"></i><i style="width:${(100 - sp).toFixed(1)}%;background:var(--L)"></i></div><span class="rf-v">${fmtMi(p.rem)} eleitores · ${sp >= 50 ? M.ashort + ' ' + dec(sp, 0) : M.bshort + ' ' + dec(100 - sp, 0)}%</span></div>`;
  }).join('');
  el.innerHTML = `<div class="rf-top"><div><b>${fmtMi(TOT)}</b><span>eleitores ainda por apurar (${dec(100 * TOT / te, 1)}% do total)</span></div><div><b class="${saldo >= 0 ? 'cF' : 'cL'}">${sg(saldo)}</b><span>saldo dessas áreas ${hind ? 'no resultado daquela noite' : 'no 1º turno'}, para ${nmS(saldo)}</span></div><div><b class="${lead >= 0 ? 'cF' : 'cL'}">${sg(lead)}</b><span>vantagem atual de ${nmS(lead)}</span></div></div>`
    + `<div class="rf-sub">${hind ? 'Como essas áreas terminaram' : 'Como essas áreas votaram no 1º turno'}: <b style="color:var(--F2)">${esc(M.ashort)} ${dec(pf, 1)}%</b> x <b style="color:var(--L2)">${dec(100 - pf, 1)}% ${esc(M.bshort)}</b></div>${rows}`
    + `<div class="rf-note">${hind ? 'Reprise: mostra como terminaram, naquela noite, as áreas que ainda faltavam.' : 'Não é previsão: mostra quantos eleitores faltam e como essas mesmas áreas votaram no 1º turno de 2026 (com o comparecimento de 2022).'}</div>`;
}

// ---------------------------------------------------------------------
// Imagem para Stories e vídeo vertical (Reels, Stories, WhatsApp)
// ---------------------------------------------------------------------
let BANNER_NOW = null, MEDIA_URL = null;
function wrapLines(x, text, maxW) { const words = String(text).split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
function storySubtitle() { const M = CMETA[S.mode]; return S.mode === 'live' ? '2º turno 2026 · apuração ao vivo' : S.mode === 'sim' ? `Simulação · ${M.ashort} ${dec(S.simT, 1)}% x ${dec(100 - S.simT, 1)}% ${M.bshort}` : S.mode === 'r22' ? 'Reprise do 2º turno de 2022' : 'Reprise do 1º turno de 2026'; }
function composeStory(x, now) {
  const W = 1080, H = 1920, fr = S.frames[S.idx], M = CMETA[S.mode], br = fr ? fr.br : null, vv = br ? br.F + br.L + (br.O || 0) : 0;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.textBaseline = 'alphabetic';
  x.fillStyle = '#0a0c09'; x.fillRect(0, 0, W, H);
  for (const [cx, col] of [[150, '60,123,226'], [930, '211,58,46']]) { const g = x.createRadialGradient(cx, 0, 10, cx, 0, 820); g.addColorStop(0, `rgba(${col},.30)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  x.textAlign = 'center'; x.fillStyle = '#e6e2cf'; x.font = `78px ${STENF}`; x.fillText('BATALHA DO VOTO', W / 2, 112);
  x.font = `700 30px ${CONDF}`; x.fillStyle = '#e3a72f'; x.fillText(spaced(storySubtitle().toUpperCase()), W / 2, 162, W - 60);
  const pa = vv ? 100 * br.F / vv : null, pb = vv ? 100 * br.L / vv : null, po = vv ? 100 * (br.O || 0) / vv : 0;
  x.font = `112px ${STENF}`; x.textAlign = 'left'; x.fillStyle = '#9cc1ff'; x.fillText(pa == null ? '00,00%' : dec(pa, 2) + '%', 48, 312);
  x.textAlign = 'right'; x.fillStyle = '#ff9f90'; x.fillText(pb == null ? '00,00%' : dec(pb, 2) + '%', W - 48, 312);
  x.font = `800 40px ${CONDF}`; x.fillStyle = '#e6e2cf'; x.textAlign = 'left'; x.fillText(M.a.toUpperCase(), 52, 366); x.textAlign = 'right'; x.fillText(M.b.toUpperCase(), W - 52, 366);
  if (br) { x.font = `600 30px ${CONDF}`; x.fillStyle = '#9a9c86'; x.textAlign = 'left'; x.fillText(fmtN(br.F) + ' votos', 52, 406); x.textAlign = 'right'; x.fillText(fmtN(br.L) + ' votos', W - 52, 406); }
  const tx = 48, tw = W - 96, ty = 440, th = 26;
  x.fillStyle = '#1d2118'; x.fillRect(tx, ty, tw, th);
  if (vv) { x.fillStyle = '#3c7be2'; x.fillRect(tx, ty, tw * pa / 100, th); x.fillStyle = '#8b7bd8'; x.fillRect(tx + tw * pa / 100, ty, tw * po / 100, th); x.fillStyle = '#d33a2e'; x.fillRect(tx + tw * (pa + po) / 100, ty, tw * pb / 100, th); }
  x.fillStyle = '#e6e2cf'; x.fillRect(W / 2 - 1.5, ty - 6, 3, th + 12);
  if (vv) { const kx = tx + tw * (pa + po / 2) / 100; x.save(); x.translate(kx, ty + th / 2); x.rotate(Math.PI / 4); x.fillStyle = '#e3a72f'; x.fillRect(-11, -11, 22, 22); x.restore(); }
  const pst = br && br.ts ? 100 * br.st / br.ts : 0;
  x.textAlign = 'center'; x.font = `46px ${STENF}`; x.fillStyle = '#e6e2cf'; x.fillText(fr ? `${clk(fr.m)}  ·  ${dec(pst, pst >= 99.995 ? 0 : 1)}% APURADO` : 'TROPAS EM POSIÇÃO', W / 2, 540);
  const crop = 0.07, sx = cv.width * crop, sw = cv.width * (1 - 2 * crop), sh = cv.height, sc = Math.min((W - 40) / sw, 985 / sh), dw = sw * sc, dh = sh * sc, dx = (W - dw) / 2, dy = 576;
  x.drawImage(cv, sx, 0, sw, sh, dx, dy, dw, dh);
  x.strokeStyle = 'rgba(230,226,207,.35)'; x.lineWidth = 2; x.strokeRect(dx + 1, dy + 1, dw - 2, dh - 2);
  x.save(); x.translate(dx + dw - 160, dy + dh - 64); x.rotate(-0.12); x.font = `38px ${STENF}`;
  const stx = S.mode === 'sim' ? 'SIMULAÇÃO' : S.mode === 'live' ? (S.status === 'final' ? 'CONCLUÍDA' : 'AO VIVO') : 'REPRISE', stc = S.mode === 'sim' ? 'rgba(227,167,47,.92)' : 'rgba(228,72,60,.92)', stw = x.measureText(stx).width;
  x.strokeStyle = stc; x.lineWidth = 4; x.strokeRect(-stw / 2 - 16, -38, stw + 32, 52); x.fillStyle = stc; x.textAlign = 'center'; x.fillText(stx, 0, 0); x.restore();
  const y = dy + dh + 30, bh = Math.max(140, H - 118 - y);
  const bn = BANNER_NOW && now - BANNER_NOW.t0 < 3400 ? BANNER_NOW : null, ev = S.events.filter(e => e.k <= S.idx).pop(), side = bn ? bn.side : ev ? ev.side : null;
  x.fillStyle = 'rgba(18,21,15,.96)'; x.fillRect(40, y, W - 80, bh);
  x.fillStyle = side === 'F' ? '#3c7be2' : side === 'L' ? '#d33a2e' : '#e3a72f'; x.fillRect(40, y, W - 80, 6);
  x.textAlign = 'left'; x.font = `800 26px ${CONDF}`; x.fillStyle = '#f5c96a';
  x.fillText(spaced((bn ? `Despacho urgente · ${clk(bn.m)}` : ev ? `Comunicado nº ${String(ev.n).padStart(3, '0')} · ${clk(ev.m)}` : 'Comunicado').toUpperCase()), 70, y + 50);
  const maxL = Math.max(1, Math.floor((bh - 74) / 40));
  if (bn) { x.font = `60px ${STENF}`; x.fillStyle = side === 'F' ? '#ffd089' : side === 'L' ? '#9fe3f2' : '#ffffff'; x.fillText(bn.b[0], 70, y + 122, W - 140); x.font = `32px ${TYPEF}`; x.fillStyle = '#d6d2bf'; wrapLines(x, bn.b[1] || '', W - 140).slice(0, Math.max(1, maxL - 1)).forEach((l, i) => x.fillText(l, 70, y + 170 + i * 40)); }
  else { x.font = `30px ${TYPEF}`; x.fillStyle = '#d6d2bf'; wrapLines(x, ev ? ev.t : 'Nenhum combate ainda. A batalha começa às 17h de 25 de outubro.', W - 140).slice(0, maxL).forEach((l, i) => x.fillText(l, 70, y + 94 + i * 40)); }
  x.textAlign = 'center'; x.font = `700 32px ${CONDF}`; x.fillStyle = '#e3a72f'; x.fillText(spaced('VOTOCRUZADO.COM.BR/BATALHA'), W / 2, H - 56);
  x.font = `600 22px ${CONDF}`; x.fillStyle = '#7a7d68'; x.fillText(S.mode === 'sim' ? 'Simulação de cenário, não é previsão' : 'Dados oficiais do TSE', W / 2, H - 22);
}
function offerFile(blob, name, kind) {
  if (MEDIA_URL) URL.revokeObjectURL(MEDIA_URL);
  MEDIA_URL = URL.createObjectURL(blob);
  const file = new File([blob], name, { type: blob.type });
  $('#mmTitle').textContent = kind === 'video' ? 'Vídeo da batalha pronto' : 'Imagem pronta';
  $('#mmPrev').innerHTML = kind === 'video' ? `<video src="${MEDIA_URL}" controls playsinline autoplay muted loop></video>` : `<img src="${MEDIA_URL}" alt="Batalha do voto">`;
  let canShare = false; try { canShare = !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) {}
  $('#mmShare').hidden = !canShare;
  $('#mmShare').onclick = async () => { try { await navigator.share({ files: [file], title: 'Batalha do voto', text: 'votocruzado.com.br/batalha' }); } catch (e) {} };
  $('#mmDown').onclick = () => { const a = document.createElement('a'); a.href = MEDIA_URL; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 600); };
  $('#mediaModal').hidden = false;
}
function storyImage() {
  const sv = { x: CAM.x, y: CAM.y, z: CAM.z, tx: CAM.tx, ty: CAM.ty, tz: CAM.tz };
  CAM.x = CAM.tx = G.hx; CAM.y = CAM.ty = G.hy; CAM.z = CAM.tz = 1; BASE_DIRTY = true; drawFrame(performance.now(), 0.001);
  const c = mk(); c.width = 1080; c.height = 1920; composeStory(c.getContext('2d'), performance.now());
  Object.assign(CAM, sv); BASE_DIRTY = true;
  c.toBlob(b => offerFile(b, 'batalha-do-voto-stories.png', 'image'), 'image/png');
}
const REC = { on: false, mr: null, chunks: [], c: null, x: null, raf: 0, t0: 0, saved: null, dest: null, mime: '', stopT: 0, cancel: false };
function recMime() { const ts = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']; return window.MediaRecorder ? ts.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || '' : ''; }
function recStart() {
  if (REC.on) { recStop(true); toast('Gravação cancelada'); return; }
  if (!S.frames.length) { toast('Nada para gravar ainda. Use a Simulação ou uma Reprise.'); return; }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream || !(REC.mime = recMime())) { toast('Este navegador não grava vídeo. Use a imagem para Stories.'); return; }
  REC.c = REC.c || mk(); REC.c.width = 1080; REC.c.height = 1920; REC.x = REC.c.getContext('2d');
  composeStory(REC.x, performance.now());
  const stream = REC.c.captureStream(30);
  if (sndInit()) { SND.ac.resume(); REC.dest = SND.ac.createMediaStreamDestination(); SND.comp.connect(REC.dest); REC.dest.stream.getAudioTracks().forEach(t => stream.addTrack(t)); }
  REC.chunks = [];
  try { REC.mr = new MediaRecorder(stream, { mimeType: REC.mime, videoBitsPerSecond: 5000000, audioBitsPerSecond: 128000 }); }
  catch (e) { try { REC.mr = new MediaRecorder(stream); REC.mime = REC.mr.mimeType || 'video/webm'; } catch (e2) { toast('Não foi possível iniciar a gravação'); recFinish(); return; } }
  REC.mr.ondataavailable = e => { if (e.data && e.data.size) REC.chunks.push(e.data); };
  REC.mr.onstop = recFinish;
  REC.saved = { speed: S.speed, cam: CAM.user };
  REC.on = true; REC.cancel = false; REC.stopT = 0;
  stopPlay(); CAM.user = false; camHome(); $('#chipBack').hidden = true;
  S.speed = clamp(760 * S.frames.length / 21000, 1, 40);
  setIdx(0, { silent: true, instant: true, reset: true });
  REC.mr.start(250); REC.t0 = performance.now();
  startPlay(true);
  $('#recB').hidden = false; $('#btnVideo').textContent = 'Cancelar gravação'; $('#btnVideo').classList.add('on');
  $('#mapbox').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  const tick = () => {
    if (!REC.on) return;
    const now = performance.now(); composeStory(REC.x, now); $('#recT').textContent = Math.floor((now - REC.t0) / 1000) + 's';
    if (!S.playing && !REC.stopT) REC.stopT = now + 3600;
    if (REC.stopT && now >= REC.stopT) { recStop(false); return; }
    REC.raf = requestAnimationFrame(tick);
  };
  REC.raf = requestAnimationFrame(tick);
}
function recStop(cancel) {
  if (!REC.on) return;
  REC.on = false; REC.cancel = !!cancel; cancelAnimationFrame(REC.raf);
  try { if (REC.mr && REC.mr.state !== 'inactive') REC.mr.stop(); else recFinish(); } catch (e) { recFinish(); }
  stopPlay(); if (REC.saved) S.speed = REC.saved.speed;
  $('#recB').hidden = true; $('#btnVideo').textContent = 'Gravar vídeo (20 s)'; $('#btnVideo').classList.remove('on');
  renderTime();
  if (S.mode === 'live') { S.follow = true; setIdx(S.frames.length - 1, { silent: true, instant: true }); }
}
function recFinish() {
  if (REC.dest && SND.comp) { try { SND.comp.disconnect(REC.dest); } catch (e) {} }
  REC.dest = null;
  if (REC.cancel || !REC.chunks.length) { REC.chunks = []; return; }
  const type = (REC.mime || 'video/webm').split(';')[0], blob = new Blob(REC.chunks, { type }); REC.chunks = [];
  offerFile(blob, 'batalha-do-voto.' + (type.indexOf('mp4') >= 0 ? 'mp4' : 'webm'), 'video');
}

// ---------------------------------------------------------------------
// Narrador de guerra (voz do próprio aparelho)
// ---------------------------------------------------------------------
const NAR = { on: false, voice: null, prio: 0, busyUntil: 0 };
function narPickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices().filter(v => /^pt[-_]?BR/i.test(v.lang) || /brasil/i.test(v.name));
  for (const re of [/antonio/i, /google/i, /daniel/i, /felipe/i, /luciana/i, /francisca/i, /thalita/i, /reed/i]) { const v = vs.find(x => re.test(x.name)); if (v) return v; }
  return vs[0] || null;
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { if (NAR.on && !NAR.voice) NAR.voice = narPickVoice(); };
function horaFalada(m) { const t = Math.round(17 * 60 + m), h = Math.floor(t / 60) % 24, mi = t % 60; return `${h === 0 ? 'meia-noite' : h === 1 ? 'uma hora' : h + ' horas'}${mi ? ' e ' + mi : ''}`; }
function toSpeech(t) { return String(t).replace(/\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3,})\b/g, w => w.charAt(0) + w.slice(1).toLowerCase()).replace(/\(([^)]*)\)/g, ', $1,').replace(/(\d),(\d)/g, '$1 vírgula $2').replace(/%/g, ' por cento').replace(/p\.p\./g, 'pontos').replace(/ x /g, ' a ').replace(/nº/g, 'número').replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim(); }
function sndRadio() {
  if (!sndInit()) return;
  const ac = SND.ac; ac.resume(); const t = ac.currentTime + 0.01, out = ac.createGain(); out.gain.value = 0.55; out.connect(ac.destination); if (REC.dest) out.connect(REC.dest);
  const s = ac.createBufferSource(); s.buffer = SND.white; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2300; bp.Q.value = 0.8; const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36); s.connect(bp); bp.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.4);
  [0.06, 0.2].forEach(d => { const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.value = 1320; og.gain.setValueAtTime(0.0001, t + d); og.gain.exponentialRampToValueAtTime(0.09, t + d + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.09); o.connect(og); og.connect(out); o.start(t + d); o.stop(t + d + 0.1); });
}
function narSpeak(text, prio) {
  if (!NAR.on || !('speechSynthesis' in window)) return;
  const now = performance.now();
  if (speechSynthesis.speaking && prio <= NAR.prio && now < NAR.busyUntil) return;
  speechSynthesis.cancel();
  NAR.prio = prio; NAR.busyUntil = now + 1500 + text.length * 65;
  sndRadio();
  const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-BR'; if (NAR.voice) u.voice = NAR.voice; u.rate = 1.05; u.pitch = 0.92; u.volume = 1;
  u.onend = () => { NAR.prio = 0; };
  setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 400);
}
const NAR_IMP = { start: 2, flip: 3, nat: 5, sweep: 2, mile: 1, decid: 4, end: 5, eleito: 6 };
function narEvents(fresh) {
  if (!NAR.on || !fresh.length) return;
  const fast = S.playing && S.speed > 3; let best = null;
  for (const e of fresh) {
    const p = NAR_IMP[e.kind] || 0;
    if (!p || (fast && p < 3) || (e.kind === 'mile' && !/ (25|50|75|90)% do território/.test(e.t))) continue;
    if (!best || p >= NAR_IMP[best.kind]) best = e;
  }
  if (best) narSpeak(`Despacho do front, ${horaFalada(best.m)}. ${toSpeech(best.t)}`, NAR_IMP[best.kind]);
}
function narToggle() {
  if (!('speechSynthesis' in window)) { toast('Este navegador não tem narração por voz'); return; }
  NAR.on = !NAR.on;
  const b = $('#btnNar'); b.textContent = 'Narrador: ' + (NAR.on ? 'on' : 'off'); b.classList.toggle('on', NAR.on);
  if (NAR.on) { NAR.voice = narPickVoice(); NAR.prio = 0; narSpeak('Aqui fala o correspondente de guerra. Narrador em posição, aguardando os despachos do front.', 9); }
  else speechSynthesis.cancel();
}

// ---------------------------------------------------------------------
// Telão: tela cheia para TV, letreiro de plantão e câmera passeando
// ---------------------------------------------------------------------
const TV = { on: false, last: 0 };
let TVIDLE = 0, TICK_SIG = '';
function tvToggle(force) {
  const on = force != null ? !!force : !TV.on; if (on === TV.on) return;
  TV.on = on; document.body.classList.toggle('tv', on); document.body.classList.remove('idle');
  if (on) { try { const r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (r && r.catch) r.catch(() => {}); } catch (e) {} TV.last = performance.now(); updTicker(); tvIdle(); }
  else { try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} CAM.user = false; camHome(); }
  setTimeout(layout, 80); setTimeout(layout, 700);
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && TV.on) tvToggle(false); else setTimeout(layout, 60); });
function tvIdle() { if (!TV.on) return; document.body.classList.remove('idle'); clearTimeout(TVIDLE); TVIDLE = setTimeout(() => { if (TV.on) document.body.classList.add('idle'); }, 2500); }
document.addEventListener('mousemove', tvIdle);
function tvTour(now) {
  if (!TV.on || CAM.user || REDUCED) return;
  if (CAM.until && now < CAM.until) return;
  if (now - TV.last < 15000) return;
  TV.last = now;
  const cands = UFS.filter(u => u !== 'zz' && CAPOF[u]).map(u => ({ u, s: (S.int[u] || 0.05) * Math.sqrt(BYUF[u].length) + Math.random() * 0.6 })).sort((a, b) => b.s - a.s);
  const pick = cands[Math.floor(Math.random() * Math.min(5, cands.length))]; if (!pick) return;
  const c = CAPOF[pick.u]; CAM.tx = c.x; CAM.ty = c.y; CAM.tz = BYUF[pick.u].length > 150 ? 1.6 : BYUF[pick.u].length > 40 ? 2.0 : 2.6; clampCam(); CAM.until = now + 6500; CAM.last = now;
}
function updTicker() {
  const list = S.events.filter(e => e.k <= S.idx).slice(-7).reverse();
  const txt = list.length ? list.map(e => `${clk(e.m)} · ${e.t}`).join('     ★     ') : (S.mode === 'live' ? 'A batalha começa às 17h de 25 de outubro. Tropas em posição, aguardando os primeiros números do TSE.' : 'Aguardando os primeiros despachos do front.');
  if (txt === TICK_SIG) return; TICK_SIG = txt;
  const el = $('#tickTx'); if (!el) return; el.textContent = txt; el.style.animationDuration = Math.max(28, Math.round(txt.length * 0.17)) + 's';
}

// ---------------------------------------------------------------------
// Alertas do front (notificações do navegador, inclusive com a aba em segundo plano)
// ---------------------------------------------------------------------
const ALR = { on: false, reg: null, last: 0, base: './' };
const ALR_KINDS = { nat: 1, decid: 1, end: 1, eleito: 1, flip: 1 };
const ALR_BIG = new Set(['sp', 'mg', 'rj', 'ba', 'rs', 'pr', 'pe', 'ce', 'pa', 'sc', 'go', 'am']);
function alrInit() {
  ALR.base = location.pathname.indexOf('/governador') >= 0 ? '../' : './';
  if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register(ALR.base + 'sw.js', { scope: ALR.base }).then(r => { ALR.reg = r; }).catch(() => {}); } catch (e) {} }
  try { ALR.on = localStorage.getItem('batalha:alertas') === '1' && 'Notification' in window && Notification.permission === 'granted'; } catch (e) {}
  alrBtn();
}
function alrBtn() { const b = $('#btnAlr'); if (!b) return; b.textContent = 'Alertas: ' + (ALR.on ? 'on' : 'off'); b.classList.toggle('on', ALR.on); }
async function alrToggle() {
  if (!('Notification' in window)) { toast(/iPhone|iPad/.test(navigator.userAgent) ? 'No iPhone, adicione a página à Tela de Início para receber alertas' : 'Este navegador não mostra alertas'); return; }
  if (ALR.on) { ALR.on = false; try { localStorage.setItem('batalha:alertas', '0'); } catch (e) {} alrBtn(); toast('Alertas desligados'); return; }
  let p = Notification.permission;
  if (p !== 'granted') { try { p = await Notification.requestPermission(); } catch (e) { p = 'denied'; } }
  if (p !== 'granted') { toast('Os alertas foram bloqueados nas permissões do navegador'); return; }
  ALR.on = true; try { localStorage.setItem('batalha:alertas', '1'); } catch (e) {} alrBtn();
  alrShow('Alertas do front ativados', 'Você vai ser avisado das viradas, da vitória matemática e do resultado final, mesmo com esta aba em segundo plano.', 'teste');
}
function alrShow(title, body, tag) {
  const opts = { body, tag: 'batalha-' + tag, icon: ALR.base + 'icone-192.png', badge: ALR.base + 'icone-192.png', renotify: true, data: { url: location.href } };
  const fallback = () => { try { const n = new Notification(title, opts); n.onclick = () => { window.focus(); n.close(); }; } catch (e) {} };
  try { if (ALR.reg && ALR.reg.showNotification) { ALR.reg.showNotification(title, opts).catch(fallback); return; } } catch (e) {}
  fallback();
}
function alrEvents(fresh) {
  if (!ALR.on || S.mode !== 'live' || !fresh.length) return;
  if (!document.hidden && document.hasFocus && document.hasFocus()) return;
  const now = Date.now();
  for (const e of fresh) {
    if (!ALR_KINDS[e.kind]) continue;
    if (e.kind === 'flip' && !(ALR_BIG.has(e.uf) || (CAPOF[e.uf] && CAPOF[e.uf].nat))) continue;
    if (e.kind === 'flip' && now - ALR.last < 20000) continue;
    ALR.last = now;
    alrShow(`${e.banner ? e.banner[0] : 'Despacho do front'} · ${clk(e.m)}`, e.t, e.kind + '-' + (e.uf || '') + '-' + e.k);
  }
}

// ---------------------------------------------------------------------
// Bolão da batalha: palpites salvos no aparelho e trocados por link
// ---------------------------------------------------------------------
const BOL = { me: null, turma: [] };
function bolLoad() { try { const o = JSON.parse(localStorage.getItem('batalha:bolao') || '{}'); BOL.me = o.me || null; BOL.turma = Array.isArray(o.turma) ? o.turma : []; } catch (e) {} }
function bolSave() { try { localStorage.setItem('batalha:bolao', JSON.stringify({ me: BOL.me, turma: BOL.turma })); } catch (e) {} }
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
function bolLink(p) { const u = new URL(location.origin + location.pathname); u.searchParams.set('palpite', b64e(JSON.stringify({ n: p.nome, p: p.pct, h: p.hora, u: p.uf }))); return u.toString(); }
function bolFromURL() {
  const s = params.get('palpite'); if (!s) return;
  try {
    const o = JSON.parse(b64d(s)), p = { nome: String(o.n || 'Anônimo').slice(0, 20), pct: +o.p, hora: String(o.h || '').slice(0, 5), uf: String(o.u || '').slice(0, 2) };
    if (isFinite(p.pct) && p.pct >= 30 && p.pct <= 70 && !(BOL.me && BOL.me.nome === p.nome && BOL.me.pct === p.pct)) {
      BOL.turma = BOL.turma.filter(x => x.nome !== p.nome); BOL.turma.push(p); bolSave();
      setTimeout(() => toast(`Palpite de ${p.nome} entrou no seu bolão`), 1500);
    }
  } catch (e) {}
  const u = new URL(location.href); u.searchParams.delete('palpite'); history.replaceState(null, '', u);
}
const UFSORT = () => UFS.filter(u => u !== 'zz').sort((a, b) => UFN[a].localeCompare(UFN[b], 'pt-BR'));
function bolOpen() {
  const me = BOL.me || { nome: '', pct: 50, hora: '19:45', uf: 'mg' };
  $('#bNome').value = me.nome || ''; $('#bPct').value = me.pct;
  if (!$('#bHora').options.length) { const hs = []; for (let t = 18 * 60; t <= 23 * 60; t += 5) hs.push(String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0')); $('#bHora').innerHTML = hs.map(h => `<option>${h}</option>`).join(''); $('#bUf').innerHTML = UFSORT().map(u => `<option value="${u}">${esc(UFN[u])}</option>`).join(''); }
  $('#bHora').value = me.hora; $('#bUf').value = me.uf; bolPctLabel();
  bolTurmaModal(); $('#bolaoModal').hidden = false;
}
function bolPctLabel() { const v = +$('#bPct').value; $('#bPctL').innerHTML = `<span style="color:var(--F2)">Flávio ${dec(v, 1)}%</span> x <span style="color:var(--L2)">${dec(100 - v, 1)}% Lula</span>`; }
function bolCollect() { return { nome: ($('#bNome').value || 'Eu').trim().slice(0, 20) || 'Eu', pct: +(+$('#bPct').value).toFixed(1), hora: $('#bHora').value, uf: $('#bUf').value }; }
function bolTurmaModal() { const el = $('#bTurma'); el.innerHTML = BOL.turma.length ? BOL.turma.map((p, i) => `<div class="bt-row"><span>${esc(p.nome)}: Flávio ${dec(p.pct, 1)}% · eleito às ${esc(p.hora || '?')} · ${esc((p.uf || '').toUpperCase())}</span><button data-i="${i}">remover</button></div>`).join('') : '<div class="rf-empty">Ninguém ainda. Quando alguém te mandar o link do palpite, ele aparece aqui.</div>'; el.querySelectorAll('button').forEach(b => b.onclick = () => { BOL.turma.splice(+b.dataset.i, 1); bolSave(); bolTurmaModal(); bolRender(); }); }
function bolActual() {
  if (S.mode !== 'live' && S.mode !== 'sim') return null;
  const fr = S.frames[S.idx]; if (!fr) return null;
  const br = fr.br, two = br.F + br.L; if (!two) return null;
  const ev = S.events.filter(e => e.k <= S.idx), el = ev.find(e => e.kind === 'eleito') || ev.find(e => e.kind === 'decid');
  let best = null;
  for (const u of UFS) { if (u === 'zz') continue; const d = fr.uf && fr.uf[u]; if (!d || !d.ts || d.st / d.ts < 0.9 || !(d.F + d.L)) continue; const mg = Math.abs(d.F - d.L) / (d.F + d.L); if (!best || mg < best.mg) best = { u, mg }; }
  return { pct: 100 * br.F / two, hora: el ? clk(el.m) : null, uf: best ? best.u : null, final: br.st >= br.ts, mode: S.mode };
}
function hm2min(h) { if (!h) return null; const [a, b] = h.split(':').map(Number); return (a < 12 ? a + 24 : a) * 60 + b; }
function bolRender() {
  const el = $('#bolaoP'); if (!el) return;
  const act = bolActual(), all = [...(BOL.me ? [Object.assign({ eu: 1 }, BOL.me)] : []), ...BOL.turma];
  if (!all.length) { el.innerHTML = '<div class="rf-empty">Faça seu palpite e mande o link para a turma. Na noite de 25/10, aqui aparece quem está chegando mais perto.</div><button class="btn pri" id="bolGo">Fazer meu palpite</button>'; $('#bolGo').onclick = bolOpen; return; }
  const rows = all.map(p => Object.assign({}, p, { ep: act ? Math.abs(p.pct - act.pct) : null, eh: act && act.hora && p.hora ? Math.abs(hm2min(p.hora) - hm2min(act.hora)) : null }));
  if (act) rows.sort((a, b) => a.ep - b.ep || (a.eh == null ? 9999 : a.eh) - (b.eh == null ? 9999 : b.eh));
  el.innerHTML = `<table class="btab"><tr><th>#</th><th>Nome</th><th>Flávio</th><th>Eleito às</th><th>Mais apertado</th>${act ? '<th>Erro</th>' : ''}</tr>${rows.map((r, i) => `<tr class="${r.eu ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.nome)}${r.eu ? ' (você)' : ''}</td><td>${dec(r.pct, 1)}%</td><td>${esc(r.hora || '·')}</td><td>${esc((r.uf || '').toUpperCase())}${act && act.uf && r.uf === act.uf ? ' ✓' : ''}</td>${act ? `<td>${dec(r.ep, 2)} p.p.${r.eh != null ? ' · ' + r.eh + ' min' : ''}</td>` : ''}</tr>`).join('')}</table>`
    + `<div class="rf-note">${act ? (act.mode === 'sim' ? 'Comparando com esta simulação, só por diversão.' : act.final ? 'Comparado com o resultado final do TSE.' : 'Parcial: muda a cada atualização do TSE.') + (act.hora ? ` Hora de referência: ${act.hora}.` : '') : 'O ranking aparece quando a apuração começar.'}</div><button class="btn" id="bolGo">Meu palpite</button>`;
  $('#bolGo').onclick = bolOpen;
}
function bolCard(p) {
  const W = 1080, H = 1920, c = mk(); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#0a0c09'; x.fillRect(0, 0, W, H);
  try { x.globalAlpha = 0.2; const sw = cv.width * 0.86, sh = cv.height, sc = Math.min(W / sw, 1100 / sh); x.drawImage(cv, cv.width * 0.07, 0, sw, sh, (W - sw * sc) / 2, 520, sw * sc, sh * sc); x.globalAlpha = 1; } catch (e) { x.globalAlpha = 1; }
  { const g = x.createLinearGradient(0, 380, 0, 1000); g.addColorStop(0, 'rgba(10,12,9,0)'); g.addColorStop(0.18, 'rgba(10,12,9,.72)'); g.addColorStop(0.82, 'rgba(10,12,9,.72)'); g.addColorStop(1, 'rgba(10,12,9,0)'); x.fillStyle = g; x.fillRect(0, 380, W, 620); }
  for (const [cx, col] of [[150, '60,123,226'], [930, '211,58,46']]) { const g = x.createRadialGradient(cx, 0, 10, cx, 0, 820); g.addColorStop(0, `rgba(${col},.32)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  x.textAlign = 'center'; x.fillStyle = '#e3a72f'; x.font = `700 34px ${CONDF}`; x.fillText(spaced('BATALHA DO VOTO · 2º TURNO 2026'), W / 2, 130);
  x.fillStyle = '#e6e2cf'; x.font = `110px ${STENF}`; x.fillText('MEU PALPITE', W / 2, 270);
  x.font = `800 44px ${CONDF}`; x.fillStyle = '#bdb9a3'; x.fillText(spaced((p.nome || '').toUpperCase()), W / 2, 340);
  x.font = `150px ${STENF}`; x.fillStyle = '#9cc1ff'; x.fillText(dec(p.pct, 1) + '%', W / 2, 560); x.font = `800 48px ${CONDF}`; x.fillStyle = '#e6e2cf'; x.fillText('FLÁVIO BOLSONARO', W / 2, 625);
  x.font = `150px ${STENF}`; x.fillStyle = '#ff9f90'; x.fillText(dec(100 - p.pct, 1) + '%', W / 2, 840); x.font = `800 48px ${CONDF}`; x.fillStyle = '#e6e2cf'; x.fillText('LULA', W / 2, 905);
  const box = (y, k, v) => { x.fillStyle = 'rgba(18,21,15,.94)'; x.fillRect(90, y, W - 180, 170); x.fillStyle = '#e3a72f'; x.fillRect(90, y, W - 180, 6); x.font = `800 30px ${CONDF}`; x.fillStyle = '#f5c96a'; x.fillText(spaced(k), W / 2, y + 62); x.font = `62px ${STENF}`; x.fillStyle = '#e6e2cf'; x.fillText(v, W / 2, y + 138); };
  box(1010, 'ELEITO DECLARADO ÀS', (p.hora || '?').replace(':', 'H'));
  box(1230, 'ESTADO MAIS APERTADO', (UFN[p.uf] || '?').toUpperCase());
  x.font = `34px ${TYPEF}`; x.fillStyle = '#d6d2bf'; x.fillText('E você? Faça o seu e mande para a turma.', W / 2, 1520);
  x.font = `700 40px ${CONDF}`; x.fillStyle = '#e3a72f'; x.fillText(spaced('VOTOCRUZADO.COM.BR/BATALHA'), W / 2, 1800);
  x.font = `600 24px ${CONDF}`; x.fillStyle = '#7a7d68'; x.fillText('Palpite de brincadeira · resultado oficial: TSE', W / 2, 1850);
  c.toBlob(b => offerFile(b, 'meu-palpite-batalha.png', 'image'), 'image/png');
}
function bolBind() {
  if (!$('#bolaoModal')) return;
  $('#bPct').oninput = bolPctLabel;
  $('#bSalvar').onclick = () => { BOL.me = bolCollect(); bolSave(); bolRender(); toast('Palpite salvo neste aparelho'); };
  $('#bStory').onclick = () => { BOL.me = bolCollect(); bolSave(); bolRender(); $('#bolaoModal').hidden = true; bolCard(BOL.me); };
  $('#bLink').onclick = async () => {
    BOL.me = bolCollect(); bolSave(); bolRender(); const link = bolLink(BOL.me);
    if (navigator.share && MOBILE) { try { await navigator.share({ title: 'Meu palpite na Batalha do voto', text: `Meu palpite para o 2º turno: Flávio ${dec(BOL.me.pct, 1)}% x ${dec(100 - BOL.me.pct, 1)}% Lula. Faça o seu:`, url: link }); return; } catch (e) {} }
    try { await navigator.clipboard.writeText(link); toast('Link do palpite copiado. Mande no grupo da turma.'); } catch (e) { prompt('Copie o link do seu palpite:', link); }
  };
  $('#bFechar').onclick = () => { $('#bolaoModal').hidden = true; };
  $('#bolaoModal').addEventListener('click', e => { if (e.target.id === 'bolaoModal') $('#bolaoModal').hidden = true; });
  $('#btnBolao').onclick = bolOpen;
}


// =====================================================================
// Frente estadual: modelo, painéis, dados e simulação próprios
// =====================================================================
// fração apurada do município: arquivo do município; no último quadro ao vivo, o andamento informado pelo TSE
function munF(fr, c) { const d = fr && fr.mun ? fr.mun[c] : null; if (d && d.ts) return d.st / d.ts; return S.mode === 'live' && fr && fr === S.frames[S.frames.length - 1] ? (S.munFrac[c] || 0) : 0; }
function computeTerritory(fr, live) {
  const mun = fr && fr.mun ? fr.mun : {}, all = !!(fr && fr.br && fr.br.ts && fr.br.st >= fr.br.ts);
  for (const h of HX) {
    const c = h.mu.c, d = mun[c];
    let f = munF(fr, c);
    if (all) f = 1;
    h.frac = clamp(f, 0, 1);
    if (d && (d.F + d.L) > 0 && h.frac > 0.001) { h.own = d.F >= d.L ? 'F' : 'L'; h.str = clamp(Math.abs(d.F - d.L) / (d.F + d.L) / 0.3, 0, 1); }
    else { h.own = null; h.str = 0; }
  }
}
function statesLed(fr, side) { let n = 0; for (const cp of CAPS) { const d = ufData(fr, cp.mu.c); if (d && (d.F + d.L) > 0 && ((side === 'F') === (d.F >= d.L))) n++; } return n; }
function computeDynamics() {
  const fr = S.frames[S.idx]; if (!fr) return;
  let j5 = S.idx; while (j5 > 0 && S.frames[j5].m > fr.m - 5) j5--;
  let j10 = S.idx; while (j10 > 0 && S.frames[j10].m > fr.m - 10) j10--;
  const f5 = S.frames[j5], f10 = S.frames[j10], g = (f, c) => f && f.mun ? f.mun[c] : null;
  for (const u of UFS) {
    let te = 0, c0 = 0, c5 = 0, F = 0, L = 0, F10 = 0, L10 = 0;
    for (const m of SECMUNS[u]) {
      te += m.te; const d = g(fr, m.c), d5 = g(f5, m.c), d10 = g(f10, m.c);
      c0 += munF(fr, m.c) * m.te; c5 += munF(f5, m.c) * m.te;
      if (d) { F += d.F; L += d.L; } if (d10) { F10 += d10.F; L10 += d10.L; }
    }
    const act = j5 === S.idx ? 0.04 : (c0 - c5) / Math.max(1, te), rem = 1 - c0 / Math.max(1, te), two = F + L, mg = two ? Math.abs(F - L) / two : 1, close = 1 - clamp(mg / 0.3, 0, 1);
    S.int[u] = c0 <= 0 ? 0 : rem <= 0.0005 ? 0.03 : clamp(0.16 + 5 * act, 0, 1) * (0.45 + 0.55 * close);
    S.mom[u] = two && (F10 + L10) && j10 !== S.idx ? 100 * (F / two - F10 / (F10 + L10)) : 0;
  }
}
function updateScaleBar() { const kk = G.s * CAM.z; let L = 100, px = kk * L / KMU; for (const c of [5, 10, 20, 25, 50, 100, 200, 250, 500]) { const p = kk * c / KMU; if (p >= 55 && p <= 140) { L = c; px = p; break; } } $('#scale').innerHTML = `<i style="width:${Math.round(px)}px"></i>${L} km`; }
function renderBase() {
  const b = BCTX, kk = G.s * CAM.z;
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
  b.fillStyle = '#0a1219'; b.fillRect(0, 0, BASE.width, BASE.height);
  setWorld(b);
  if (RELIEF.complete && RELIEF.naturalWidth) {
    const iw = IMG.x1 - IMG.x0, ih = IMG.y1 - IMG.y0, fw = 0.07 * Math.max(iw, ih);
    b.drawImage(RELIEF, IMG.x0, IMG.y0, iw, ih);
    // bordas do relevo se dissolvem no fundo (no telão, a tela larga mostraria o recorte)
    for (const [ax, ay, bx, by, rx, ry, rw, rh] of [[IMG.x0, 0, IMG.x0 + fw, 0, IMG.x0, IMG.y0, fw, ih], [IMG.x1, 0, IMG.x1 - fw, 0, IMG.x1 - fw, IMG.y0, fw, ih], [0, IMG.y0, 0, IMG.y0 + fw, IMG.x0, IMG.y0, iw, fw], [0, IMG.y1, 0, IMG.y1 - fw, IMG.x0, IMG.y1 - fw, iw, fw]]) {
      const g = b.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, 'rgba(10,18,25,1)'); g.addColorStop(1, 'rgba(10,18,25,0)'); b.fillStyle = g; b.fillRect(rx, ry, rw, rh);
    }
  }
  let st = 5; for (const s of [0.25, 0.5, 1, 2, 5]) { if (s * (PHI / RR) * kk >= 90) { st = s; break; } }
  const [wx0, wy0] = s2w(0, 0), [wx1, wy1] = s2w(G.W, G.H);
  const lon0 = TH.lonc + wx0 * RR / PHI, lon1 = TH.lonc + wx1 * RR / PHI, lat0 = -wy0 * RR, lat1 = -wy1 * RR;
  b.strokeStyle = 'rgba(214,220,190,.075)'; b.lineWidth = 1 / kk; b.beginPath();
  for (let i = Math.ceil(lon0 / st); i * st <= lon1; i++) { b.moveTo(lonX(i * st), wy0); b.lineTo(lonX(i * st), wy1); }
  for (let i = Math.floor(lat0 / st); i * st >= lat1; i--) { b.moveTo(wx0, latY(i * st)); b.lineTo(wx1, latY(i * st)); }
  b.stroke();
  b.strokeStyle = 'rgba(6,6,4,.6)'; b.lineWidth = 1.1 / kk; b.stroke(P_NB);
  b.strokeStyle = 'rgba(98,152,186,.78)'; [1.8, 1.25, 0.8].forEach((w, i) => { b.lineWidth = w / kk * Math.min(1.5, CAM.z); b.stroke(P_RV[i]); });
  b.setLineDash([3 / kk, 3 / kk]); b.strokeStyle = 'rgba(238,230,192,.22)'; b.lineWidth = 0.7 / kk; b.stroke(P_STATES.mb); b.setLineDash([]);
  b.strokeStyle = 'rgba(5,5,3,.9)'; b.lineWidth = 2.8 / kk; b.stroke(P_BR);
  b.strokeStyle = 'rgba(238,230,192,.38)'; b.lineWidth = 1 / kk; b.stroke(P_BR);
  b.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); b.textAlign = 'center'; b.textBaseline = 'middle';
  for (const lb of GEO.lb) { const [x, y] = w2s(lb.x, lb.y); if (x < -150 || x > G.W + 150 || y < -40 || y > G.H + 40) continue; b.font = `600 ${G.W < 600 ? 10 : 12}px ${CONDF}`; b.fillStyle = 'rgba(218,210,180,.4)'; b.fillText(spaced(lb.t), x, y); }
  b.font = `600 10px ${CONDF}`; b.fillStyle = 'rgba(230,226,207,.42)';
  const fd = (v, pos, neg) => { const a = Math.abs(v), d = Math.floor(a + 1e-9), mi = Math.round((a - d) * 60); return `${d}°${mi ? String(mi).padStart(2, '0') + "'" : ''}${v >= 0 ? pos : neg}`; };
  for (let i = Math.ceil(lon0 / st); i * st <= lon1; i++) { const [x] = w2s(lonX(i * st), 0); if (x > 170 && x < G.W - 170) b.fillText(fd(i * st, 'L', 'O'), x, G.H - 10); }
  b.textAlign = 'right';
  for (let i = Math.floor(lat0 / st); i * st >= lat1; i--) { const [, y] = w2s(0, latY(i * st)); if (y > 60 && y < G.H - 60) b.fillText(fd(i * st, 'N', 'S'), G.W - 12, y); }
  b.textAlign = 'left'; b.textBaseline = 'alphabetic';
}
function updateUnits() {
  const fr = S.frames[S.idx], seen = new Set(); if (!fr) return;
  // uma guarnição por cidade-chave, sem amontoar: capital primeiro, depois as maiores, com distância mínima
  const off = Math.max(1.6, 0.03 * Math.max(WB.w, WB.h)), minD = 0.09 * Math.max(WB.w, WB.h), placed = [];
  for (const cp of CAPS.slice().sort((a, b) => b.nat - a.nat || b.mu.te - a.mu.te)) {
    const d = ufData(fr, cp.mu.c); if (!d || !(d.F + d.L)) continue;
    if (placed.some(p => Math.hypot(p[0] - cp.x, p[1] - cp.y) < minD)) continue;
    placed.push([cp.x, cp.y]);
    const side = d.F >= d.L ? 'F' : 'L', key = cp.uf; seen.add(key);
    let un = UNITS.get(key); if (!un) { un = { side, uf: key, x: cp.x, y: cp.y - off, a: 0 }; UNITS.set(key, un); }
    un.side = side; un.tx = cp.x; un.ty = cp.y - off; un.votes = side === 'F' ? d.F : d.L; un.ta = 1;
  }
  for (const [k, un] of UNITS) if (!seen.has(k)) un.ta = 0;
}
function drawCapitals(c, now) {
  const fr = S.frames[S.idx], placed = [];
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.textBaseline = 'alphabetic';
  const list = CAPS.slice().sort((a, b) => b.nat - a.nat || b.mu.te - a.mu.te);
  for (const cp of list) {
    const [x, y] = w2s(cp.x, cp.y); if (x < -30 || x > G.W + 30 || y < -30 || y > G.H + 30) continue;
    const d = ufData(fr, cp.mu.c), ld = d && (d.F + d.L) ? (d.F >= d.L ? 'F' : 'L') : null, col = ld ? (ld === 'F' ? COLF : COLL) : '#a19f8c';
    if (cp.nat) drawStar(c, x, y, 7.5, col);
    else { c.beginPath(); c.arc(x, y, 3.8, 0, 6.283); c.fillStyle = col; c.fill(); c.lineWidth = 1.4; c.strokeStyle = '#0b0b08'; c.stroke(); c.beginPath(); c.arc(x, y, 6.3, 0, 6.283); c.strokeStyle = 'rgba(241,238,221,.6)'; c.lineWidth = 1; c.stroke(); }
    c.font = `700 ${cp.nat ? 12 : 11}px ${CONDF}`; const t = spaced(cp.n.toUpperCase()), w = c.measureText(t).width;
    const lx = x + 9 + w > G.W - 6 ? x - 9 - w : x + 9;
    if (placed.some(p => Math.abs(p[1] - y) < 15 && lx < p[0] + p[2] + 6 && lx + w > p[0] - 6)) continue;
    placed.push([lx, y, w]); c.textAlign = 'left'; haloText(c, t, lx, y + 4, 'rgba(241,238,221,.92)');
  }
}
function drawLights(c, now, nk) {
  if (nk < 0.05) return;
  const fr = S.frames[S.idx]; c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.globalCompositeOperation = 'lighter';
  for (const cp of CAPS) {
    const [x, y] = w2s(cp.x, cp.y); if (x < -40 || x > G.W + 40 || y < -40 || y > G.H + 40) continue;
    const d = ufData(fr, cp.mu.c), on = d && d.st > 0 ? 1 : 0.55, fl = REDUCED ? 1 : 0.86 + 0.14 * Math.sin(now / 170 + cp.x * 3), r = (cp.nat ? 26 : 16) * fl * Math.min(1.7, CAM.z);
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,206,130,${(0.42 * nk * on).toFixed(3)})`); g.addColorStop(1, 'rgba(255,206,130,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.globalCompositeOperation = 'source-over';
}
function renderGhostUI() { $('#tugGhost').hidden = true; $('#ghostLine').hidden = true; }
function renderBoard() {
  const fr = S.frames[S.idx], M = CMETA[S.mode], br = fr ? fr.br : null;
  const vv = br ? br.F + br.L + (br.O || 0) : 0, pa = vv ? 100 * br.F / vv : null, pb = vv ? 100 * br.L / vv : null, po = vv ? 100 * (br.O || 0) / vv : 0, pst = br && br.ts ? 100 * br.st / br.ts : 0;
  const lead = vv ? (br.F >= br.L ? 'F' : 'L') : null, fin = br && br.st >= br.ts && S.mode === 'sim';
  const win = { F: S.eleito === 'F' || (fin && br.F > br.L), L: S.eleito === 'L' || (fin && br.L > br.F) }, wtx = S.mode === 'live' ? 'eleito' : 'venceu';
  const lastOf = side => { const ev = S.events.filter(e => e.k <= S.idx && e.side === side && e.short).pop(); return ev ? `${clk(ev.m)} · ${esc(ev.short)}` : 'Aguardando o primeiro combate.'; };
  const card = side => {
    const isF = side === 'F', p = isF ? pa : pb, v = br ? (isF ? br.F : br.L) : null;
    const bd = win[side] ? `<span class="badge win">${wtx}</span>` : lead === side ? '<span class="badge">na frente</span>' : '';
    const bdM = bd.replace('class="badge', 'class="badge showM'), bdD = bd.replace('class="badge', 'class="badge hideM');
    return `<div class="hd">${insignia(side)}<div><div class="rank">${isF ? '' : bdM}Exército ${isF ? 'âmbar' : 'ciano'}${isF ? bdM : ''}</div><div class="nm">${esc(isF ? M.a : M.b)}</div><div class="pty">${esc(isF ? M.ap : M.bp)}</div></div></div>
      <div class="big${p == null ? ' off' : ''}">${p == null ? '00,00%' : fmtP(p, 2)}</div>
      <div class="sub">${isF ? '' : bdD}${v != null ? fmtN(v) + ' votos' : 'votos válidos'}${isF ? bdD : ''}</div>
      <div class="stats"><div class="stat"><span>Território</span><b>${dec(territory(side), 1)}% do mapa</b></div><div class="stat"><span>Cidades-chave</span><b>${statesLed(fr, side)} de ${CAPS.length}</b></div><div class="stat"><span>Avanço 10 min</span><b>${momOf(side) || '<span style="color:var(--mut)">aguardando</span>'}</b></div></div>
      <div class="last">${lastOf(side)}</div>`;
  };
  $('#hqA').innerHTML = card('F'); $('#hqB').innerHTML = card('L');
  $('#tugA').style.width = (pa != null ? pa : 50) + '%'; $('#tugO').style.width = po + '%'; $('#tugB').style.width = (pb != null ? pb : 50) + '%';
  $('#knot').style.left = (pa != null ? pa + po / 2 : 50) + '%';
  $('#tugLa').textContent = pa != null ? `${M.ashort} ${fmtP(pa, 2)}` : M.ashort; $('#tugLb').textContent = pb != null ? `${fmtP(pb, 2)} ${M.bshort}` : M.bshort;
  $('#progFill').style.width = pst + '%'; $('#progL').textContent = `Território apurado: ${fmtP(pst, 2)}`;
  $('#progR').textContent = !br ? '' : S.mode === 'live' ? `${fmtN(br.st)} de ${fmtN(br.ts)} seções${po > 0.05 ? ` · outros ${fmtP(po, 1)}` : ''}` : `${fmtMi(br.est)} de ${fmtMi(br.te)} eleitores`;
  $('#hudPct').textContent = fmtP(pst, pst >= 99.995 || pst === 0 ? 0 : 1);
  $('#hudTL').innerHTML = `Governo · ${esc(UFNOME)} · <span>${esc(DATEL[S.mode])}</span><b>${fr ? clk(fr.m) + ' · ' + hplus(fr.m) : 'H-0'}</b>`;
  renderFronts(fr); renderUfGrid(fr);
  $('#legend').innerHTML = [`<span><i style="background:var(--F)"></i>Âmbar · ${esc(M.ashort)}</span>`, `<span><i style="background:var(--L)"></i>Ciano · ${esc(M.bshort)}</span>`, '<span><i style="background:#2c2f27;border:1px solid #555"></i>Neblina de guerra (não apurado)</span>', '<span><i style="background:repeating-linear-gradient(135deg,#ffd089 0 2px,transparent 2px 5px)"></i>Município em apuração</span>', '<span><i style="background:linear-gradient(#ffbe5a 0 35%,#140a05 35% 65%,#78dcf5 65%)"></i>Linha de frente</span>', '<span><i style="background:#b8770f;outline:1px solid #f1eedd"></i>Guarnição (votos na cidade)</span>'].join('');
  renderGhostUI(); renderReinf(fr);
}
function renderFronts(fr) {
  const el = $('#fronts');
  if (!el.children.length) el.innerHTML = UFS.map(u => `<div class="front" data-g="${u}"><span class="fn">${esc(UFN[u])}</span><div class="fb"><i class="a" style="background:var(--F);width:0"></i><i class="f" style="background:#30342b;width:100%"></i><i class="b" style="background:var(--L);width:0"></i></div><span class="fv">·</span></div>`).join('');
  for (const row of el.children) {
    const u = row.dataset.g, hs = BYUF[u]; let a = 0, b = 0; hs.forEach(h => { if (h.own === 'F') a += h.frac; else if (h.own === 'L') b += h.frac; });
    const n = hs.length || 1, pa = 100 * a / n, pb = 100 * b / n;
    row.querySelector('.a').style.width = pa + '%'; row.querySelector('.b').style.width = pb + '%'; row.querySelector('.f').style.width = Math.max(0, 100 - pa - pb) + '%';
    let F = 0, L = 0; for (const m of SECMUNS[u]) { const d = ufData(fr, m.c); if (d) { F += d.F; L += d.L; } }
    row.querySelector('.fv').textContent = F + L ? `votos ${dec(100 * F / (F + L), 1)}% x ${dec(100 * L / (F + L), 1)}%` : 'sem combate';
  }
}
function renderUfGrid(fr) {
  const el = $('#ufgrid'), M = CMETA[S.mode];
  if (!el.children.length) el.innerHTML = CAPS.map(cp => `<div class="uft" data-c="${cp.mu.c}">${esc(cp.n)}<small>·</small><i style="width:0"></i></div>`).join('');
  for (const t of el.children) {
    const c = +t.dataset.c, m = MUNBYC.get(c), d = ufData(fr, c), two = d ? d.F + d.L : 0, f = munF(fr, c);
    const ld = d && two ? (d.F >= d.L ? 'F' : 'L') : null, sh = ld ? 100 * (ld === 'F' ? d.F : d.L) / two : 0, mg = ld ? Math.abs(d.F - d.L) / two : 0;
    if (t.dataset.lead && ld && t.dataset.lead !== ld && !GRID_SILENT) { t.classList.remove('flip'); void t.offsetWidth; t.classList.add('flip'); }
    t.dataset.lead = ld || '';
    t.style.background = ld ? `rgba(${ld === 'F' ? '240,160,40' : '40,180,210'},${(0.22 + 0.4 * clamp(mg / 0.3, 0, 1)).toFixed(2)})` : '';
    t.querySelector('small').textContent = ld ? `${ld === 'F' ? M.ashort : M.bshort} ${dec(sh, 1)}%` : (f > 0 ? 'apurando' : 'neblina');
    t.querySelector('i').style.width = (100 * f).toFixed(1) + '%';
    t.title = `${m.n}: ${fmtN(m.te)} eleitores · ${dec(100 * f, 1)}% apurado` + (ld ? ` · ${M.ashort} ${dec(100 * d.F / two, 1)}% x ${dec(100 * d.L / two, 1)}% ${M.bshort}` : '');
  }
}
function buildEvents() {
  const ev = [], M = CMETA[S.mode], nm = s => s === 'F' ? M.ashort : M.bshort, FN = s => `tropas de ${nm(s)}`;
  const leadC = {}; let natLead = null, decided = false, started = false, mi = 0; const miles = [10, 25, 50, 75, 90, 99];
  S.frames.forEach((fr, k) => {
    const br = fr.br, vv = br.F + br.L + (br.O || 0), pst = br.ts ? 100 * br.st / br.ts : 0;
    if (!vv) return;
    if (!started) { started = true; ev.push({ k, m: fr.m, side: null, kind: 'start', t: `Início das hostilidades na frente ${PREPF} ${UFNOME}. Chegam os primeiros relatórios: ${fmtP(pst, 2)} apurado.` }); }
    if (MUNS.length > 1) for (const cp of CAPS) {
      const d = fr.mun && fr.mun[cp.mu.c]; if (!d || !(d.F + d.L) || !d.ts) continue;
      const f = d.st / d.ts, L = d.F >= d.L ? 'F' : 'L', sh = 100 * (L === 'F' ? d.F : d.L) / (d.F + d.L);
      if (!leadC[cp.uf]) { if (f >= 0.2) { leadC[cp.uf] = L; ev.push({ k, m: fr.m, side: L, kind: 'flag', uf: cp.uf, t: `${cap1(FN(L))} tomam ${cp.n}: ${fmtP(sh, 1)} com ${fmtP(100 * f, 0)} apurado na cidade.`, short: `tomou ${cp.n}` }); } }
      else if (leadC[cp.uf] !== L && f >= 0.3) { leadC[cp.uf] = L; ev.push({ k, m: fr.m, side: L, kind: 'flip', uf: cp.uf, big: true, t: `Virada em ${cp.n}! ${cap1(FN(L))} rompem a linha e tomam a cidade com ${fmtP(100 * f, 0)} apurado.`, short: `virada em ${cp.n}`, banner: ['Virada em ' + cp.n, `${cap1(FN(L))} tomam a cidade`] }); }
    }
    const NL = br.F >= br.L ? 'F' : 'L';
    if (natLead && NL !== natLead && pst >= 1) ev.push({ k, m: fr.m, side: NL, kind: 'nat', big: true, t: `VIRADA ${PREPF.toUpperCase()} ${UFNOME.toUpperCase()}. ${cap1(FN(NL))} assumem a liderança com ${fmtP(pst, 1)} apurado.`, short: 'virada no estado', banner: [`Virada ${PREPF} ${UFNOME}`, `${cap1(FN(NL))} assumem a liderança`] });
    natLead = NL;
    while (mi < miles.length && pst >= miles[mi]) { ev.push({ k, m: fr.m, side: NL, kind: 'mile', t: `Relatório de situação: ${miles[mi]}% do território apurado. ${M.ashort} ${fmtP(100 * br.F / vv, 2)} x ${fmtP(100 * br.L / vv, 2)} ${M.bshort}.` }); mi++; }
    if (!decided && br.te > 0 && br.st < br.ts && Math.abs(br.F - br.L) > br.te - br.est) {
      decided = true; const w = br.F > br.L ? 'F' : 'L', o = w === 'F' ? 'L' : 'F';
      const dv = Math.abs(br.F - br.L), vts = dv >= 1e6 ? fmtBig(dv) + ' de votos' : fmtBig(dv) + ' votos';
      ev.push({ k, m: fr.m, side: w, kind: 'decid', big: true, t: `Vitória matemática de ${nm(w)}: a vantagem (${vts}) já supera todos os eleitores que faltam apurar (${fmtBig(br.te - br.est)}). Nem com todos ao lado de ${nm(o)} haveria virada.`, short: 'vitória matemática', banner: ['Vitória matemática', `${nm(w)} não pode mais ser alcançado`] });
    }
    if (br.st >= br.ts && !ev.some(e => e.kind === 'end')) {
      const w = br.F >= br.L ? 'F' : 'L', pw = fmtP(100 * (w === 'F' ? br.F : br.L) / vv, 2), dm = Math.abs(br.F - br.L), mgs = dm < 1e6 ? `vantagem de ${fmtN(dm)} votos` : `vantagem de ${fmtBig(dm)} de votos`;
      ev.push({ k, m: fr.m, side: w, kind: 'end', big: true, short: 'cessar-fogo na frente', t: S.mode === 'live' ? `Cessar-fogo. Apuração encerrada ${PREPF} ${UFNOME}: ${nm(w)} termina com ${pw} dos válidos (${mgs}).` : `Cessar-fogo. Fim da simulação: ${nm(w)} vence com ${pw} dos válidos (${mgs}).`, banner: ['Cessar-fogo', S.mode === 'live' ? `${nm(w)} na frente com 100% apurado` : `${nm(w)} vence com ${pw}`] });
    }
  });
  if (S.mode === 'live' && S.eleito) { const fr = S.frames[S.frames.length - 1]; ev.push({ k: S.frames.length - 1, m: fr.m, side: S.eleito, kind: 'eleito', big: true, short: 'eleito pelo TSE', t: `O TSE declara ${S.eleito === 'F' ? M.a : M.b} eleito para o governo ${PREPF} ${UFNOME}.`, banner: ['Fim da guerra', `${S.eleito === 'F' ? M.a : M.b} eleito`] }); }
  ev.forEach((e, i) => e.n = i + 1);
  return ev;
}
function renderReinf(fr) {
  const el = $('#reinf'); if (!el) return;
  if (!fr) { el.innerHTML = '<div class="rf-empty">Quando a apuração começar, este painel mostra quantos eleitores ainda faltam, onde estão e como essas cidades votaram no 1º turno.</div>'; return; }
  if (fr.br && fr.br.ts && fr.br.st >= fr.br.ts) { el.innerHTML = '<div class="rf-empty">Todas as tropas já chegaram: território 100% apurado.</div>'; return; }
  const M = CMETA[S.mode], keyset = new Set(CITIES.map(m => m.c)), groups = { cap: { n: 'Capital', rem: 0, F: 0, L: 0 }, key: { n: 'Cidades-chave', rem: 0, F: 0, L: 0 }, int: { n: 'Demais cidades', rem: 0, F: 0, L: 0 } };
  const kv = MUNS.reduce((a, m) => a + (m.v || 0), 0) / Math.max(1, MUNS.reduce((a, m) => a + m.te, 0));
  let TOT = 0, F = 0, L = 0;
  for (const m of MUNS) {
    const d = ufData(fr, m.c), f = d && d.te ? d.est / d.te : munF(fr, m.c), rem = m.te * (1 - clamp(f, 0, 1)); if (rem < 1) continue;
    const two = rem * kv, fa = two * m.lean1, g = m.cap ? 'cap' : keyset.has(m.c) ? 'key' : 'int';
    groups[g].rem += rem; groups[g].F += fa; groups[g].L += two - fa; TOT += rem; F += fa; L += two - fa;
  }
  if (TOT < 1) { el.innerHTML = '<div class="rf-empty">Todas as tropas já chegaram: território 100% apurado.</div>'; return; }
  const te = MUNS.reduce((a, m) => a + m.te, 0), pf = 100 * F / (F + L), saldo = F - L, lead = fr.br.F - fr.br.L, nmS = v => v >= 0 ? M.ashort : M.bshort, sg = v => '+' + fmtMi(Math.abs(v));
  const rows = ['cap', 'key', 'int'].filter(g => groups[g].rem >= 1).map(g => { const p = groups[g], sp = 100 * p.F / (p.F + p.L); return `<div class="rf-row"><span class="rf-n">${p.n}</span><div class="rf-b"><i style="width:${sp.toFixed(1)}%;background:var(--F)"></i><i style="width:${(100 - sp).toFixed(1)}%;background:var(--L)"></i></div><span class="rf-v">${fmtMi(p.rem)} eleitores · ${sp >= 50 ? M.ashort + ' ' + dec(sp, 0) : M.bshort + ' ' + dec(100 - sp, 0)}%</span></div>`; }).join('');
  el.innerHTML = `<div class="rf-top"><div><b>${fmtMi(TOT)}</b><span>eleitores ainda por apurar (${dec(100 * TOT / te, 1)}% do total)</span></div><div><b class="${saldo >= 0 ? 'cF' : 'cL'}">${sg(saldo)}</b><span>saldo dessas cidades no 1º turno, para ${esc(nmS(saldo))}</span></div><div><b class="${lead >= 0 ? 'cF' : 'cL'}">${sg(lead)}</b><span>vantagem atual de ${esc(nmS(lead))}</span></div></div>`
    + `<div class="rf-sub">Como essas cidades votaram no 1º turno (só entre os dois): <b style="color:var(--F2)">${esc(M.ashort)} ${dec(pf, 1)}%</b> x <b style="color:var(--L2)">${dec(100 - pf, 1)}% ${esc(M.bshort)}</b></div>${rows}`
    + `<div class="rf-note">Não é previsão: mostra quantos eleitores faltam e como essas mesmas cidades votaram no 1º turno, considerando só os dois finalistas.</div>`;
}
function showTip(ev) {
  const [px, py, r] = evXY(ev), [wx, wy] = s2w(px, py), h = hexAt(wx, wy), tip = $('#tip');
  if (!h) { tip.hidden = true; return; }
  const m = h.mu, fr = S.frames[S.idx], d = ufData(fr, m.c), M = CMETA[S.mode], two = d ? d.F + d.L : 0, a = two ? 100 * d.F / two : null, f = 100 * munF(fr, m.c), a1 = m.two ? 100 * m.a / m.two : null;
  tip.innerHTML = `<b>${esc(m.n)}</b><span style="color:var(--mut)"> · ${esc(UFN[h.uf])}</span><br><span style="color:var(--mut)">${fmtN(m.te)} eleitores · ${fmtP(f, 1)} apurado</span>${two ? `<div class="bar"><div style="width:${a}%;background:var(--F)"></div><div style="width:${100 - a}%;background:var(--L)"></div></div>${esc(M.ashort)} <b style="color:var(--F2)">${fmtP(a, 1)}</b> · ${esc(M.bshort)} <b style="color:var(--L2)">${fmtP(100 - a, 1)}</b>` : '<br>Coberto pela neblina de guerra.'}${a1 != null ? `<br><span style="color:var(--mut)">1º turno, só entre os dois: ${esc(M.ashort)} ${dec(a1, 1)}% x ${dec(100 - a1, 1)}% ${esc(M.bshort)}</span>` : ''}<br><span style="color:var(--mut);font-size:12px">${CAM.user ? 'Clique para voltar ao mapa' : 'Clique para aproximar'}</span>`;
  tip.hidden = false; const tw = tip.offsetWidth, th = tip.offsetHeight; let lx = px + 16, ly = py + 16; if (lx + tw > r.width) lx = px - tw - 16; if (ly + th > r.height) ly = py - th - 16; tip.style.left = Math.max(4, lx) + 'px'; tip.style.top = Math.max(4, ly) + 'px';
}
function storySubtitle() { return `Governo ${PREPF} ${UFNOME} · ` + (S.mode === 'live' ? '2º turno ao vivo' : `simulação ${META.ashort} ${dec(S.simT, 1)}% x ${dec(100 - S.simT, 1)}% ${META.bshort}`); }
function composeStory(x, now) {
  const W = 1080, H = 1920, fr = S.frames[S.idx], M = CMETA[S.mode], br = fr ? fr.br : null, vv = br ? br.F + br.L + (br.O || 0) : 0;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.textBaseline = 'alphabetic';
  x.fillStyle = '#0a0c09'; x.fillRect(0, 0, W, H);
  for (const [cx, col] of [[150, '240,160,40'], [930, '40,180,210']]) { const g = x.createRadialGradient(cx, 0, 10, cx, 0, 820); g.addColorStop(0, `rgba(${col},.26)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  x.textAlign = 'center'; x.fillStyle = '#e6e2cf'; x.font = `78px ${STENF}`; x.fillText('BATALHA DO VOTO', W / 2, 112);
  x.font = `700 30px ${CONDF}`; x.fillStyle = '#e3a72f'; x.fillText(spaced(storySubtitle().toUpperCase()), W / 2, 162, W - 60);
  const pa = vv ? 100 * br.F / vv : null, pb = vv ? 100 * br.L / vv : null;
  x.font = `112px ${STENF}`; x.textAlign = 'left'; x.fillStyle = COLF2; x.fillText(pa == null ? '00,00%' : dec(pa, 2) + '%', 48, 312);
  x.textAlign = 'right'; x.fillStyle = COLL2; x.fillText(pb == null ? '00,00%' : dec(pb, 2) + '%', W - 48, 312);
  x.font = `800 40px ${CONDF}`; x.fillStyle = '#e6e2cf'; x.textAlign = 'left'; x.fillText(M.a.toUpperCase(), 52, 366, W / 2 - 60); x.textAlign = 'right'; x.fillText(M.b.toUpperCase(), W - 52, 366, W / 2 - 60);
  if (br) { x.font = `600 30px ${CONDF}`; x.fillStyle = '#9a9c86'; x.textAlign = 'left'; x.fillText(fmtN(br.F) + ' votos', 52, 406); x.textAlign = 'right'; x.fillText(fmtN(br.L) + ' votos', W - 52, 406); }
  const tx = 48, tw = W - 96, ty = 440, th = 26;
  x.fillStyle = '#1d2118'; x.fillRect(tx, ty, tw, th);
  if (vv) { x.fillStyle = COLF; x.fillRect(tx, ty, tw * pa / 100, th); x.fillStyle = COLL; x.fillRect(tx + tw * pa / 100, ty, tw * pb / 100, th); }
  x.fillStyle = '#e6e2cf'; x.fillRect(W / 2 - 1.5, ty - 6, 3, th + 12);
  if (vv) { const kx = tx + tw * pa / 100; x.save(); x.translate(kx, ty + th / 2); x.rotate(Math.PI / 4); x.fillStyle = '#e6e2cf'; x.fillRect(-11, -11, 22, 22); x.restore(); }
  const pst = br && br.ts ? 100 * br.st / br.ts : 0;
  x.textAlign = 'center'; x.font = `46px ${STENF}`; x.fillStyle = '#e6e2cf'; x.fillText(fr ? `${clk(fr.m)}  ·  ${dec(pst, pst >= 99.995 ? 0 : 1)}% APURADO` : 'TROPAS EM POSIÇÃO', W / 2, 540);
  const crop = 0.04, sx = cv.width * crop, sw = cv.width * (1 - 2 * crop), sh = cv.height, sc = Math.min((W - 40) / sw, 985 / sh), dw = sw * sc, dh = sh * sc, dx = (W - dw) / 2, dy = 576;
  x.drawImage(cv, sx, 0, sw, sh, dx, dy, dw, dh);
  x.strokeStyle = 'rgba(230,226,207,.35)'; x.lineWidth = 2; x.strokeRect(dx + 1, dy + 1, dw - 2, dh - 2);
  x.save(); x.translate(dx + dw - 160, dy + dh - 64); x.rotate(-0.12); x.font = `38px ${STENF}`;
  const stx = S.mode === 'sim' ? 'SIMULAÇÃO' : (S.status === 'final' ? 'CONCLUÍDA' : 'AO VIVO'), stc = S.mode === 'sim' ? 'rgba(227,167,47,.92)' : 'rgba(228,72,60,.92)', stw = x.measureText(stx).width;
  x.strokeStyle = stc; x.lineWidth = 4; x.strokeRect(-stw / 2 - 16, -38, stw + 32, 52); x.fillStyle = stc; x.textAlign = 'center'; x.fillText(stx, 0, 0); x.restore();
  const y = dy + dh + 30, bh = Math.max(140, H - 118 - y);
  const bn = BANNER_NOW && now - BANNER_NOW.t0 < 3400 ? BANNER_NOW : null, ev = S.events.filter(e => e.k <= S.idx).pop(), side = bn ? bn.side : ev ? ev.side : null;
  x.fillStyle = 'rgba(18,21,15,.96)'; x.fillRect(40, y, W - 80, bh);
  x.fillStyle = side === 'F' ? COLF : side === 'L' ? COLL : '#e3a72f'; x.fillRect(40, y, W - 80, 6);
  x.textAlign = 'left'; x.font = `800 26px ${CONDF}`; x.fillStyle = '#f5c96a';
  x.fillText(spaced((bn ? `Despacho urgente · ${clk(bn.m)}` : ev ? `Comunicado nº ${String(ev.n).padStart(3, '0')} · ${clk(ev.m)}` : 'Comunicado').toUpperCase()), 70, y + 50);
  const maxL = Math.max(1, Math.floor((bh - 74) / 40)), yEnd = y + bh - 24;
  let yy;
  if (bn) { x.font = `60px ${STENF}`; x.fillStyle = side === 'F' ? COLF2 : side === 'L' ? COLL2 : '#ffffff'; x.fillText(bn.b[0], 70, y + 122, W - 140); x.font = `32px ${TYPEF}`; x.fillStyle = '#d6d2bf'; const ls = wrapLines(x, bn.b[1] || '', W - 140).slice(0, Math.max(1, maxL - 1)); ls.forEach((l, i) => x.fillText(l, 70, y + 170 + i * 40)); yy = y + 170 + ls.length * 40; }
  else { x.font = `30px ${TYPEF}`; x.fillStyle = '#d6d2bf'; const ls = wrapLines(x, ev ? ev.t : 'Nenhum combate ainda. A batalha começa às 17h de 25 de outubro.', W - 140).slice(0, maxL); ls.forEach((l, i) => x.fillText(l, 70, y + 94 + i * 40)); yy = y + 94 + ls.length * 40; }
  // despachos anteriores no espaço que sobra
  const older = S.events.filter(e => e.k <= S.idx && e !== ev).slice(-6).reverse();
  x.font = `25px ${TYPEF}`;
  for (const e of older) {
    const ls = wrapLines(x, `${clk(e.m)} · ${e.t}`, W - 140); if (yy + 26 + ls.length * 33 > yEnd) break;
    yy += 26; x.fillStyle = 'rgba(214,210,191,.16)'; x.fillRect(70, yy - 14, W - 140, 1.5);
    x.fillStyle = e.side === 'F' ? 'rgba(255,208,137,.8)' : e.side === 'L' ? 'rgba(159,227,242,.8)' : 'rgba(214,210,191,.72)';
    ls.forEach((l, i) => x.fillText(l, 70, yy + 18 + i * 33)); yy += 18 + (ls.length - 1) * 33 + 8;
  }
  x.textAlign = 'center'; x.font = `700 30px ${CONDF}`; x.fillStyle = '#e3a72f'; x.fillText(spaced('VOTOCRUZADO.COM.BR/BATALHA/GOVERNADOR'), W / 2, H - 56);
  x.font = `600 22px ${CONDF}`; x.fillStyle = '#7a7d68'; x.fillText(S.mode === 'sim' ? 'Simulação de cenário, não é previsão' : 'Dados oficiais do TSE', W / 2, H - 22);
}
function saveImage() {
  const W = 1200, H = 1380, c = mk(); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#0a0c09'; x.fillRect(0, 0, W, H);
  const fr = S.frames[S.idx], M = CMETA[S.mode], br = fr ? fr.br : null, vv = br ? br.F + br.L + (br.O || 0) : 0;
  x.textAlign = 'center'; x.fillStyle = '#e6e2cf'; x.font = `48px ${STENF}`; x.fillText('BATALHA DO VOTO', W / 2, 74);
  x.font = `600 24px ${CONDF}`; x.fillStyle = '#878a74'; x.fillText(spaced((storySubtitle() + (fr ? ` · ${clk(fr.m)} · ${dec(100 * br.st / br.ts, 1)}% apurado` : '')).toUpperCase()), W / 2, 112, W - 40);
  if (vv) {
    x.font = `64px ${STENF}`; x.textAlign = 'left'; x.fillStyle = COLF2; x.fillText(dec(100 * br.F / vv, 2) + '%', 50, 196); x.textAlign = 'right'; x.fillStyle = COLL2; x.fillText(dec(100 * br.L / vv, 2) + '%', W - 50, 196);
    x.font = `800 28px ${CONDF}`; x.textAlign = 'left'; x.fillStyle = '#e6e2cf'; x.fillText(M.a.toUpperCase(), 52, 234); x.textAlign = 'right'; x.fillText(M.b.toUpperCase(), W - 52, 234);
    x.font = `600 22px ${CONDF}`; x.fillStyle = '#878a74'; x.textAlign = 'left'; x.fillText(`Território ${dec(territory('F'), 1)}% · ${statesLed(fr, 'F')} cidades-chave`, 52, 264); x.textAlign = 'right'; x.fillText(`Território ${dec(territory('L'), 1)}% · ${statesLed(fr, 'L')} cidades-chave`, W - 52, 264);
  }
  const mw = W - 60, mh = Math.min(H - 380, mw * cv.height / cv.width), my = 296;
  x.drawImage(cv, 30 + (mw - mh * cv.width / cv.height) / 2, my, mh * cv.width / cv.height, mh);
  x.strokeStyle = 'rgba(230,226,207,.25)'; x.strokeRect(30.5, my + 0.5, mw - 1, mh - 1);
  x.textAlign = 'center'; x.font = `600 22px ${CONDF}`; x.fillStyle = '#878a74'; x.fillText(spaced('VOTOCRUZADO.COM.BR/BATALHA/GOVERNADOR · DADOS OFICIAIS DO TSE'), W / 2, H - 30);
  c.toBlob(b => offerFile(b, `batalha-governo-${UF0}.png`, 'image'), 'image/png');
}
function tvTour(now) {
  if (!TV.on || CAM.user || REDUCED) return;
  if (CAM.until && now < CAM.until) return;
  if (now - TV.last < 15000) return;
  TV.last = now;
  const cands = CAPS.map(cp => ({ cp, s: (S.int[cp.mu.sec] || 0.05) * Math.sqrt(cp.mu.te / 1000) + Math.random() * 0.8 })).sort((a, b) => b.s - a.s);
  const pick = cands[Math.floor(Math.random() * Math.min(4, cands.length))]; if (!pick) return;
  CAM.tx = pick.cp.x; CAM.ty = pick.cp.y; CAM.tz = 2.2; clampCam(); CAM.until = now + 6500; CAM.last = now;
}
// ---- dados do TSE (eleição estadual, cargo governador) ----
async function detectE() { if (params.get('e')) return params.get('e'); try { const j = await getJSON(TSE + '/comum/config/ele-c.json', 10000); for (const pl of j.pl || []) if (pl.c === CICLO) for (const e of pl.e || []) { if (e.t === '2' && e.tp === '1') return e.cd; } } catch (e) {} return '6260'; }
const normN = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
function candList(j) { const out = []; const walk = x => { if (!x || typeof x !== 'object') return; if (Array.isArray(x)) { x.forEach(walk); return; } if (Array.isArray(x.cand)) x.cand.forEach(c => out.push(c)); for (const k in x) if (k !== 'cand' && typeof x[k] === 'object') walk(x[k]); }; walk(j.carg); return out; }
function mapCands(cs) {
  if (!cs || cs.length < 2) return;
  const score = (c, name) => { const A = normN(name).split(' ').filter(w => w.length > 2), B = new Set((normN(c.nmu) + ' ' + normN(c.nm)).split(' ')); let s = 0; A.forEach(w => { if (B.has(w)) s++; }); return s / Math.max(1, A.length) + (normN(c.nmu) === normN(name) ? 1 : 0); };
  const best = name => cs.map(c => [score(c, name), c]).sort((a, b) => b[0] - a[0])[0];
  const a = best(CA.n), b = best(CB.n);
  if (a && a[0] > 0) S.numA = String(a[1].n);
  if (b && b[0] > 0 && String(b[1].n) !== S.numA) S.numB = String(b[1].n);
}
function toAB(x) { const F = x.c[S.numA] || 0, L = x.c[S.numB] || 0; let O = 0; for (const k in x.c) if (k !== S.numA && k !== S.numB) O += x.c[k]; return { st: x.st, ts: x.ts, est: x.est, te: x.te, F, L, O }; }
async function loadHistory() {
  try {
    const o = await getJSON(HIST_URL + 'e' + pad6(S.E) + '-' + UF0 + '.json?t=' + Math.floor(Date.now() / 120000), 12000);
    if (!S.numA || !S.numB) mapCands(o.cands || []);
    const nums = (o.cands || []).map(c => String(c.n)), iA = nums.indexOf(S.numA), iB = nums.indexOf(S.numB);
    if (iA < 0 || iB < 0) return [];
    const others = (a, base) => { let s = 0; for (let k = 0; k < nums.length; k++) if (k !== iA && k !== iB) s += a[base + k] || 0; return s; };
    const mun = {}, frames = [];
    for (const [m, at, b, md] of o.snaps) {
      if (md) for (const c in md) { const a = md[c]; mun[c] = { st: a[0], ts: a[1], est: a[2], te: a[3], F: a[4 + iA] || 0, L: a[4 + iB] || 0, O: others(a, 4) }; }
      frames.push({ m, at, br: { st: b[0], ts: b[1], est: b[2], te: b[3], F: b[4 + iA] || 0, L: b[4 + iB] || 0, O: others(b, 4) }, mun: Object.assign({}, mun) });
    }
    if (o.eleito) S.eleito = String(o.eleito) === S.numA ? 'F' : String(o.eleito) === S.numB ? 'L' : null;
    return frames;
  } catch (e) { return []; }
}
async function fetchLive() {
  const E = S.E, base = `${TSE}/${CICLO}/${E}/dados/${UF0}`;
  const stj = await getJSON(`${base}/${UF0}-c0003-e${pad6(E)}-u.json`);
  if (!S.numA || !S.numB) mapCands(candList(stj));
  const st = parseU(stj);
  let ab = null; try { ab = await getJSON(`${base}/${UF0}-e${pad6(E)}-ab.json`); } catch (e) { if (e.code !== 404) throw e; }
  const changed = [];
  if (ab) for (const a of ab.abr || []) { if (a.tpabr !== 'mun') continue; const c = +a.cdabr, te = +a.e.te, est = +a.e.est, key = a.s.st + '|' + a.ht + '|' + a.dt; S.munFrac[c] = te ? est / te : 0; if (+a.s.st > 0 && LIVE.mkey[c] !== key) changed.push([c, key, te]); }
  changed.sort((a, b) => b[2] - a[2]);
  const lim = Object.keys(LIVE.mun).length ? (MOBILE ? 40 : 120) : 1000;
  await Promise.allSettled(changed.slice(0, lim).map(async ([c, key]) => { const j = await getJSON(`${base}/${UF0}${String(c).padStart(5, '0')}-c0003-e${pad6(E)}-u.json`); LIVE.mun[c] = toAB(parseU(j)); LIVE.mkey[c] = key; }));
  if (MUNS.length === 1 && !LIVE.mun[MUNS[0].c]) LIVE.mun[MUNS[0].c] = toAB(st);
  const fr = { m: tseMin(st.dt, st.ht, DAYS[E] || st.dt), at: st.dt + ' ' + st.ht, br: toAB(st), mun: Object.assign({}, LIVE.mun) };
  if (MUNS.length === 1) fr.mun[MUNS[0].c] = toAB(st);
  S.eleito = st.eleito && String(st.eleito) === S.numA ? 'F' : st.eleito && String(st.eleito) === S.numB ? 'L' : null;
  return fr;
}
function renderStatus() {
  const p = $('#pill'), t = $('#pillTx'), st = $('#stamp');
  if (S.mode === 'sim') { p.className = 'pill sim'; t.textContent = 'Simulação'; st.hidden = false; st.className = 'stamp sim'; st.textContent = 'Simulação'; $('#overlay').hidden = true; return; }
  const map = { live: ['live', 'Ao vivo'], final: ['ok', 'Apuração concluída'], zero: ['wait', 'Aguardando os números'], nofile: ['wait', 'Aguardando o 2º turno'], err: ['wait', 'Sem conexão com o TSE'], load: ['wait', 'Carregando'] };
  const [c, tx] = map[S.status] || map.load; p.className = 'pill ' + c; t.textContent = tx + (S.err && S.frames.length ? ' · ' + S.err : '');
  st.hidden = !S.frames.length; st.className = 'stamp live'; st.textContent = S.status === 'final' ? 'Concluída' : 'Ao vivo';
  renderOverlay();
}
function renderOverlay() {
  const ov = $('#overlay');
  if (S.mode !== 'live' || S.frames.length) { ov.hidden = true; return; }
  const tgt = Date.UTC(2026, 9, 25, 20, 0, 0), left = Math.max(0, tgt - Date.now()), v = [Math.floor(left / 864e5), Math.floor(left % 864e5 / 36e5), Math.floor(left % 36e5 / 6e4), Math.floor(left % 6e4 / 1e3)];
  ov.hidden = false;
  if (!ov.dataset.built) {
    ov.innerHTML = `<div class="card"><h2 id="ovH"></h2><p>${esc(META.a)} (${esc(META.ap)}) x ${esc(META.b)} (${esc(META.bp)}). Quando o TSE publicar os primeiros números ${PREPF} ${esc(UFNOME)}, a neblina começa a se dissipar município por município. Até lá, simule a batalha.</p><div class="cd" id="cd"></div><div class="ovbtns"><button class="btn pri" id="goSim">Simular a batalha</button><a class="btn" href="../">Batalha nacional</a></div></div>`;
    ov.dataset.built = 1; $('#goSim').onclick = () => setMode('sim', true);
  }
  $('#ovH').textContent = S.status === 'zero' ? 'Tropas em posição' : S.status === 'err' ? 'Sem conexão com o TSE' : `A batalha pelo governo começa às 17h de 25/10`;
  $('#cd').innerHTML = left > 0 ? ['dias', 'horas', 'min', 'seg'].map((l, i) => `<div><b>${i ? String(v[i]).padStart(2, '0') : v[i]}</b><span>${l}</span></div>`).join('') : '<div><b>agora</b><span>tentando a cada minuto</span></div>';
}
function renderSimBox() {
  const el = $('#simBox');
  if (S.mode !== 'sim') { el.hidden = true; return; }
  el.hidden = false;
  if (!el.dataset.built) {
    el.innerHTML = `<div class="row"><span class="lbl">Placar final simulado</span><input type="range" id="simT" min="25" max="75" step="0.5"><span class="res" id="simRes"></span></div><div class="row" style="margin-top:8px"><button class="btn pri" id="simNew">Nova batalha</button><button class="btn" id="simEven">Proporção do 1º turno</button><span style="color:var(--mut);font-size:13px" id="simSeedL"></span></div><p>Ritmo real de apuração ${PREPF} ${esc(UFNOME)} no 2º turno de 2022 e mapa de votos do 1º turno de 2026 para governador, município por município, ajustado para o placar que você escolher. Jogo de cenário, não é previsão.</p>`;
    el.dataset.built = 1;
    const sl = $('#simT');
    sl.oninput = () => { S.simT = +sl.value; simLabel(); };
    sl.onchange = () => { S.simT = +sl.value; runSim(); };
    $('#simNew').onclick = () => { S.simSeed = 1 + Math.floor(Math.random() * 9999); runSim(); };
    $('#simEven').onclick = () => { S.simT = SIM_DEF; $('#simT').value = SIM_DEF; runSim(); };
  }
  $('#simT').value = S.simT; simLabel();
}
function simLabel() { $('#simRes').innerHTML = `<span class="a">${esc(META.ashort)} ${dec(S.simT, 1)}%</span> x <span class="b">${dec(100 - S.simT, 1)}% ${esc(META.bshort)}</span>`; $('#simSeedL').textContent = `Batalha nº ${S.simSeed}`; }
function buildSimGov(T, seed) {
  const rnd = mulberry32(seed * 7919 + 17), one = MUNS.length === 1;
  const xs = MUNS.map(m => ({ m, V: m.v || m.two || m.te * 0.7, s: m.two ? clamp(m.a / m.two, 0.02, 0.98) : 0.5, eps: one ? 0 : gauss(rnd) * 0.12 }));
  const tot = xs.reduce((a, x) => a + x.V, 0), share = dl => xs.reduce((a, x) => a + x.V * sig(logit(x.s) + x.eps + dl), 0) / tot;
  let lo = -6, hi = 6; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (share(mid) < T) lo = mid; else hi = mid; }
  const dl = (lo + hi) / 2; xs.forEach(x => { x.p = sig(logit(x.s) + x.eps + dl); x.k = x.m.o + rnd() * 8; });
  const ord = xs.slice().sort((a, b) => a.k - b.k), TE = xs.reduce((a, x) => a + x.m.te, 0), t22 = TH.t22, teMax = Math.max(...xs.map(x => x.m.te));
  // cada município apura aos poucos, em paralelo com os vizinhos: centro na ordem de 2022, duração maior nas cidades grandes
  let acc = 0; ord.forEach(x => { x.q = (acc + x.m.te / 2) / TE; acc += x.m.te; x.w = one ? 1 : 0.16 + 0.3 * Math.sqrt(x.m.te / teMax); x.d = gauss(rnd) * 0.22; });
  const fmOf = (x, g) => one ? clamp(g, 0, 1) : clamp((g - x.q + x.w / 2) / x.w, 0, 1);
  const totAt = g => ord.reduce((a, x) => a + x.m.te * fmOf(x, g), 0) / TE;
  // num estado de um só município (DF), uma oscilação aleatória que some no fim
  const walk = []; let w = 0; for (let mm = 0; mm < t22.length; mm++) { w += gauss(rnd) * 0.035; walk.push(w); }
  const frames = []; let last = 0;
  for (let mm = 0; mm < t22.length; mm++) {
    const f = t22[mm] / 1000; if (f <= last) continue; last = f;
    let g0 = -0.6, g1 = 1.6; for (let it = 0; it < 40; it++) { const gm = (g0 + g1) / 2; if (totAt(gm) < f) g0 = gm; else g1 = gm; }
    const g = f >= 0.9999 ? 9 : (g0 + g1) / 2, mun = {}; let est = 0, F = 0, L = 0;
    for (const x of ord) {
      const te = x.m.te, fm = fmOf(x, g); if (fm <= 0) continue;
      const p = one ? sig(logit(x.p) + (walk[mm] - walk[t22.length - 1] * f) * (1 - f) * 4) : sig(logit(x.p) + x.d * Math.pow(1 - fm, 1.5));
      const valid = x.V * fm, a = Math.round(valid * p), b = Math.round(valid) - a;
      mun[x.m.c] = { st: fm, ts: 1, est: Math.round(te * fm), te, F: a, L: b, O: 0 }; est += te * fm; F += a; L += b;
    }
    frames.push({ m: mm, at: 's' + mm, br: { st: Math.round(10000 * est / TE), ts: 10000, est: Math.round(est), te: TE, F, L, O: 0 }, mun });
  }
  return frames;
}
async function runSim() {
  stopPlay(); simLabel(); ++S.tok;
  S.frames = buildSimGov(S.simT / 100, S.simSeed); S.events = buildEvents(); S.shownEv = 0; $('#feed').dataset.sig = '';
  resetFX(); PARTS = [];
  const u = new URL(location.href); u.searchParams.set('modo', 'simulacao'); u.searchParams.set('placar', String(S.simT)); u.searchParams.set('batalha', String(S.simSeed)); history.replaceState(null, '', u);
  setIdx(0, { silent: true, instant: true, reset: true }); startPlay(); renderStatus();
}
async function setMode(m, autoplay) {
  stopPlay(); S.mode = m; S.frames = []; S.idx = -1; S.events = []; S.follow = true; S.eleito = null; S.shownEv = 0; S.munFrac = {};
  const tok = ++S.tok;
  $$('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  const u = new URL(location.href); ['modo', 'placar', 'batalha'].forEach(k => u.searchParams.delete(k)); u.searchParams.set('uf', UF0);
  if (m === 'sim') u.searchParams.set('modo', 'simulacao');
  history.replaceState(null, '', u);
  HX.forEach(h => { h.own = null; h.frac = 0; h.str = 0; });
  resetFX(); renderTerritory(true); camHome(); CAM.user = false; $('#chipBack').hidden = true;
  $('#feed').innerHTML = ''; $('#feed').dataset.sig = ''; $('#timeBox').dataset.built = ''; $('#timeBox').innerHTML = ''; $('#ufgrid').innerHTML = ''; $('#fronts').innerHTML = '';
  renderStatus(); renderBoard(); renderFeed(); renderSimBox();
  $('#note').innerHTML = m === 'live' ? `Ao vivo: votos oficiais do TSE a cada minuto. Cada município aparece com o resultado real dele, assim que o TSE publica.` : `Simulação: ritmo real de 2022 ${PREPF} ${esc(UFNOME)} com o mapa do 1º turno de 2026, até o placar escolhido.`;
  if (m === 'live') {
    S.E = await detectE();
    const hist = await loadHistory();
    if (tok !== S.tok) return;
    if (hist.length) { S.frames = hist; S.events = buildEvents(); setIdx(S.frames.length - 1, { silent: true, instant: true }); }
    await refreshLive(false);
  } else await runSim();
}

// ---------------------------------------------------------------------
// Controles e início (frente estadual)
// ---------------------------------------------------------------------
const FRENTES = [['ac', 'Acre'], ['am', 'Amazonas'], ['df', 'Distrito Federal'], ['es', 'Espírito Santo'], ['rn', 'Rio Grande do Norte'], ['to', 'Tocantins']];
const SIM_DEF = Math.round(2 * 100 * CA.v1 / (CA.v1 + CB.v1)) / 2;
$('#ufTabs').innerHTML = '<a href="../" class="br" title="Batalha presidencial: Flávio Bolsonaro x Lula">BR<small>Presidente</small></a>' + FRENTES.map(([u, n]) => `<a href="?uf=${u}" class="${u === UF0 ? 'on' : ''}" title="${n}">${u.toUpperCase()}<small>${n}</small></a>`).join('');
document.title = `Batalha do voto · Governo ${PREPF} ${UFNOME}`;
$('#ttlSub').textContent = `Governo ${PREPF} ${UFNOME} · 2º turno 2026`;
$$('#modes button').forEach(b => b.onclick = () => setMode(b.dataset.m, b.dataset.m !== 'live'));
$('#btnSom').onclick = sndToggle;
$('#btnCam').onclick = () => { CAM.auto = !CAM.auto; $('#btnCam').textContent = 'Câmera: ' + (CAM.auto ? 'auto' : 'fixa'); if (!CAM.auto && !CAM.user) camHome(); };
$('#btnImg').onclick = saveImage;
$('#btnNar').onclick = narToggle;
$('#btnAlr').onclick = alrToggle;
$('#btnTV').onclick = () => tvToggle();
$('#btnTVx').onclick = () => tvToggle(false);
$('#btnStory').onclick = storyImage;
$('#btnVideo').onclick = recStart;
$('#mmClose').onclick = () => { $('#mediaModal').hidden = true; };
$('#mediaModal').addEventListener('click', e => { if (e.target.id === 'mediaModal') $('#mediaModal').hidden = true; });
$('#btnRegras').onclick = () => { $('#regras').hidden = false; };
$('#btnFechaRegras').onclick = () => { $('#regras').hidden = true; };
$('#regras').addEventListener('click', e => { if (e.target.id === 'regras') $('#regras').hidden = true; });
let RSZ = 0, LASTW = 0;
window.addEventListener('resize', () => { clearTimeout(RSZ); RSZ = setTimeout(() => { if (!TV.on && Math.abs(window.innerWidth - LASTW) < 3) return; LASTW = window.innerWidth; layout(); }, 160); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { LASTT = performance.now(); startLoop(); if (S.mode === 'live' && Date.now() - LIVE.last > PERIOD) refreshLive(false); } });
if ('IntersectionObserver' in window) new IntersectionObserver(es => { MAPVIS = es[0].isIntersecting; if (MAPVIS) { LASTT = performance.now(); startLoop(); } }).observe($('#mapbox'));
setInterval(() => { if (S.mode === 'live') { if (Date.now() >= LIVE.next && !LIVE.busy) refreshLive(false); if (!S.frames.length) renderOverlay(); } }, 1000);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { BASE_DIRTY = true; });
LASTW = window.innerWidth;
LIVE.mun = {}; LIVE.mkey = {};
GH.on = false;
S.simT = params.get('placar') ? clamp(Math.round(2 * parseFloat(params.get('placar').replace(',', '.'))) / 2 || SIM_DEF, 25, 75) : SIM_DEF;
S.simSeed = +params.get('batalha') || 1 + Math.floor(Math.random() * 9999);
alrInit();
layout();
setMode(params.get('modo') === 'simulacao' ? 'sim' : 'live', !!params.get('modo'));
window.__app = { S, HX, CAM, MUNS, CAPS, UFS, UFN, setMode, setIdx, REC, NAR, TV, composeStory, recStart, recStop, tvToggle, narToggle, buildSimGov, get FRONT() { return FRONT; }, get ARROWS() { return ARROWS; }, UNITS, get PARTS() { return PARTS; }, stopPlay, startPlay };
