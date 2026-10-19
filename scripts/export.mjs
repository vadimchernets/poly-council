#!/usr/bin/env node
// Poly Council open dataset exporter. Fetches the public feeds, writes dated snapshots and CSV.
// Usage: node scripts/export.mjs [lang=en]   (Node 18+, no dependencies)
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://trends.polyhelper.ai/api/v1';
const HEAD = { 'X-Poly-Client': 'app-v1' };
const lang = process.argv[2] || 'en';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = join(root, 'data');

async function get(name, optional) {
  const r = await fetch(`${BASE}/${lang}/${name}`, { headers: HEAD });
  if (r.status === 404 && optional) return null;
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  return r.json();
}
const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (header, rows) => [header, ...rows].map((r) => r.map(esc).join(',')).join('\n') + '\n';
const dir = (a) => (a === 'buy_strong' || a === 'buy_dips' ? 'up' : a === 'sell' || a === 'trim' ? 'down' : a === 'hold' ? 'flat' : '');

export const FORECAST_HEADER = ['date', 'metric', 'horizon', 'model', 'country', 'forecast', 'prob_up_pct', 'exp_pct', 'actual_pct', 'correct'];

// One row per (asset, horizon, model). "actual" = the asset's realised move for that day/horizon, filled when the
// feed reports it (asset.yesterday); the verdict is only given for up/down calls, "hold" is left empty.
export function forecastRows(c) {
  const rows = [];
  for (const a of c.assets || []) {
    for (const m of a.models || []) {
      for (const [h, p] of Object.entries(m.plan || {})) {
        if (!p || p.missing) continue;
        const y = a.yesterday && a.yesterday[h];
        const actual = y && typeof y.actual_pct === 'number' ? y.actual_pct : null;
        const d = dir(p.action);
        let ok = '';
        if (actual !== null && (d === 'up' || d === 'down')) ok = (d === 'up') === actual > 0 ? 'yes' : 'no';
        rows.push([c.issue, a.code, h, m.name, m.side, p.action, p.prob_up, p.exp_pct, actual, ok]);
      }
    }
  }
  return rows;
}

export function leagueRows(l, date) {
  return (l.models || []).map((m) => [date, m.name, m.side, m.n, m.dir_pct, m.brier, m.consensus_brier, m.stars, m.ranked ?? '']);
}
const LEAGUE_HEADER = ['date', 'model', 'country', 'resolved_n', 'direction_hit_pct', 'brier', 'consensus_brier', 'stars', 'ranked'];

async function main() {
  const council = await get('council.json');
  const league = await get('council-league.json', true);
  const day = council.issue;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) throw new Error('council.json has no issue date');
  const dayDir = join(data, day);
  await mkdir(dayDir, { recursive: true });
  await writeFile(join(dayDir, 'council.json'), JSON.stringify(council, null, 2) + '\n');
  await writeFile(join(dayDir, 'forecasts.csv'), csv(FORECAST_HEADER, forecastRows(council)));
  if (league) {
    await writeFile(join(data, 'league.json'), JSON.stringify(league, null, 2) + '\n');
    await writeFile(join(dayDir, 'league.csv'), csv(LEAGUE_HEADER, leagueRows(league, day)));
  }
  // cumulative CSVs rebuilt from the dated folders
  const days = (await readdir(data, { withFileTypes: true })).filter((e) => e.isDirectory() && /^\d{4}-/.test(e.name)).map((e) => e.name).sort();
  const all = [];
  for (const d of days) {
    try {
      const t = (await readFile(join(data, d, 'forecasts.csv'), 'utf8')).split('\n').slice(1).filter(Boolean);
      all.push(...t);
    } catch {}
  }
  await writeFile(join(data, 'forecasts.csv'), FORECAST_HEADER.join(',') + '\n' + all.join('\n') + (all.length ? '\n' : ''));
  console.log(`ok ${day}: ${forecastRows(council).length} forecasts, league ${league ? 'yes' : 'not yet (404)'}, days ${days.length}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
