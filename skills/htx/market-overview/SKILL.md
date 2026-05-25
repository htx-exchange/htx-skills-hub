---
name: htx-market-overview
version: 1.0.0
description: Full-market HTX scan — top gainers/losers, volume anomalies, breadth metrics, and sector rotation hints derived from spot + futures tickers. Public, no API key required.
auth_required: false
risk_level: none
---

# HTX Market Overview

Layer 2 analytical skill that produces a **dashboard-style snapshot** of the entire HTX market — both spot and USDT-M futures — by aggregating ticker endpoints. Useful for "what's happening" questions where the user hasn't named a specific symbol.

## When to use this skill

- "What's moving in the market right now?"
- "Top gainers / losers in the last 24h"
- "Any abnormal volume spikes today?"
- "Is altseason vibe on?"
- "How many coins are up / down?"
- "Recap of today's market"

If the user asks for a specific symbol, fall through to `htx-spot-market` (price), `htx-technical-analysis` (technical read), or `htx-derivatives-analyst` (futures pressure).

## Underlying tools

| Source | What it provides | Cost |
|--------|------------------|------|
| `@htx-skills/spot-market` | `htx-cli spot market tickers` — all-spot 24h tickers | free |
| `@htx-skills/futures-market` | `htx-cli futures market tickers` — all-futures 24h tickers | free |

If those Layer 1 skills aren't installed:

```bash
npx -y @htx-skills/spot-market install
npx -y @htx-skills/futures-market install
```

## Standard workflow

### Step 1 — Pull both ticker universes

```bash
htx-cli spot market tickers --json     > /tmp/htx_spot_tickers.json
htx-cli futures market tickers --json  > /tmp/htx_futures_tickers.json
```

Each ticker entry contains: `symbol` / `contract_code`, `open`, `close`, `high`, `low`, `vol`, `amount`, `count`. Compute `change_pct = (close - open) / open * 100` client-side.

### Step 2 — Compute aggregates client-side

For each universe (spot, futures):

| Metric | Computation |
|--------|-------------|
| **Top gainers (Top 10)** | sort by `change_pct` desc, take top 10 |
| **Top losers (Top 10)** | sort by `change_pct` asc, take top 10 |
| **Top volume (Top 10)** | sort by `amount` (24h quote-currency volume) desc |
| **Volume anomalies** | symbols where `amount / 7d_avg_amount > 3` (need historical reference; for v1 just flag top decile of vol) |
| **Breadth** | count where `change_pct > 0` vs `< 0` vs `≈ 0` |
| **Strong-move count** | count where `abs(change_pct) > 5` |
| **Median change %** | for "is the market broadly up or down?" |

### Step 3 — Sector / narrative tags (best-effort)

HTX spot symbols don't carry sector tags natively. Two tactics:

1. **Hardcoded buckets** (maintain in `references/sectors.md`):
   - Layer 1: `btc, eth, sol, ada, dot, avax, ...`
   - Layer 2: `op, arb, mantle, ...`
   - AI: `agix, fet, rndr, ocean, tao, ...`
   - DePIN: `hnt, render, akt, ...`
   - Memecoin: `doge, shib, pepe, wif, ...`

2. **External enrichment** (optional): pull CoinGecko `/coins/categories` for fresher tags. Free tier OK.

For each bucket, average the `change_pct` of the top-5 by market cap inside the bucket → sector heat.

## Output structure

```json
{
  "skill": "market-overview",
  "timestamp": "2026-...",
  "universe": "spot+futures",
  "summary": {
    "market_phase": "broad_rally | rotation | broad_drawdown | choppy",
    "median_change_pct": 1.4,
    "breadth_ratio": 1.85,
    "strong_movers_count": 42,
    "one_liner": "Broad rally: 65% up, median +1.4%, AI sector +8% leads, BTC flat"
  },
  "spot": {
    "top_gainers": [
      {"symbol": "xyzusdt", "change_pct": 12.4, "vol": 1.2e6}
    ],
    "top_losers": [...],
    "top_volume": [...],
    "breadth": {"up": 142, "down": 76, "flat": 12, "ratio": 1.87}
  },
  "futures": {
    "top_gainers": [...],
    "top_losers": [...],
    "top_volume": [...]
  },
  "anomalies": [
    {"symbol": "xyzusdt", "type": "volume_spike", "vol_vs_typical": 5.2,
     "note": "Vol 5.2× yesterday; price +18%"}
  ],
  "sectors": [
    {"sector": "AI", "change_pct": 8.4, "leaders": ["agixusdt", "fetusdt"]},
    {"sector": "Layer 2", "change_pct": 2.1, "leaders": ["opusdt"]},
    {"sector": "DePIN", "change_pct": -1.2, "leaders": []}
  ],
  "risk_warning": "Breadth driven by 5 symbols >+50%; broader market only +0.8% — narrow rally."
}
```

### Market phase classification

| Condition | Label |
|-----------|-------|
| `breadth_ratio > 1.5` AND `median_change > 0.5%` | **broad_rally** |
| `breadth_ratio < 0.7` AND `median_change < -0.5%` | **broad_drawdown** |
| `breadth_ratio between 0.7-1.5` AND large divergence between top-bottom | **rotation** |
| `breadth_ratio between 0.7-1.5` AND median ≈ 0 | **choppy** |

## What this skill explicitly does NOT do

- ⚠️ **No native sector taxonomy** — HTX exchange API has no first-class sector field. Sector logic relies on a hardcoded mapping in `references/sectors.md` (or optional CoinGecko enrichment).
- ⚠️ **No new-listing tracker** — would need `htx-cli spot market symbols` diffed across days; not implemented in v1 of this skill.
- ⚠️ **No narrative detection from news/social** — that needs sentiment-analyst + news-briefing (news-briefing not yet built in this hub).

## Output guidance

When the user asks an open-ended "what's happening" question, lead with:

1. **One-liner** (e.g. "Broad rally led by AI sector — 65% of pairs up")
2. **Top 3 stories**: biggest gainer, biggest sector move, biggest volume anomaly
3. **Risk flag** if rally is narrow (top 5 carrying everything) or if breadth diverges from BTC

## Related skills

- `@htx-skills/spot-market`, `@htx-skills/futures-market` — data sources
- `@htx-skills/technical-analysis` — drill-down on a specific symbol after the user picks one from the overview
- `@htx-skills/sentiment-analyst` — frame the overview within a fear/greed context
- `@htx-skills/derivatives-analyst` — for futures rallies, check if they're driven by leverage

## References

- `references/sectors.md` — hardcoded sector → symbol mapping (maintained manually; update quarterly)
