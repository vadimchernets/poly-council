# Poly Council: open dataset

Every day nine AI models (US and Chinese: ChatGPT and others) give a forecast for 12 assets (indices, gold, oil, crypto and more) over four horizons: 1 day, 1 week, 1 month, 6 months. The forecasts are sealed (hash plus OpenTimestamps proof) before the session, then scored against what actually happened. This repository is the open copy of that data.

Source: the public feeds of Poly Trends, https://trends.polyhelper.ai/ (`/api/v1/<lang>/council.json`, `/api/v1/<lang>/council-league.json`). No personal data: only model forecasts, prices and aggregated reader votes.

## Layout
- `data/<YYYY-MM-DD>/council.json` : the full issue of that day (forecasts, reasons, sources, seal, quotes).
- `data/<YYYY-MM-DD>/forecasts.csv` and `data/forecasts.csv` (all days): `date, metric, horizon, model, country, forecast, prob_up_pct, exp_pct, actual_pct, correct`.
  - `metric` = asset code; `country` = US or CN (the model's home); `forecast` = buy_strong / buy_dips / hold / trim / sell.
  - `actual_pct` = realised move, `correct` = yes/no for up/down calls (empty for hold or while unresolved).
- `data/league.json` (latest) and `data/<date>/league.csv`: the ranking (direction hit rate, Brier score vs coin 0.25 and vs consensus, stars). Ranked only after 30 resolved forecasts.
- `scripts/export.mjs`: the exporter (Node 18+, no dependencies): `node scripts/export.mjs [lang]`. Updated once a day automatically.

## License and citation
Data: CC BY 4.0 (see `LICENSE`). Cite as in `CITATION.cff`:

> Poly Helper. Poly Council: daily AI market forecasts, seals and scores. https://trends.polyhelper.ai/

## Links
Live site: https://trends.polyhelper.ai/markets/ . App: https://polyhelper.ai/app . This is an information dataset, not investment advice.
