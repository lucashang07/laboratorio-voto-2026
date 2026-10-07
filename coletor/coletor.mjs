// Coletor da apuração: roda no GitHub Actions, lê os arquivos públicos do TSE a cada minuto
// e grava o histórico da noite no branch "dados" (historico/eXXXXXX.json), no mesmo formato
// que a página /apuracao/ usa para salvar o histórico no aparelho.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const E = String(process.env.ELEICAO || '6258');
const MAXMIN = Number(process.env.MINUTOS || 330);
const DIR = path.resolve(process.env.DADOS_DIR || '../dados');
const OUT = path.join(DIR, 'historico', `e${E.padStart(6, '0')}.json`);
const TSE = 'https://resultados.tse.jus.br/oficial/ele2026';
const DAYS = { '6257': '04/10/2026', '6258': '25/10/2026' };
const UFS = ['ac','al','am','ap','ba','ce','df','es','go','ma','mg','ms','mt','pa','pb','pe','pi','pr','rj','rn','ro','rr','rs','sc','se','sp','to','zz'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const pad6 = e => String(e).padStart(6, '0');

async function getJSON(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
      const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'laboratorio-voto-coletor/1.0 (+https://github.com/lucashang07/laboratorio-voto-2026)' } });
      clearTimeout(t);
      if (r.status === 404 || r.status === 403) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { if (i === 2) throw e; await sleep(3000); }
  }
}
function parseU(j) {
  const o = { st: +j.s.st, ts: +j.s.ts, est: +j.e.est, te: +j.e.te, vv: +j.v.vv, vb: +j.v.vb, vn: +(j.v.tvn || 0), c: {}, eleito: null, dt: j.dt || j.dg, ht: j.ht || j.hg };
  const walk = x => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (Array.isArray(x.cand)) x.cand.forEach(c => { o.c[c.n] = +c.vap || 0; if (c.e === 's' && /^eleit/i.test(c.st || '')) o.eleito = c.n; });
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
  git('add -A');
  try { git(`commit -q -m "${msg.replace(/"/g, '')}"`); } catch (e) { return; }
  for (let i = 0; i < 4; i++) { try { git('push -q origin HEAD:dados'); return; } catch (e) { log('push falhou, tentando de novo'); try { git('pull -q --rebase origin dados'); } catch (e2) {} } }
}

let hist = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
if (hist && hist.snaps.length && hist.eleito) { const l = hist.snaps[hist.snaps.length - 1][2]; if (l[0] >= l[1]) { log('histórico já completo, nada a fazer'); process.exit(0); } }
const cache = {}, keys = {};
const t0 = Date.now(); let fullSince = null;
log(`coletando eleição ${E} por até ${MAXMIN} min; saída: ${OUT}`);
while ((Date.now() - t0) / 60000 < MAXMIN) {
  const started = Date.now();
  try {
    const base = `${TSE}/${E}/dados`;
    const ab = await getJSON(`${base}/br/br-e${pad6(E)}-ab.json`);
    const brJ = await getJSON(`${base}/br/br-c0001-e${pad6(E)}-u.json`);
    if (!brJ) log('arquivo nacional ainda não publicado pelo TSE');
    else {
      const br = parseU(brJ);
      if (br.st === 0) log('arquivos no ar; apuração ainda não começou');
      else {
        const keyOf = u => { const a = ab && (ab.abr || []).find(x => x.cdabr === u); return a ? `${a.s && a.s.st}|${a.ht}|${a.dt}` : null; };
        const need = UFS.filter(u => !cache[u] || keyOf(u) === null || keys[u] !== keyOf(u));
        await Promise.all(need.map(async u => { try { const j = await getJSON(`${base}/${u}/${u}-c0001-e${pad6(E)}-u.json`); if (j) { cache[u] = parseU(j); keys[u] = keyOf(u); } } catch (e) { log('falha', u, e.message); } }));
        if (!hist) { const nums = Object.keys(br.c).sort((a, b) => br.c[b] - br.c[a]); const pref = ['22', '13'].filter(n => nums.includes(n)); hist = { v: 1, e: E, ks: pref.length === 2 ? pref : nums.slice(0, 2), snaps: [] }; }
        const ks = hist.ks;
        const p = x => [x.st, x.ts, x.est, x.te, x.vv].concat(ks.map(k => x.c[k] || 0), [Object.entries(x.c).filter(([k]) => !ks.includes(k)).reduce((a, [, v]) => a + v, 0)]);
        const at = `${br.dt} ${br.ht}`;
        const last = hist.snaps[hist.snaps.length - 1];
        if (!last || last[1] !== at) {
          hist.snaps.push([tseMinutes(br.dt, br.ht, DAYS[E] || br.dt), at, p(br).concat([br.vb, br.vn]), UFS.map(u => cache[u] ? p(cache[u]) : null)]);
          hist.atualizado = new Date().toISOString(); hist.eleito = br.eleito || null;
          fs.mkdirSync(path.dirname(OUT), { recursive: true });
          fs.writeFileSync(OUT, JSON.stringify(hist));
          const pst = (100 * br.st / br.ts).toFixed(2);
          publish(`apuracao e${E}: ${pst}% (${at})`);
          log('registrado', pst + '%', at, '| estados lidos nesta rodada:', need.length);
        } else log('sem mudança desde', at);
        if (br.st >= br.ts) { fullSince = fullSince || Date.now(); if (br.eleito || Date.now() - fullSince > 20 * 60000) { log('apuração concluída; encerrando'); break; } }
      }
    }
  } catch (e) { log('erro na rodada:', e.message); }
  const wait = 60000 - (Date.now() - started);
  if (wait > 0) await sleep(wait);
}
log('fim do coletor');
