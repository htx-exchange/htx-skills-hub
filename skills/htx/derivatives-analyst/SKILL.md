---
name: htx-derivatives-analyst
version: 1.0.0
description: Multi-signal pressure analysis on HTX USDT-M perpetuals — combines funding rate, OI, elite long/short ratio, recent liquidations, and basis into a unified pressure score with squeeze-risk verdict. Public, no API key required.
auth_required: false
risk_level: none
---

# HTX Derivatives Analyst

Layer 2 analytical skill that **orchestrates 5 atomic Layer 1 skills** into a unified pressure score. Use when the user wants a one-shot read on whether a perpetual is overheated, where the squeeze risk lies, and what the directional bias is.

## When to use this skill

- "How crowded is BTC perpetual right now?"
- "Squeeze risk on ETH-USDT?"
- "Are longs or shorts in trouble on SOL?"
- "Should I open a futures position on BTC right now?"
- "Give me a derivatives pressure read on ETH"
- "Why is the perpetual moving so fast?"

For pure technical analysis on price, prefer `htx-technical-analysis`. For just one signal (e.g. only funding), prefer the focused Layer 1 skill.

## Underlying tools

This skill **does not call REST endpoints directly**. It composes Layer 1 skills:

| Layer 1 skill | What this analyst pulls from it |
|---------------|--------------------------------|
| `@htx-skills/funding-rate` | current rate + 30-period history |
| `@htx-skills/oi-tracker` | current OI + 24h trend |
| `@htx-skills/elite-positioning` | account ratio + position ratio |
| `@htx-skills/liquidation-stream` | recent 7d liquidations |
| `@htx-skills/mark-price` | basis kline (last 20 bars) |

If those skills aren't installed, install them first:

```bash
npx -y @htx-skills/funding-rate install
npx -y @htx-skills/oi-tracker install
npx -y @htx-skills/elite-positioning install
npx -y @htx-skills/liquidation-stream install
npx -y @htx-skills/mark-price install
```

## Standard workflow

For a contract `<code>` (e.g. `BTC-USDT`), execute these in parallel where possible:

```bash
# 1. Funding rate
htx-cli futures market funding-rate <code> --json
htx-cli futures market historical-funding-rate --contract-code <code> --json

# 2. OI snapshot + history
htx-cli futures call GET /linear-swap-api/v1/swap_open_interest -p contract_code=<code> --json
htx-cli futures call GET /linear-swap-ex/market/his_open_interest \
  -p contract_code=<code> -p period=4hour -p size=12 --json

# 3. Elite L/S ratio (both versions)
htx-cli futures call GET /linear-swap-api/v1/swap_elite_account_ratio \
  -p contract_code=<code> -p period=1hour --json
htx-cli futures call GET /linear-swap-api/v1/swap_elite_position_ratio \
  -p contract_code=<code> -p period=1hour --json

# 4. Recent liquidations (7d)
htx-cli futures market liquidation-orders <code> --json

# 5. Basis kline (recent)
htx-cli futures call GET /index/market/history/linear_swap_basis \
  -p contract_code=<code> -p period=60min -p basis_price_type=close -p size=24 --json
```

## Composite pressure score

Score each dimension on **0-100** (higher = more crowded / overheated), then weighted-average:

| Dimension | Weight | Computation |
|-----------|--------|-------------|
| **Funding** | 25% | percentile of current rate vs last 30 periods. >85 pct = score 90+ |
| **OI surge** | 20% | 24h OI Δ%. ≥+15% → score 90; flat → 50; ≥-15% → score 10 |
| **Elite divergence** | 20% | abs(account_ratio − position_ratio) / account_ratio. >0.3 = score 80+ |
| **Liquidation cluster** | 15% | total 24h liq value / 30d avg. >2× → score 85+ |
| **Basis stretch** | 20% | percentile of current basis vs last 24h. extreme tail = high score |

Composite **0-100** → label:

| Score | Label | Interpretation |
|-------|-------|----------------|
| 0-30 | low | Calm; positions may unwind quietly |
| 31-55 | balanced | Healthy two-sided market |
| 56-75 | crowded | One side is concentrated; reversal risk rising |
| 76-100 | extreme | High-probability cleanout incoming |

## Squeeze risk classification

Independent of the overall score, also flag squeeze direction:

| Setup | Verdict |
|-------|---------|
| Funding > 90 pct + elite_account_ratio > 1.5 + recent long-liq surge | **long_squeeze** (price likely capitulates lower) |
| Funding < 10 pct + elite_account_ratio < 0.7 + recent short-liq surge | **short_squeeze** (price likely rips higher) |
| Mixed | `none` |

## Output structure

```json
{
  "skill": "derivatives-analyst",
  "symbol": "BTC-USDT",
  "timestamp": "2026-...",
  "summary": {
    "market_state": "overheated_long | overheated_short | balanced | deleveraging",
    "leverage_risk": "high | medium | low",
    "squeeze_risk": "long_squeeze | short_squeeze | none",
    "signal_strength": 0-100,
    "one_liner": "BTC perp funding 0.045% (95th pct), OI +12% 24h, elite position ratio 0.55 — heavy short capital, squeeze risk rising"
  },
  "components": {
    "funding": {"current": 0.00045, "percentile_30p": 95, "score": 92},
    "oi": {"current": 12_500_000_000, "delta_24h_pct": 12, "trend": "rising", "score": 75},
    "elite": {"account_ratio": 1.85, "position_ratio": 0.55, "divergence": 0.7, "score": 88},
    "liquidations": {"total_24h_usd": 45_000_000, "vs_30d_avg": 2.4, "long_pct": 70, "score": 82},
    "basis": {"current_pct": 0.18, "percentile_24h": 92, "score": 78},
    "composite_score": 82
  },
  "actionable": {
    "suggested_action": "avoid new long positions / consider partial profit-taking on existing longs",
    "trigger_conditions": "if OI keeps climbing without price response, expect violent unwind"
  },
  "risk_warning": "Past pressure regimes have ~65% reversal probability within 48h once score > 80."
}
```

## What this skill explicitly does NOT do

- ⚠️ **No all-market long/short ratio** — HTX only exposes "elite" (top trader) ratios. Retail-vs-elite divergence is not directly observable.
- ⚠️ **No Taker buy/sell volume** — HTX has no dedicated endpoint; would need to derive from trade stream.
- ⚠️ **No liquidation heatmap** — no on-platform data; would require external CoinGlass integration.

These data gaps are documented so the agent can tell the user "we have X confidence" rather than over-claiming.

## Related skills

- `@htx-skills/funding-rate`, `@htx-skills/oi-tracker`, `@htx-skills/elite-positioning`, `@htx-skills/liquidation-stream`, `@htx-skills/mark-price` — data sources
- `@htx-skills/technical-analysis` — pair derivatives pressure with price-action read
- `@htx-skills/sentiment-analyst` — pair derivatives crowdedness with broader sentiment
