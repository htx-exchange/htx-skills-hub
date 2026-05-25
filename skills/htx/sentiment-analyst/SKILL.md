---
name: htx-sentiment-analyst
version: 1.0.0
description: Market sentiment & crowdedness analysis — combines free Fear & Greed Index, HTX elite long/short ratio, and 24h gainers/losers distribution into a unified mood read. No HTX API key, one free external dependency.
auth_required: false
risk_level: none
---

# HTX Sentiment Analyst

Layer 2 analytical skill that reads market mood from **3 dimensions**: market-wide fear/greed, smart-money positioning, and breadth (gainers vs losers). Calls one free external API (alternative.me) and composes 2 HTX Layer 1 skills.

## When to use this skill

- "What's the market sentiment right now?"
- "Are we in greed territory?"
- "Is BTC positioning crowded?"
- "Is the crowd net long or net short?"
- "Should I be contrarian here?"
- "Sentiment vs price divergence?"

For pure derivatives crowdedness on a specific contract, prefer `htx-derivatives-analyst`. For pure technicals, prefer `htx-technical-analysis`.

## Underlying tools

| Source | What it provides | Cost |
|--------|------------------|------|
| `https://api.alternative.me/fng/` (external) | Crypto Fear & Greed Index (0-100) — daily, free, no key | free |
| `@htx-skills/elite-positioning` | top-trader account + position L/S ratio | free |
| `@htx-skills/spot-market` | 24h gainers/losers via tickers endpoint | free |

If those Layer 1 skills aren't installed:

```bash
npx -y @htx-skills/elite-positioning install
npx -y @htx-skills/spot-market install
```

## Standard workflow

### Step 1 — Fetch Fear & Greed (external)

```bash
curl -s 'https://api.alternative.me/fng/?limit=30' | jq .
```

Returns a 30-day history of values 0–100 with labels:

| Range | Label |
|-------|-------|
| 0-24 | Extreme Fear |
| 25-44 | Fear |
| 45-55 | Neutral |
| 56-74 | Greed |
| 75-100 | Extreme Greed |

### Step 2 — Pull HTX elite positioning (BTC as proxy for the major-coin crowd, plus user-specified symbol)

```bash
htx-cli futures call GET /linear-swap-api/v1/swap_elite_account_ratio \
  -p contract_code=BTC-USDT -p period=4hour --json

htx-cli futures call GET /linear-swap-api/v1/swap_elite_position_ratio \
  -p contract_code=BTC-USDT -p period=4hour --json
```

### Step 3 — Pull breadth from spot tickers

```bash
htx-cli spot market tickers --json
```

Compute client-side:
- count of pairs with `change > +5%` (strong gainers)
- count with `change < -5%` (strong losers)
- gainer_to_loser_ratio
- top 5 gainers, top 5 losers

## Composite sentiment score

Blend three dimensions to a 0-100 score (higher = greedier / more bullish crowd):

| Dimension | Weight | Source |
|-----------|--------|--------|
| **Fear & Greed Index** | 50% | external API (use it directly, 0-100 already) |
| **Elite positioning** | 30% | account ratio: 1.0 → 50; 1.5 → 70; 2.0 → 85; <1.0 inverted |
| **Breadth** | 20% | gainer_to_loser_ratio: 1.0 → 50; 2.0 → 70; 0.5 → 30 |

Weighted average → label using same Fear/Greed buckets.

## Crowdedness interpretation

Cross-reference sentiment with price for divergence signals:

| Sentiment | Price (7d) | Read |
|-----------|-----------|------|
| Extreme Greed | flat / declining | **Distribution** — crowd long but price not following → reversal risk |
| Extreme Fear | flat / rising | **Accumulation** — price holding despite fear → bottom signal |
| Greed | rising | **Trend continuation** — bullish, but watch for exhaustion above 80 |
| Fear | falling | **Capitulation** — bearish but watch for shakeout below 20 |

## Output structure

```json
{
  "skill": "sentiment-analyst",
  "timestamp": "2026-...",
  "summary": {
    "sentiment_score": 0-100,
    "sentiment_label": "Extreme Fear | Fear | Neutral | Greed | Extreme Greed",
    "crowd_direction": "long-leaning | balanced | short-leaning",
    "divergence": "sentiment-price diverging | aligned | none observed",
    "one_liner": "Greed (74), elite account ratio 1.6 long-leaning, 7d gainer/loser 1.8, but BTC price flat — distribution risk"
  },
  "fear_greed": {"value": 74, "label": "Greed", "change_24h": 5, "change_7d": -3},
  "elite_position": {
    "btc_account_ratio": 1.6,
    "btc_position_ratio": 1.4,
    "label": "moderately long-leaning"
  },
  "breadth": {
    "strong_gainers": 35,
    "strong_losers": 19,
    "gainer_loser_ratio": 1.84,
    "top_gainers": ["XYZ +12%", "..."],
    "top_losers": ["...", "..."]
  },
  "risk_warning": "Sentiment > 70 historically precedes 5%+ corrections within 7 days ~40% of the time."
}
```

## What this skill explicitly does NOT do

- ⚠️ **No social media sentiment** (Twitter/X, Reddit, Weibo, Douyin) — HTX has no native endpoint and we're not paying for LunarCrush yet.
- ⚠️ **No KOL monitoring** — same reason.
- ⚠️ **No on-chain whale flow** — needs external paid source (Whale Alert / Nansen).

These gaps are flagged in the output `risk_warning` so users know what's not modeled.

## Related skills

- `@htx-skills/elite-positioning`, `@htx-skills/spot-market` — data sources
- `@htx-skills/derivatives-analyst` — combine with derivatives pressure for fuller picture
- `@htx-skills/market-overview` — uses the same breadth computation in a different framing
