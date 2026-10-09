// Coletor das frentes estaduais (2º turno para governador): roda no GitHub Actions ao lado do
// coletor presidencial, lê os arquivos públicos do TSE a cada minuto e grava, no branch "dados",
// um histórico por estado (historico/e006260-{uf}.json) com o placar do estado e os municípios
// que mudaram em cada atualização. É o formato que /batalha/governador/ usa para reconstruir a noite.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const E = String(process.env.ELEICAO || '6260');
const MAXMIN = Number(process.env.MINUTOS || 330);
const DIR = path.resolve(process.env.DADOS_DIR || '../dados');
const DRY = !!process.env.SEM_PUBLICAR;
const UFS = (process.env.UFS || 'ac,am,df,es,rn,to').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const TSE = 'https://resultados.tse.jus.br/oficial/ele2026';
const DAYS = { '6259': '04/10/2026', '6260': '25/10/2026' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const pad6 = e => String(e).padStart(6, '0');
const outOf = uf => path.join(DIR, 'historico', `e${pad6(E)}-${uf}.json`);

async function getJSON(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
      const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'laboratorio-voto-coletor/1.0 (+https://github.com/lucashang07/laboratorio-voto-2026)' } });
      clearTimeout(t);
      if (r.status === 404 || r.status === 403) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { if (i === 2) throw e; await sleep(2000); }
  }
}
// executa tarefas com no máximo n em paralelo
async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; await fn(items[k]); } })); }
function parseU(j) {
  const o = { st: +j.s.st, ts: +j.s.ts, est: +(j.e && j.e.est) || 0, te: +(j.e && j.e.te) || 0, c: {}, cands: [], eleito: null, dt: j.dt || j.dg, ht: j.ht || j.hg };
  const walk = x => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (Array.isArray(x.cand)) x.cand.forEach(c => { o.c[c.n] = +c.vap || 0; o.cands.push({ n: String(c.n), nm: c.nm || '', nmu: c.nmu || '' }); if (c.e === 's' && /^eleit/i.test(c.st || '')) o.eleito = String(c.n); });
    for (const k in x) if (k !== 'cand' && typeof x[k] === 'object') walk(x[k]);
  };
  walk(j.carg);
  return o;
}
function tseMinutes(dt, ht, day) {
  const [d, mo, y] = dt.split('/').map(Number), [h, mi, se] = ht.split(':').map(Number), [d0, mo0, y0] = day.split('/').map(Number);
  return (Date.UTC(y, mo - 1, d, h, mi, se) - Date.UTC(y0, mo0 - 1, d0, 17, 0, 0)) / 60000;
}
const git = cmd => execSync(`git -C "${DIR}" ${cmd}`, { stdio: 'pipe' }).toString();
function publish(msg) {
  if (DRY) return;
  git('add -A');
  try { git(`commit -q -m "${msg.replace(/"/g, '')}"`); } catch (e) { return; }
  for (let i = 0; i < 5; i++) { try { git('push -q origin HEAD:dados'); return; } catch (e) { log('push falhou, tentando de novo'); try { git('pull -q --rebase origin dados'); } catch (e2) {} } }
}

// estado de cada frente
const F = {};
for (const uf of UFS) {
  const out = outOf(uf);
  const hist = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  F[uf] = { hist, mun: {}, key: {}, sent: {}, fullSince: null, done: false };
  if (hist) {
    // reconstrói o último estado conhecido de cada município (para continuar de onde parou)
    for (const s of hist.snaps) if (s[3]) for (const c in s[3]) F[uf].sent[c] = JSON.stringify(s[3][c]);
    const l = hist.snaps.length ? hist.snaps[hist.snaps.length - 1][2] : null;
    if (l && l[0] >= l[1] && hist.eleito) F[uf].done = true;
  }
}
if (UFS.every(uf => F[uf].done)) { log('históricos já completos, nada a fazer'); process.exit(0); }
log(`coletando governador, eleição ${E}, frentes ${UFS.join(', ')}, por até ${MAXMIN} min${DRY ? ' (sem publicar)' : ''}`);

const t0 = Date.now();
while ((Date.now() - t0) / 60000 < MAXMIN) {
  const started = Date.now(), changedUfs = [];
  for (const uf of UFS) {
    const f = F[uf]; if (f.done) continue;
    try {
      const base = `${TSE}/${E}/dados/${uf}`;
      const stJ = await getJSON(`${base}/${uf}-c0003-e${pad6(E)}-u.json`);
      if (!stJ) { log(uf, 'arquivo ainda não publicado pelo TSE'); continue; }
      const st = parseU(stJ);
      if (st.st === 0) { log(uf, 'no ar; apuração ainda não começou'); continue; }
      if (!f.hist) f.hist = { v: 1, e: E, uf, cands: st.cands, snaps: [] };
      const nums = f.hist.cands.map(c => c.n);
      const arr = (x, extra) => [x.st, x.ts, x.est, x.te].concat(nums.map(n => x.c[n] || 0));
      // andamento por município e leitura dos que mudaram
      const ab = await getJSON(`${base}/${uf}-e${pad6(E)}-ab.json`);
      const need = [];
      for (const a of (ab && ab.abr) || []) {
        if (a.tpabr !== 'mun') continue;
        const c = String(+a.cdabr), k = `${a.s && a.s.st}|${a.ht}|${a.dt}`;
        if (+(a.s && a.s.st) > 0 && f.key[c] !== k) need.push([c, a.cdabr, k]);
      }
      let okN = 0;
      await pool(need, 12, async ([c, raw, k]) => {
        try { const j = await getJSON(`${base}/${uf}${String(raw).padStart(5, '0')}-c0003-e${pad6(E)}-u.json`); if (j) { f.mun[c] = arr(parseU(j)); f.key[c] = k; okN++; } }
        catch (e) { log(uf, 'falha no município', c, e.message); }
      });
      // DF: o TSE trata o DF como um único município; se o arquivo municipal não vier, usa o do estado
      if (!ab && uf === 'df') { f.mun['97012'] = arr(st); }
      // registra uma fotografia quando o estado ou algum município mudou
      const delta = {}; let nd = 0;
      for (const c in f.mun) { const s = JSON.stringify(f.mun[c]); if (f.sent[c] !== s) { delta[c] = f.mun[c]; f.sent[c] = s; nd++; } }
      const at = `${st.dt} ${st.ht}`, last = f.hist.snaps[f.hist.snaps.length - 1];
      if (!last || last[1] !== at || nd) {
        const snap = [tseMinutes(st.dt, st.ht, DAYS[E] || st.dt), at, arr(st), nd ? delta : 0];
        if (last && last[1] === at) f.hist.snaps[f.hist.snaps.length - 1] = [last[0], last[1], snap[2], Object.assign({}, last[3] || {}, delta)];
        else f.hist.snaps.push(snap);
        f.hist.atualizado = new Date().toISOString(); f.hist.eleito = st.eleito || null;
        fs.mkdirSync(path.dirname(outOf(uf)), { recursive: true });
        fs.writeFileSync(outOf(uf), JSON.stringify(f.hist));
        changedUfs.push(`${uf} ${(100 * st.st / st.ts).toFixed(1)}%`);
        log(uf, 'registrado', (100 * st.st / st.ts).toFixed(2) + '%', at, '| municípios lidos:', okN, 'de', need.length, '| mudaram:', nd);
      }
      if (st.st >= st.ts) { f.fullSince = f.fullSince || Date.now(); if (st.eleito || Date.now() - f.fullSince > 20 * 60000) { f.done = true; log(uf, 'apuração concluída'); } }
    } catch (e) { log(uf, 'erro na rodada:', e.message); }
  }
  if (changedUfs.length) publish(`governador e${E}: ${changedUfs.join(', ')}`);
  if (UFS.every(uf => F[uf].done)) { log('todas as frentes concluídas; encerrando'); break; }
  const wait = 60000 - (Date.now() - started);
  if (wait > 0) await sleep(wait);
}
log('fim do coletor de governador');
