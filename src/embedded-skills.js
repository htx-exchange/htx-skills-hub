// AUTO-GENERATED — do not edit. Run: node scripts/build.js --codegen-only
export const SKILLS = {
  "derivatives-analyst/SKILL.md": `---
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

For pure technical analysis on price, prefer \`htx-technical-analysis\`. For just one signal (e.g. only funding), prefer the focused Layer 1 skill.

## Underlying tools

This skill **does not call REST endpoints directly**. It composes Layer 1 skills:

| Layer 1 skill | What this analyst pulls from it |
|---------------|--------------------------------|
| \`@htx-skills/funding-rate\` | current rate + 30-period history |
| \`@htx-skills/oi-tracker\` | current OI + 24h trend |
| \`@htx-skills/elite-positioning\` | account ratio + position ratio |
| \`@htx-skills/liquidation-stream\` | recent 7d liquidations |
| \`@htx-skills/mark-price\` | basis kline (last 20 bars) |

If those skills aren't installed, install them first:

\`\`\`bash
npx -y @htx-skills/funding-rate install
npx -y @htx-skills/oi-tracker install
npx -y @htx-skills/elite-positioning install
npx -y @htx-skills/liquidation-stream install
npx -y @htx-skills/mark-price install
\`\`\`

## Standard workflow

For a contract \`<code>\` (e.g. \`BTC-USDT\`), execute these in parallel where possible:

\`\`\`bash
# 1. Funding rate
htx-cli futures market funding-rate <code> --json
htx-cli futures market historical-funding-rate --contract-code <code> --json

# 2. OI snapshot + history
htx-cli futures call GET /linear-swap-api/v1/swap_open_interest -p contract_code=<code> --json
htx-cli futures call GET /linear-swap-ex/market/his_open_interest \\
  -p contract_code=<code> -p period=4hour -p size=12 --json

# 3. Elite L/S ratio (both versions)
htx-cli futures call GET /linear-swap-api/v1/swap_elite_account_ratio \\
  -p contract_code=<code> -p period=1hour --json
htx-cli futures call GET /linear-swap-api/v1/swap_elite_position_ratio \\
  -p contract_code=<code> -p period=1hour --json

# 4. Recent liquidations (7d)
htx-cli futures market liquidation-orders <code> --json

# 5. Basis kline (recent)
htx-cli futures call GET /index/market/history/linear_swap_basis \\
  -p contract_code=<code> -p period=60min -p basis_price_type=close -p size=24 --json
\`\`\`

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
| Mixed | \`none\` |

## Output structure

\`\`\`json
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
\`\`\`

## What this skill explicitly does NOT do

- ⚠️ **No all-market long/short ratio** — HTX only exposes "elite" (top trader) ratios. Retail-vs-elite divergence is not directly observable.
- ⚠️ **No Taker buy/sell volume** — HTX has no dedicated endpoint; would need to derive from trade stream.
- ⚠️ **No liquidation heatmap** — no on-platform data; would require external CoinGlass integration.

These data gaps are documented so the agent can tell the user "we have X confidence" rather than over-claiming.

## Related skills

- \`@htx-skills/funding-rate\`, \`@htx-skills/oi-tracker\`, \`@htx-skills/elite-positioning\`, \`@htx-skills/liquidation-stream\`, \`@htx-skills/mark-price\` — data sources
- \`@htx-skills/technical-analysis\` — pair derivatives pressure with price-action read
- \`@htx-skills/sentiment-analyst\` — pair derivatives crowdedness with broader sentiment
`,
  "elite-positioning/README.md": `# @htx-skills/elite-positioning

HTX (Huobi) **top-trader long/short ratio** skill for Claude Code. Distinguishes smart-money signals from retail crowd via dual-mode (account-based + position-based) ratios.

- 2 endpoints, all **public** (no API key)
- Risk: **none**

## Install

\`\`\`bash
npx -y @htx-skills/elite-positioning install
\`\`\`

Target: \`~/.claude/skills/htx/elite-positioning/\`.

## Prerequisites

1. **Node.js ≥ 18**
2. **\`htx-cli\`** on \`\$PATH\`

## Verify

In Claude Code:

> "Are top traders net long or short on BTC right now?"

## Endpoints covered

| Endpoint | Description |
|----------|-------------|
| \`swap_elite_account_ratio\` | Account-count L/S ratio (breadth) |
| \`swap_elite_position_ratio\` | Position-size L/S ratio (capital weight) |

## Related skills

- \`@htx-skills/funding-rate\`
- \`@htx-skills/oi-tracker\`
- \`@htx-skills/sentiment-analyst\`

## License

MIT.
`,
  "elite-positioning/SKILL.md": `---
name: htx-elite-positioning
version: 1.0.0
description: Top-trader long/short ratio on HTX USDT-M perpetuals — both account-based and position-based ratios, the core sentiment signal that distinguishes "smart money" from retail. Public, no API key.
auth_required: false
risk_level: none
---

# HTX Elite Positioning

Focused skill for **elite (top-trader) long/short ratio** on HTX USDT-M perpetuals. Distinguishes signals from sophisticated traders vs. retail crowd. Public — agent may call freely.

## When to use this skill

Load this skill when the user asks about:

- "Are top traders long or short on BTC?"
- "Smart money positioning on ETH"
- "Top-trader long/short ratio for SOL"
- "Is the elite cohort crowded long?"
- "Compare account vs position ratio for BTC perpetual"
- "Which side are the whales on?"

For **retail / market-wide** ratio, HTX does not currently expose a non-elite long/short endpoint — that's a data gap. Document this in your reply if the user asks for it.

## Underlying tool

Drives \`htx-cli\`. Binary on \`\$PATH\` or \`\$HTX_CLI_BIN\`. Always pass \`--json\`.

## Endpoint catalog (2)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | \`/linear-swap-api/v1/swap_elite_account_ratio\` | \`htx-cli futures call GET /linear-swap-api/v1/swap_elite_account_ratio --query contract_code=<code>&period=<period> --json\` | Top-trader **account-count** long/short ratio (1 trader = 1 vote) |
| 2 | GET | \`/linear-swap-api/v1/swap_elite_position_ratio\` | \`htx-cli futures call GET /linear-swap-api/v1/swap_elite_position_ratio --query contract_code=<code>&period=<period> --json\` | Top-trader **position-size** long/short ratio (size-weighted) |

## Why two ratios?

The two ratios answer different questions:

| Ratio | Question | Strength |
|-------|----------|----------|
| **Account ratio** | How many top traders are net long vs short? | Reflects breadth of conviction |
| **Position ratio** | How much capital is net long vs short? | Reflects size-weighted exposure |

**Divergence is informative**: e.g. account ratio 1.2 (slight long majority) but position ratio 0.6 (heavy short capital) → a few top traders are very heavily short.

## Period values

Both endpoints accept \`period\`:
- \`5min\`, \`15min\`, \`30min\`, \`60min\`, \`4hour\`, \`12hour\`, \`1day\`

Returns a time series, typically last 48 data points.

## Contract code format

USDT-M perpetual codes follow \`<BASE>-USDT\` (e.g. \`BTC-USDT\`).

## Typical queries → CLI

| User question | CLI command |
|---------------|-------------|
| "BTC top-trader long/short by account" | \`htx-cli futures call GET /linear-swap-api/v1/swap_elite_account_ratio --query contract_code=BTC-USDT&period=1hour --json\` |
| "ETH top-trader L/S by position size" | \`htx-cli futures call GET /linear-swap-api/v1/swap_elite_position_ratio --query contract_code=ETH-USDT&period=4hour --json\` |
| "Is smart money crowded long on SOL?" | Both endpoints + interpret divergence |

## Output guidance

Return both ratios when relevant. Compute and label:

| Ratio range | Label |
|-------------|-------|
| \`> 2.0\` | Heavily long (extreme) |
| \`1.3 – 2.0\` | Long-leaning |
| \`0.77 – 1.3\` | Balanced |
| \`0.5 – 0.77\` | Short-leaning |
| \`< 0.5\` | Heavily short (extreme) |

(Ratios are symmetric on log scale — \`2.0\` and \`0.5\` are equally extreme.)

Always show:
- Current value of both ratios
- Direction of change vs. prior period (rising / falling)
- **Divergence flag** if account ratio and position ratio disagree by > 30%

## Important caveat

- HTX defines "elite" as the top tier of traders by performance/volume on the platform, not "VIP" tier
- The exact constituency is determined by HTX (not user-configurable)
- Elite ratio is **HTX-only** — do not compare 1-to-1 with other exchanges' "top trader" ratios

## Related skills

- \`@htx-skills/funding-rate\` — combine with funding for crowdedness picture
- \`@htx-skills/oi-tracker\` — combine with OI for new positioning vs. unwinding
- \`@htx-skills/sentiment-analyst\` — *(planned Layer 2)* uses elite ratio as a sentiment input
`,
  "elite-positioning/package.json": `{
  "name": "@htx-skills/elite-positioning",
  "version": "1.0.0",
  "description": "HTX USDT-M perpetual elite (top-trader) long/short ratio skill — both account-based and position-based, the core smart-money sentiment signal.",
  "bin": {
    "htx-skills-elite-positioning": "bin/install.js"
  },
  "files": [
    "bin/",
    "references/",
    "SKILL.md",
    "README.md",
    "LICENSE.md"
  ],
  "keywords": [
    "htx",
    "huobi",
    "claude",
    "claude-code",
    "skill",
    "futures",
    "long-short-ratio",
    "smart-money",
    "perpetual"
  ],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
`,
  "funding-rate/README.md": `# @htx-skills/funding-rate

HTX (Huobi) **USDT-M perpetual funding rate** skill for Claude Code. Current rate, batch all-contract rates, historical series, and estimated next-period rate kline.

- 4 endpoints, all **public** (no API key)
- Risk: **none**

## Install

\`\`\`bash
npx -y @htx-skills/funding-rate install
\`\`\`

Target: \`~/.claude/skills/htx/funding-rate/\`.

### Custom directory / force / uninstall

\`\`\`bash
npx -y @htx-skills/funding-rate install --dest /path/to/skills
npx -y @htx-skills/funding-rate install --force
npx -y @htx-skills/funding-rate uninstall
npx -y @htx-skills/funding-rate path
\`\`\`

Resolution order: \`--dest\` → \`\$CLAUDE_SKILLS_DIR\` → \`\$XDG_DATA_HOME/claude/skills\` → \`~/.claude/skills\`.

## Prerequisites

1. **Node.js ≥ 18**
2. **\`htx-cli\`** on \`\$PATH\`

## Verify

In Claude Code:

> "What's BTC's perpetual funding rate right now?"

Claude runs:

\`\`\`bash
htx-cli futures market funding-rate BTC-USDT --json
\`\`\`

## Endpoints covered

| Endpoint | Description |
|----------|-------------|
| \`swap_funding_rate\` | Current rate (single contract) |
| \`swap_batch_funding_rate\` | All-contracts snapshot |
| \`swap_historical_funding_rate\` | Historical series |
| \`market/history/estimated_rate_kline\` | Estimated next-period kline |

## Related skills

- \`@htx-skills/oi-tracker\` — open interest current + history
- \`@htx-skills/elite-positioning\` — top-trader long/short ratio
- \`@htx-skills/derivatives-analyst\` — multi-signal pressure scoring
- \`@htx-skills/futures-market\` — general futures market data

## License

MIT.
`,
  "funding-rate/SKILL.md": `---
name: htx/funding-rate
version: 2.0.0
description: HTX USDT-M perpetual funding rate — current / market-wide batch / history / estimated next-period klines.
auth: false
risk: low
---

# Funding Rate

Monitor HTX USDT-M perpetual funding rate. **No API key required**.

Funding rate settles every 8 hours (UTC 0:00 / 8:00 / 16:00). **Positive rate** means longs pay shorts; **negative rate** means shorts pay longs. Useful for:
- Arbitrage (short perpetual + spot long hedge when rate is positive)
- Sentiment signal (extreme positive rate = longs overheated, potential squeeze)
- Position cost estimation

## When to use

- Query the current funding rate of a single contract
- Market-wide scan to find contracts with abnormal funding rates
- Pull historical funding rate series for trend analysis
- Estimate the next-period funding rate trend (kline form)

## Quick start

\`\`\`bash
# BTC perpetual current funding rate
htx-cli funding-rate current -p contract_code=BTC-USDT

# All perpetual funding rates market-wide
htx-cli funding-rate batch

# BTC historical funding rate (last 30 periods = 10 days)
htx-cli funding-rate history -p contract_code=BTC-USDT -p page_size=30
\`\`\`

## Available commands (4 endpoints)

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| \`current\` | \`GET /linear-swap-api/v1/swap_funding_rate\` | Single-contract current rate + next settlement time |
| \`batch\` | \`GET /linear-swap-api/v1/swap_batch_funding_rate\` | Batch funding rates for all contracts market-wide |
| \`history\` | \`GET /linear-swap-api/v1/swap_historical_funding_rate\` | Historical funding rate series (paginated) |
| \`estimated-kline\` | \`GET /linear-swap-ex/market/history/funding_rate\` | Estimated next-period funding rate kline |

## Parameter reference

- \`contract_code\` — \`BTC-USDT\` / \`ETH-USDT\` / \`SOL-USDT\` etc.
- \`page_index\` — page number, starting from 1
- \`page_size\` — records per page, max 50
- \`period\` — kline period (used by \`estimated-kline\`): \`1min\` \`5min\` \`15min\` \`30min\` \`60min\` \`4hour\` \`1day\`
- \`size\` — number of klines, 1-2000

## Typical scenarios

**"What is the current funding rate of BTC perpetual?"**
\`\`\`bash
htx-cli funding-rate current -p contract_code=BTC-USDT
# Returns funding_rate (current period) + estimated_rate (estimated next period) + next_funding_time
\`\`\`

**"Which coins have negative funding rates? (Get paid for going long?)"**
\`\`\`bash
htx-cli funding-rate batch
# AI Agent filters contracts where funding_rate < 0
\`\`\`

**"BTC funding rate trend over the last 7 days"**
\`\`\`bash
# 7 days = 21 periods
htx-cli funding-rate history -p contract_code=BTC-USDT -p page_size=21
# Array sorted by time descending
\`\`\`

**"Top 5 hottest (highest funding rate) perpetuals market-wide"**
\`\`\`bash
htx-cli funding-rate batch
# Sort descending by funding_rate, take top 5
\`\`\`

## Output schema excerpt

\`current\` returns:
\`\`\`json
{
  "status": "ok",
  "data": {
    "contract_code": "BTC-USDT",
    "fee_asset": "USDT",
    "funding_time": "1712345600000",
    "funding_rate": "0.00012500",
    "estimated_rate": "0.00009800",
    "settlement_time": "1712376000000",
    "next_funding_time": "1712376000000"
  }
}
\`\`\`

## Interpretation guidance

| funding_rate range | Meaning |
|--------------------|---------|
| > 0.0005 (0.05%) | Longs overheated; watch for pullback |
| 0.0001 ~ 0.0005 | Bullish-leaning |
| -0.0001 ~ 0.0001 | Neutral |
| < -0.0001 | Bearish-leaning |
| < -0.0005 | Shorts overheated; potential rebound |

> Note: judgment must be combined with spot/derivatives spread, OI changes, etc. A single indicator is not enough.

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install funding-rate
\`\`\`
`,
  "funding-rate/package.json": `{
  "name": "@htx-skills/funding-rate",
  "version": "1.0.0",
  "description": "HTX USDT-M perpetual funding rate skill — current rate, batch all-contract rates, historical series, estimated rate kline. Public, no API key.",
  "bin": {
    "htx-skills-funding-rate": "bin/install.js"
  },
  "files": [
    "bin/",
    "references/",
    "SKILL.md",
    "README.md",
    "LICENSE.md"
  ],
  "keywords": [
    "htx",
    "huobi",
    "claude",
    "claude-code",
    "skill",
    "futures",
    "usdt-m",
    "funding-rate",
    "perpetual"
  ],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
`,
  "futures-account/SKILL.md": `---
name: htx/futures-account
version: 2.0.0
description: HTX USDT-M perpetual futures account — balance / positions / leverage tiers / adjustment factors / unified account type switching.
auth: true
risk: medium
---

# Futures Account

Query USDT-M perpetual futures account and positions, including leverage tiers, adjustment factors, unified account switching, and other reference data. Read permission is enough for 26 of 30 endpoints. Transfers (4) need write.

## Endpoint catalog (30)

All paths in this skill have base \`/linear-swap-api\` unless noted. "Mode" column: \`I\` = isolated, \`C\` = cross, \`*\` = either.

### Account & position query — read (8)

| # | Method | Path | CLI invocation | Mode |
|---|--------|------|----------------|------|
| 1 | POST | \`/v1/swap_account_info\` | \`htx-cli futures call /v1/swap_account_info --auth -p contract_code=BTC-USDT\` | I |
| 2 | POST | \`/v1/swap_cross_account_info\` | \`htx-cli futures call /v1/swap_cross_account_info --auth -p margin_account=USDT\` | C |
| 3 | POST | \`/v1/swap_position_info\` | \`htx-cli futures call /v1/swap_position_info --auth -p contract_code=BTC-USDT\` | I |
| 4 | POST | \`/v1/swap_cross_position_info\` | \`htx-cli futures call /v1/swap_cross_position_info --auth -p contract_code=BTC-USDT\` | C |
| 5 | POST | \`/v1/swap_account_position_info\` | \`htx-cli futures call /v1/swap_account_position_info --auth\` | I |
| 6 | POST | \`/v1/swap_cross_account_position_info\` | \`htx-cli futures call /v1/swap_cross_account_position_info --auth\` | C |
| 7 | POST | \`/v1/swap_position_limit\` | \`htx-cli futures call /v1/swap_position_limit --auth\` | I |
| 8 | POST | \`/v1/swap_cross_position_limit\` | \`htx-cli futures call /v1/swap_cross_position_limit --auth\` | C |

### Tier-margin & risk — read (6)

| # | Method | Path | CLI invocation | Mode |
|---|--------|------|----------------|------|
| 9 | GET | \`/v1/swap_adjustfactor\` | \`htx-cli futures call /v1/swap_adjustfactor --method GET -p contract_code=BTC-USDT\` | I |
| 10 | GET | \`/v1/swap_cross_adjustfactor\` | \`htx-cli futures call /v1/swap_cross_adjustfactor --method GET -p contract_code=BTC-USDT\` | C |
| 11 | GET | \`/v1/swap_ladder_margin\` | \`htx-cli futures call /v1/swap_ladder_margin --method GET -p contract_code=BTC-USDT\` | I |
| 12 | GET | \`/v1/swap_cross_ladder_margin\` | \`htx-cli futures call /v1/swap_cross_ladder_margin --method GET -p margin_account=USDT\` | C |
| 13 | POST | \`/v1/swap_available_level_rate\` | \`htx-cli futures call /v1/swap_available_level_rate --auth -p contract_code=BTC-USDT\` | * |
| 14 | POST | \`/v1/swap_user_settlement_records\` | \`htx-cli futures call /v1/swap_user_settlement_records --auth\` | * |

### Financial records — read (8)

| # | Method | Path | CLI invocation |
|---|--------|------|----------------|
| 15 | POST | \`/v1/swap_financial_record\` | \`htx-cli futures call /v1/swap_financial_record --auth -p mar_acct=BTC-USDT\` |
| 16 | POST | \`/v1/swap_financial_record_exact\` | \`htx-cli futures call /v1/swap_financial_record_exact --auth -p contract=BTC-USDT\` |
| 17 | POST | \`/v3/swap_financial_record_exact\` | \`htx-cli futures call /v3/swap_financial_record_exact --auth -p contract=BTC-USDT\` |
| 18 | POST | \`/v1/swap_user_fee\` | \`htx-cli futures call /v1/swap_user_fee --auth -p contract_code=BTC-USDT\` |
| 19 | POST | \`/v1/swap_funding_record\` | \`htx-cli futures call /v1/swap_funding_record --auth\` |
| 20 | POST | \`/v1/swap_api_trading_status\` | \`htx-cli futures call /v1/swap_api_trading_status --auth\` |
| 21 | POST | \`/v1/swap_position_mode\` | \`htx-cli futures call /v1/swap_position_mode --auth -p margin_account=USDT\` |
| 22 | POST | \`/v1/swap_master_sub_transfer_record\` | \`htx-cli futures call /v1/swap_master_sub_transfer_record --auth\` |

### Unified account toggle — read + write (4)

| # | Method | Path | Description |
|---|--------|------|-------------|
| 23 | POST | \`/v3/unified_account_info\` | Unified account aggregated info (read) |
| 24 | POST | \`/v3/swap_switch_account_type\` | Switch account type (single → cross-margin → unified) — write |
| 25 | POST | \`/v3/unified_account_switch_status\` | Query switch status |
| 26 | POST | \`/v3/swap_switch_position_mode\` | Switch position mode (one-way ↔ hedge) — write |

### Master ↔ sub transfer — write (4)

| # | Method | Path |
|---|--------|------|
| 27 | POST | \`/v1/swap_master_sub_transfer\` |
| 28 | POST | \`/v1/swap_sub_auth\` |
| 29 | POST | \`/v1/swap_sub_account_info_list\` |
| 30 | POST | \`/v1/swap_sub_account_info\` |

## Workflow patterns

### Query cross-margin account + position overview

\`\`\`bash
htx-cli futures call /v1/swap_cross_account_info --auth -p margin_account=USDT --json
htx-cli futures call /v1/swap_cross_account_position_info --auth --json
\`\`\`

### Query isolated BTC-USDT position

\`\`\`bash
htx-cli futures call /v1/swap_position_info --auth -p contract_code=BTC-USDT --json
\`\`\`

### Query BTC-USDT leverage tiers

\`\`\`bash
htx-cli futures call /v1/swap_ladder_margin --method GET -p contract_code=BTC-USDT --json
\`\`\`

## Safety

- Switching account type / switching position mode / master-sub transfers are all **write operations**. The AI Agent must first show the user the current state and target state, and only execute after explicit manual confirmation.
- Before switching, you need to check that there are no positions or open orders (the system will validate, but informing the user up front is friendlier).

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install futures-account
\`\`\`
`,
  "futures-market/SKILL.md": `---
name: htx/futures-market
version: 2.0.0
description: HTX USDT-M perpetual futures core market data — contract info / klines / ticker / order book / index price / system status.
auth: false
risk: low
---

# Futures Market

Read public market data for HTX USDT-M perpetual futures. **No API key required**.

> Specialized data such as funding rate, open interest, liquidations, mark price / basis has been split into dedicated skills. This skill only covers general market data.

## When to use

- Query perpetual real-time price, 24h statistics, index price
- Pull klines (standard klines, not mark price / premium index)
- View order book depth
- Check contract metadata (contract size, precision, listing status)
- Check exchange system status

## Quick start

\`\`\`bash
# BTC perpetual latest market data
htx-cli futures-market detail-merged -p contract_code=BTC-USDT

# ETH perpetual 1h klines
htx-cli futures-market kline -p contract_code=ETH-USDT -p period=60min -p size=200

# All perpetual contract info
htx-cli futures-market contract-info
\`\`\`

## Available commands (15 endpoints)

### Market data

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| \`detail-merged\` | \`GET /linear-swap-ex/market/detail/merged\` | Single-contract real-time summary |
| \`detail-batch-merged\` | \`GET /linear-swap-ex/market/detail/batch_merged\` | Batch real-time summary across contracts |
| \`kline\` | \`GET /linear-swap-ex/market/history/kline\` | Historical klines |
| \`depth\` | \`GET /linear-swap-ex/market/depth\` | Order book depth |
| \`bbo\` | \`GET /linear-swap-ex/market/bbo\` | Best bid/offer |
| \`trade\` | \`GET /linear-swap-ex/market/trade\` | Latest single trade |
| \`history-trade\` | \`GET /linear-swap-ex/market/history/trade\` | Historical trades |

### Index and fair-value prices

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| \`index-price\` | \`GET /linear-swap-api/v1/swap_index\` | Real-time index price |

> For mark price / premium index / basis klines, use \`htx/mark-price\`

### Metadata

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| \`contract-info\` | \`GET /linear-swap-api/v1/swap_contract_info\` | Contract metadata |
| \`query-elements\` | \`GET /linear-swap-api/v1/swap_query_elements\` | Contract elements (precision, size) |
| \`risk-info\` | \`GET /linear-swap-api/v1/swap_risk_info\` | Platform risk reserve fund |
| \`funding-rate-cap\` | \`GET /linear-swap-api/v1/swap_funding_rate_cap_info\` | Funding rate upper/lower bounds |

### System status

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| \`timestamp\` | \`GET /api/v1/timestamp\` | Server time |
| \`heartbeat\` | \`GET /heartbeat/\` | System heartbeat and status |
| \`transfer-state\` | \`GET /linear-swap-api/v1/swap_transfer_state\` | Transfer switch state |

## Parameter reference

- \`contract_code\` — Contract code, uppercase with hyphen, e.g. \`BTC-USDT\` / \`ETH-USDT\` / \`SOL-USDT\`
- \`period\` — \`1min\` \`5min\` \`15min\` \`30min\` \`60min\` \`4hour\` \`1day\` \`1week\` \`1mon\`
- \`size\` — Number of klines returned, 1-2000
- \`type\` — Order book aggregation: \`step0\` to \`step19\`
- \`business_type\` — \`swap\` (USDT perpetual) / \`futures\` (delivery) / \`all\`

## Typical scenarios

**"What is the premium of the BTC perpetual over spot?"**
\`\`\`bash
# Perpetual latest price
htx-cli futures-market detail-merged -p contract_code=BTC-USDT
# Spot latest price
htx-cli spot-market market-detail-merged -p symbol=btcusdt
# AI Agent compares the two to compute the premium percentage
\`\`\`

**"Top coins by ETH perpetual 24h turnover"**
\`\`\`bash
htx-cli futures-market detail-batch-merged -p business_type=swap
# Parse and sort by the vol field
\`\`\`

**"What is the contract size of the BTC perpetual?"**
\`\`\`bash
htx-cli futures-market contract-info -p contract_code=BTC-USDT
# contract_size field: BTC-USDT = 0.001 BTC per contract
\`\`\`

## Notes

- This skill only covers **general market data**. For specialized data, use the dedicated skill:
  - Funding rate → \`htx/funding-rate\`
  - Open interest → \`htx/oi-tracker\`
  - Long/short ratio → \`htx/elite-positioning\`
  - Liquidation orders → \`htx/liquidation-stream\`
  - Mark price / basis → \`htx/mark-price\`
  - Settlement / insurance fund → \`htx/settlement\`
- For write operations (order placement, leverage change), use \`htx/futures-trading\`
- For account queries, use \`htx/futures-account\`

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install futures-market
\`\`\`

## Related docs

- HTX perpetual futures API: https://huobiapi.github.io/docs/usdt_swap/v1/cn/
`,
  "futures-trading/SKILL.md": `---
name: htx/futures-trading
version: 2.0.0
description: HTX USDT-M perpetual futures order management — open / close / TP/SL / trigger orders / modify / cancel.
auth: true
risk: high
---

# Futures Trading

Place, cancel, modify orders, set TP/SL and trigger orders, and close positions on USDT-M perpetual futures.

> WARNING: **Extremely high-risk write skill**. Perpetual futures use leverage; an erroneous order can cause rapid loss or liquidation. Every action must require manual confirmation before execution.

## Authentication and permissions

- API Key needs **futures-trade** permission
- Some query endpoints only need **futures-read** permission

## Endpoint overview (grouped by function, ~50 endpoints)

> Path base \`/linear-swap-api\`. \`cross_\` prefix = cross-margin; no prefix = isolated.

### 1. Place order — write

| Method | Path | Description |
|--------|------|-------------|
| POST | \`/v1/swap_order\` | Isolated single order |
| POST | \`/v1/swap_cross_order\` | Cross-margin single order |
| POST | \`/v1/swap_batchorder\` | Isolated batch orders (max 10) |
| POST | \`/v1/swap_cross_batchorder\` | Cross-margin batch orders |

### 2. Cancel — write

| Method | Path | Description |
|--------|------|-------------|
| POST | \`/v1/swap_cancel\` | Isolated single cancel |
| POST | \`/v1/swap_cross_cancel\` | Cross-margin single cancel |
| POST | \`/v1/swap_cancelall\` | Isolated cancel all |
| POST | \`/v1/swap_cross_cancelall\` | Cross-margin cancel all |

### 3. Modify — write

| Method | Path |
|--------|------|
| POST | \`/v1/swap_switch_lever_rate\` (change leverage) |
| POST | \`/v1/swap_cross_switch_lever_rate\` |

### 4. TP/SL / trailing stop — write

| Method | Path | Description |
|--------|------|-------------|
| POST | \`/v1/swap_tpsl_order\` | Isolated TP/SL |
| POST | \`/v1/swap_cross_tpsl_order\` | Cross-margin TP/SL |
| POST | \`/v1/swap_tpsl_cancel\` | Cancel TP/SL |
| POST | \`/v1/swap_cross_tpsl_cancel\` | Cancel cross-margin TP/SL |
| POST | \`/v1/swap_track_order\` | Trailing stop order |
| POST | \`/v1/swap_cross_track_order\` | Cross-margin trailing stop |

### 5. Trigger orders — write

| Method | Path |
|--------|------|
| POST | \`/v1/swap_trigger_order\` |
| POST | \`/v1/swap_cross_trigger_order\` |
| POST | \`/v1/swap_trigger_cancel\` |
| POST | \`/v1/swap_cross_trigger_cancel\` |
| POST | \`/v1/swap_trigger_cancelall\` |
| POST | \`/v1/swap_cross_trigger_cancelall\` |

### 6. Lightning close — write

| Method | Path | Description |
|--------|------|-------------|
| POST | \`/v1/swap_lightning_close_position\` | Isolated lightning close |
| POST | \`/v1/swap_cross_lightning_close_position\` | Cross-margin lightning close |

### 7. Order query (read)

| Method | Path |
|--------|------|
| POST | \`/v1/swap_openorders\` (isolated open orders) |
| POST | \`/v1/swap_cross_openorders\` (cross-margin open orders) |
| POST | \`/v1/swap_order_info\` (single order info) |
| POST | \`/v1/swap_cross_order_info\` |
| POST | \`/v1/swap_order_detail\` (order detail) |
| POST | \`/v1/swap_cross_order_detail\` |
| POST | \`/v1/swap_hisorders\` (historical orders) |
| POST | \`/v1/swap_cross_hisorders\` |
| POST | \`/v1/swap_matchresults\` (trade detail) |
| POST | \`/v1/swap_cross_matchresults\` |
| POST | \`/v1/swap_hisorders_exact\` (exact query) |
| POST | \`/v1/swap_cross_hisorders_exact\` |
| POST | \`/v3/swap_hisorders_exact\` |
| POST | \`/v3/swap_cross_hisorders_exact\` |
| POST | \`/v3/swap_matchresults_exact\` |
| POST | \`/v3/swap_cross_matchresults_exact\` |
| POST | \`/v1/swap_tpsl_openorders\` |
| POST | \`/v1/swap_cross_tpsl_openorders\` |
| POST | \`/v1/swap_tpsl_hisorders\` |
| POST | \`/v1/swap_cross_tpsl_hisorders\` |
| POST | \`/v1/swap_relation_tpsl_order\` |

## Order parameters (core)

\`\`\`json
{
  "contract_code": "BTC-USDT",
  "direction": "buy | sell",
  "offset": "open | close",
  "lever_rate": 10,
  "order_price_type": "limit | post_only | optimal_5 | optimal_10 | optimal_20 | ioc | fok | opponent | lightning",
  "price": "65000",
  "volume": 1,
  "client_order_id": <int64 optional>,
  "tp_trigger_price": "70000",  
  "tp_order_price": "70100",
  "sl_trigger_price": "62000",
  "sl_order_price": "61900"
}
\`\`\`

- \`direction + offset\` combinations:
  - \`buy + open\` = open long
  - \`sell + open\` = open short
  - \`buy + close\` = close short
  - \`sell + close\` = close long
- \`volume\` unit: **contracts** (\`BTC-USDT\` 1 contract = 0.001 BTC; check \`contract_size\`)

## Workflow patterns

### Cross-margin BTC perpetual 10x open long 0.1 BTC

\`\`\`bash
# 1. First check contract_size: BTC-USDT = 0.001 BTC per contract
htx-cli futures-market contract-info -p contract_code=BTC-USDT
# 0.1 BTC = 100 contracts

# 2. Place order (open long)
htx-cli futures call /v1/swap_cross_order --auth \\
  --body '{
    "contract_code": "BTC-USDT",
    "direction": "buy",
    "offset": "open",
    "lever_rate": 10,
    "order_price_type": "optimal_5",
    "volume": 100
  }' --json
\`\`\`

### Place TP and SL together (cross-margin)

\`\`\`bash
htx-cli futures call /v1/swap_cross_tpsl_order --auth \\
  --body '{
    "contract_code": "BTC-USDT",
    "direction": "sell",
    "tp_trigger_price": "70000",
    "tp_order_price": "70100",
    "tp_order_price_type": "limit",
    "sl_trigger_price": "62000",
    "sl_order_price": "61900",
    "sl_order_price_type": "limit",
    "volume": 100
  }' --json
\`\`\`

### Close all SOL-USDT positions

\`\`\`bash
# Lightning close (market order)
htx-cli futures call /v1/swap_cross_lightning_close_position --auth \\
  --body '{
    "contract_code": "SOL-USDT",
    "direction": "sell"
  }' --json
\`\`\`

### Cancel all BTC-USDT open orders

\`\`\`bash
htx-cli futures call /v1/swap_cross_cancelall --auth \\
  --body '{"contract_code":"BTC-USDT"}' --json
\`\`\`

## Safety constraints (must read)

Before every order, the AI Agent **MUST**:

1. Calculate and display:
   - Contract / direction / leverage / contracts / underlying quantity (contracts × contract_size) / order price
   - Estimated margin required
   - Current mark price + deviation from limit price
   - Liquidation price (if computable)
2. Warn about risk: leverage above 5x must explicitly note "high leverage = high liquidation risk"
3. Display the account's current available margin (call futures-account)
4. Wait for the user to explicitly say "confirm order"
5. Only execute after confirmation

For every close / lightning close:
- Display current position size, cost basis, current PnL
- Confirm whether it is "close all" or "partial close"
- Lightning close = market order, immediate fill, no price protection

For every leverage change:
- Display current leverage → target leverage
- Check whether positions / open orders will be impacted
- Warn about risk (higher leverage = closer liquidation price)

## Error codes

- \`position-empty\` — no position, cannot close
- \`volume-precision-error\` — contracts must be integer
- \`lever-rate-too-high\` — exceeds the contract's leverage tier cap
- \`available-margin-insufficient\` — insufficient margin; transfer in more USDT or lower leverage
- Rate limit: roughly max 30 orders/cancels per second

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install futures-trading
\`\`\`

## Related docs

- HTX perpetual futures API: https://huobiapi.github.io/docs/usdt_swap/v1/cn/
`,
  "liquidation-stream/README.md": `# @htx-skills/liquidation-stream

HTX (Huobi) **USDT-M perpetual liquidation orders** skill for Claude Code. Forced-liquidation events for squeeze monitoring and cluster detection.

- 1 endpoint, **public** (no API key)
- Risk: **none**

## Install

\`\`\`bash
npx -y @htx-skills/liquidation-stream install
\`\`\`

## Prerequisites

1. **Node.js ≥ 18**
2. **\`htx-cli\`** on \`\$PATH\`

## Verify

> "How much was liquidated on BTC perpetual in the last 24h?"

## Endpoint covered

| Endpoint | Description |
|----------|-------------|
| \`swap_liquidation_orders\` | Forced liquidation orders, filterable by side and date range |

## Related skills

- \`@htx-skills/funding-rate\`
- \`@htx-skills/oi-tracker\`
- \`@htx-skills/derivatives-analyst\`

## License

MIT.
`,
  "liquidation-stream/SKILL.md": `---
name: htx-liquidation-stream
version: 1.0.0
description: Query HTX USDT-M perpetual liquidation orders — recent forced-liquidation events for long/short squeeze monitoring and cluster detection. Public, no API key required.
auth_required: false
risk_level: none
---

# HTX Liquidation Stream

Focused skill for **liquidation orders** on HTX USDT-M perpetuals. Use to detect short-squeezes, long-squeezes, and price levels where stop-cascades have been triggered.

## When to use this skill

Load this skill when the user asks about:

- "Recent BTC liquidations"
- "How much was liquidated in the last 24h?"
- "Were there any large liquidations near \$X price?"
- "Long squeeze on ETH?"
- "Where did the recent liquidation cluster happen?"
- "Liquidation volume by side (long vs short)"

For aggregated *cross-exchange* liquidation heatmaps, HTX does not expose this — you would need to integrate CoinGlass externally.

## Underlying tool

Drives \`htx-cli\`. Binary on \`\$PATH\` or \`\$HTX_CLI_BIN\`. Always pass \`--json\`.

## Endpoint catalog (1)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | \`/linear-swap-api/v1/swap_liquidation_orders\` | \`htx-cli futures market liquidation-orders <contract-code> --json\` | Recent forced-liquidation orders for one contract |

## Query parameters

The convenience command auto-fills sensible defaults. For custom filtering use the underlying call form:

\`\`\`bash
htx-cli futures call GET /linear-swap-api/v1/swap_liquidation_orders \\
  --query contract_code=BTC-USDT&trade_type=0&create_date=7&page_size=50 \\
  --json
\`\`\`

| Param | Values | Meaning |
|-------|--------|---------|
| \`trade_type\` | \`0\` (all), \`1\` (closed long forced), \`2\` (closed short forced), \`3\` (long order forced), \`4\` (short order forced) | Filter by liquidation direction |
| \`create_date\` | \`7\`, \`14\`, \`30\`, \`60\`, \`90\` | Days lookback |
| \`page_size\` | 1–50 | Records per page |
| \`page_index\` | int (default 1) | Pagination |

## Contract code format

USDT-M perpetual codes follow \`<BASE>-USDT\` (e.g. \`BTC-USDT\`).

## Typical queries → CLI

| User question | CLI command |
|---------------|-------------|
| "BTC liquidations last 7d" | \`htx-cli futures market liquidation-orders BTC-USDT --json\` |
| "ETH long liquidations last 30d" | \`htx-cli futures call GET /linear-swap-api/v1/swap_liquidation_orders --query contract_code=ETH-USDT&trade_type=1&create_date=30 --json\` |
| "Largest liquidations on SOL last 24h" | Pull \`--query contract_code=SOL-USDT&page_size=50 --json\` then sort client-side by \`volume * price\`, filter to last 24h |

## Output guidance

When summarizing liquidations, return:
- **Total liq value (USD)** in the requested window
- **Long liq vs short liq breakdown** (% / absolute)
- **Top 5 single events** by USD value (price + side + time)
- **Cluster zones**: price ranges where ≥ 3 liq events happened within ±0.5%
- **Time-of-day pattern** if relevant (e.g. concentrated during US open)

## Squeeze interpretation

| Pattern | Signal |
|---------|--------|
| Heavy long liqs + price ↓ | Capitulation cascade — potential reversal zone |
| Heavy short liqs + price ↑ | Short squeeze — potential exhaustion as squeeze fuel runs out |
| Liq cluster at round number | Stop-loss bunch — price often retests |

## Related skills

- \`@htx-skills/funding-rate\` — pre-squeeze crowdedness
- \`@htx-skills/oi-tracker\` — post-squeeze OI drop confirms cascade
- \`@htx-skills/derivatives-analyst\` — *(planned Layer 2)* combines liq + funding + OI for unified pressure score
`,
  "liquidation-stream/package.json": `{
  "name": "@htx-skills/liquidation-stream",
  "version": "1.0.0",
  "description": "HTX USDT-M perpetual liquidation orders skill — recent forced liquidation events for squeeze monitoring and cluster detection.",
  "bin": {
    "htx-skills-liquidation-stream": "bin/install.js"
  },
  "files": [
    "bin/",
    "references/",
    "SKILL.md",
    "README.md",
    "LICENSE.md"
  ],
  "keywords": [
    "htx",
    "huobi",
    "claude",
    "claude-code",
    "skill",
    "futures",
    "liquidation",
    "squeeze",
    "perpetual"
  ],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
`,
  "mark-price/SKILL.md": `---
name: htx-mark-price
version: 1.0.0
description: Mark price, premium index, and basis kline series for HTX USDT-M perpetuals — fair-value pricing for liquidation reference and basis monitoring. Public, no API key required.
auth_required: false
risk_level: none
---

# HTX Mark Price, Premium Index & Basis

Focused skill for **mark price**, **premium index**, and **basis** kline series on HTX USDT-M perpetuals. Mark price drives liquidation; premium index drives funding rate; basis = mark − index price (the spread vs spot reference). All public.

## When to use this skill

Load this skill when the user asks about:

- "BTC mark price kline 4h"
- "Show me premium index for ETH-USDT"
- "Why is the mark price different from last trade?"
- "Premium index history before this funding settlement"
- "Mark price vs index price spread on SOL"
- "Is the perpetual trading at premium or discount?"
- "BTC basis history"

## Underlying tool

Drives \`htx-cli\`. Binary on \`\$PATH\` or \`\$HTX_CLI_BIN\`. Always pass \`--json\`.

## Endpoint catalog (2)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | \`/linear-swap-ex/market/history/mark_price_kline\` | \`htx-cli futures call GET /linear-swap-ex/market/history/mark_price_kline --query contract_code=<code>&period=<period>&size=<N> --json\` | Mark price kline (used for liquidation, position PnL) |
| 2 | GET | \`/linear-swap-ex/market/history/premium_index_kline\` | \`htx-cli futures call GET /linear-swap-ex/market/history/premium_index_kline --query contract_code=<code>&period=<period>&size=<N> --json\` | Premium index kline (deviation of perpetual from spot, drives funding) |

## Period values

- \`1min\`, \`5min\`, \`15min\`, \`30min\`, \`60min\`, \`4hour\`, \`1day\`

\`size\` range: 1–2000 (typical: 200).

## Contract code format

USDT-M perpetual codes follow \`<BASE>-USDT\` (e.g. \`BTC-USDT\`).

## Concept reference

| Term | Definition |
|------|------------|
| **Mark price** | Fair-value reference price = index price × (1 + premium index over a moving window). Used for **liquidation triggers** and **unrealized PnL**, NOT for matching trades. |
| **Index price** | Spot-based reference, weighted basket of major spot exchanges. |
| **Premium index** | \`(Mark - Index) / Index\`. Positive = perpetual trading at premium (longs heavy); negative = discount. |
| **Funding rate** | Calculated from a smoothed premium index + interest rate component. Reset every 8h. |

## Typical queries → CLI

| User question | CLI command |
|---------------|-------------|
| "BTC mark 1h kline last 200 bars" | \`htx-cli futures call GET /linear-swap-ex/market/history/mark_price_kline --query contract_code=BTC-USDT&period=60min&size=200 --json\` |
| "ETH premium 15m kline" | \`htx-cli futures call GET /linear-swap-ex/market/history/premium_index_kline --query contract_code=ETH-USDT&period=15min&size=200 --json\` |
| "Is SOL trading at premium right now?" | Pull premium kline size=1 → check sign and magnitude |
| "BTC basis 1h kline last 100" | \`htx-cli futures call GET /index/market/history/linear_swap_basis -p contract_code=BTC-USDT -p period=60min -p basis_price_type=close -p size=100 --json\` |

## Output guidance

Return:
- Latest mark/premium values
- 1h / 4h / 24h change
- For premium index: label as \`discount (>−0.05%)\`, \`neutral (±0.05%)\`, \`mild premium (0.05%-0.2%)\`, \`heavy premium (>0.2%)\`

## Related skills

- \`@htx-skills/funding-rate\` — premium drives funding direction
- \`@htx-skills/futures-market\` — index price endpoint (basis denominator)
- \`@htx-skills/derivatives-analyst\` — *(planned Layer 2)* combines mark/premium/funding/OI into pressure score
`,
  "market-overview/SKILL.md": `---
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

If the user asks for a specific symbol, fall through to \`htx-spot-market\` (price), \`htx-technical-analysis\` (technical read), or \`htx-derivatives-analyst\` (futures pressure).

## Underlying tools

| Source | What it provides | Cost |
|--------|------------------|------|
| \`@htx-skills/spot-market\` | \`htx-cli spot market tickers\` — all-spot 24h tickers | free |
| \`@htx-skills/futures-market\` | \`htx-cli futures market tickers\` — all-futures 24h tickers | free |

If those Layer 1 skills aren't installed:

\`\`\`bash
npx -y @htx-skills/spot-market install
npx -y @htx-skills/futures-market install
\`\`\`

## Standard workflow

### Step 1 — Pull both ticker universes

\`\`\`bash
htx-cli spot market tickers --json     > /tmp/htx_spot_tickers.json
htx-cli futures market tickers --json  > /tmp/htx_futures_tickers.json
\`\`\`

Each ticker entry contains: \`symbol\` / \`contract_code\`, \`open\`, \`close\`, \`high\`, \`low\`, \`vol\`, \`amount\`, \`count\`. Compute \`change_pct = (close - open) / open * 100\` client-side.

### Step 2 — Compute aggregates client-side

For each universe (spot, futures):

| Metric | Computation |
|--------|-------------|
| **Top gainers (Top 10)** | sort by \`change_pct\` desc, take top 10 |
| **Top losers (Top 10)** | sort by \`change_pct\` asc, take top 10 |
| **Top volume (Top 10)** | sort by \`amount\` (24h quote-currency volume) desc |
| **Volume anomalies** | symbols where \`amount / 7d_avg_amount > 3\` (need historical reference; for v1 just flag top decile of vol) |
| **Breadth** | count where \`change_pct > 0\` vs \`< 0\` vs \`≈ 0\` |
| **Strong-move count** | count where \`abs(change_pct) > 5\` |
| **Median change %** | for "is the market broadly up or down?" |

### Step 3 — Sector / narrative tags (best-effort)

HTX spot symbols don't carry sector tags natively. Two tactics:

1. **Hardcoded buckets** (maintain in \`references/sectors.md\`):
   - Layer 1: \`btc, eth, sol, ada, dot, avax, ...\`
   - Layer 2: \`op, arb, mantle, ...\`
   - AI: \`agix, fet, rndr, ocean, tao, ...\`
   - DePIN: \`hnt, render, akt, ...\`
   - Memecoin: \`doge, shib, pepe, wif, ...\`

2. **External enrichment** (optional): pull CoinGecko \`/coins/categories\` for fresher tags. Free tier OK.

For each bucket, average the \`change_pct\` of the top-5 by market cap inside the bucket → sector heat.

## Output structure

\`\`\`json
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
\`\`\`

### Market phase classification

| Condition | Label |
|-----------|-------|
| \`breadth_ratio > 1.5\` AND \`median_change > 0.5%\` | **broad_rally** |
| \`breadth_ratio < 0.7\` AND \`median_change < -0.5%\` | **broad_drawdown** |
| \`breadth_ratio between 0.7-1.5\` AND large divergence between top-bottom | **rotation** |
| \`breadth_ratio between 0.7-1.5\` AND median ≈ 0 | **choppy** |

## What this skill explicitly does NOT do

- ⚠️ **No native sector taxonomy** — HTX exchange API has no first-class sector field. Sector logic relies on a hardcoded mapping in \`references/sectors.md\` (or optional CoinGecko enrichment).
- ⚠️ **No new-listing tracker** — would need \`htx-cli spot market symbols\` diffed across days; not implemented in v1 of this skill.
- ⚠️ **No narrative detection from news/social** — that needs sentiment-analyst + news-briefing (news-briefing not yet built in this hub).

## Output guidance

When the user asks an open-ended "what's happening" question, lead with:

1. **One-liner** (e.g. "Broad rally led by AI sector — 65% of pairs up")
2. **Top 3 stories**: biggest gainer, biggest sector move, biggest volume anomaly
3. **Risk flag** if rally is narrow (top 5 carrying everything) or if breadth diverges from BTC

## Related skills

- \`@htx-skills/spot-market\`, \`@htx-skills/futures-market\` — data sources
- \`@htx-skills/technical-analysis\` — drill-down on a specific symbol after the user picks one from the overview
- \`@htx-skills/sentiment-analyst\` — frame the overview within a fear/greed context
- \`@htx-skills/derivatives-analyst\` — for futures rallies, check if they're driven by leverage

## References

- \`references/sectors.md\` — hardcoded sector → symbol mapping (maintained manually; update quarterly)
`,
  "market-overview/references/sectors.md": `# Sector / Theme Classification Reference

The \`htx/market-overview\` skill uses this file for sector rotation analysis. Each sector lists representative coin symbols.

> Reference only. Coins may belong to multiple sectors; new coins must be added manually.

## Layer 1 Public Chains

\`btcusdt\` \`ethusdt\` \`solusdt\` \`bnbusdt\` \`avaxusdt\` \`adausdt\` \`dotusdt\` \`nearusdt\` \`aptusdt\` \`suiusdt\` \`tonusdt\` \`tronusdt\` \`xrpusdt\` \`atomusdt\` \`algousdt\`

## Layer 2 / Scaling

\`arbusdt\` \`opusdt\` \`maticusdt\` \`imxusdt\` \`mantausdt\` \`metisusdt\` \`strkusdt\` \`bloodusdt\`

## DeFi (Established)

\`uniusdt\` \`aaveusdt\` \`crvusdt\` \`compusdt\` \`mkrusdt\` \`snxusdt\` \`1inchusdt\` \`sushiusdt\` \`bllusdt\`

## DeFi (New)

\`pendleusdt\` \`gmxusdt\` \`dydxusdt\` \`jtousdt\` \`jupusdt\` \`eigenusdt\` \`etheusdt\`

## RWA (Real World Assets)

\`ondousdt\` \`mklusdt\` \`pendle usdt\` \`crvusdt\`

## AI / Compute

\`fetusdt\` \`agixusdt\` \`oceanusdt\` \`wldusdt\` \`taousdt\` \`renderusdt\` \`iousdt\` \`aktusdt\` \`nosusdt\`

## Meme

\`dogeusdt\` \`shibusdt\` \`pepeusdt\` \`wifusdt\` \`bonkusdt\` \`flokiusdt\` \`popcatusdt\` \`mewusdt\` \`notusdt\` \`mogusdt\` \`brettusdt\`

## GameFi / Metaverse

\`axsusdt\` \`sandusdt\` \`manausdt\` \`apeusdt\` \`gmtusdt\` \`iloveusdt\` \`pixelusdt\` \`galaxyusdt\` \`enjusdt\`

## NFT

\`blurusdt\` \`looksusdt\` \`apeusdt\`

## Storage / DePIN

\`filusdt\` \`arusdt\` \`htusdt\` \`iotxusdt\` \`helousdt\` \`xnousdt\` \`gravityusdt\`

## Privacy

\`xmrusdt\` \`zecusdt\` \`dashusdt\` \`scrtusdt\`

## Liquid Restaking

\`ezethusdt\` \`weethusdt\` \`rsethusdt\` \`pufethusdt\`

## SocialFi

\`cyberusdt\` \`frienusdt\` \`arkmusdt\`

## Other Themes (continuously added)

- **Bitcoin ecosystem**: \`ordibtcusdt\` \`satsusdt\` \`runeusdt\`
- **Cosmos ecosystem**: \`atomusdt\` \`osmusdt\` \`injusdt\` \`tiausdt\` \`dymusdt\`
- **Solana ecosystem**: \`jupusdt\` \`wifusdt\` \`jtousdt\` \`bonkusdt\` \`pythusdt\` \`wenusdt\`
- **TON ecosystem**: \`tonusdt\` \`notusdt\` \`dogsusdt\` \`hmstrusdt\`

## Maintenance

Periodically (monthly) scan the full market via \`tickers\` to check whether the top 50 coins by 24h volume have been mapped to a sector; if a new coin is unclassified, add it to the appropriate category.
`,
  "oi-tracker/README.md": `# @htx-skills/oi-tracker

HTX (Huobi) **USDT-M perpetual open interest** skill for Claude Code. Current OI snapshot + historical series.

- 2 endpoints, all **public** (no API key)
- Risk: **none**

## Install

\`\`\`bash
npx -y @htx-skills/oi-tracker install
\`\`\`

Target: \`~/.claude/skills/htx/oi-tracker/\`.

## Prerequisites

1. **Node.js ≥ 18**
2. **\`htx-cli\`** on \`\$PATH\`

## Verify

In Claude Code:

> "What's BTC's open interest right now and how has it changed in 24h?"

## Endpoints covered

| Endpoint | Description |
|----------|-------------|
| \`swap_open_interest\` | Current OI snapshot |
| \`market/his_open_interest\` | OI historical time series |

## Related skills

- \`@htx-skills/funding-rate\`
- \`@htx-skills/elite-positioning\`
- \`@htx-skills/derivatives-analyst\`

## License

MIT.
`,
  "oi-tracker/SKILL.md": `---
name: htx-oi-tracker
version: 1.0.0
description: Track HTX USDT-M perpetual open interest — current OI snapshot per contract, plus historical OI time series for trend and surge detection. Public, no API key required.
auth_required: false
risk_level: none
---

# HTX Open Interest Tracker

Focused skill for **open interest (OI)** on HTX USDT-M perpetuals. Public endpoints — agent may call them freely.

## When to use this skill

Load this skill when the user asks about:

- "BTC perpetual OI right now"
- "How much has ETH OI changed in the last 24h?"
- "Show me OI trend for SOL-USDT"
- "Is OI surging on any contract?"
- "OI vs price divergence on BTC"
- "Total OI across all USDT-M perpetuals"

For combined OI + funding + multi-signal scoring, prefer \`htx-derivatives-analyst\` *(planned Layer 2)*.

## Underlying tool

Drives \`htx-cli\`. Binary on \`\$PATH\` or \`\$HTX_CLI_BIN\`. Always pass \`--json\`.

## Endpoint catalog (2)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | \`/linear-swap-api/v1/swap_open_interest\` | \`htx-cli futures call GET /linear-swap-api/v1/swap_open_interest [--query contract_code=<code>] --json\` | Current OI snapshot. Without \`contract_code\`, returns all contracts. |
| 2 | GET | \`/linear-swap-ex/market/his_open_interest\` | \`htx-cli futures call GET /linear-swap-ex/market/his_open_interest --query contract_code=<code>&period=<period>&size=<N> --json\` | Historical OI time series for trend / surge analysis. |

## Contract code format

USDT-M perpetual codes follow \`<BASE>-USDT\` (e.g. \`BTC-USDT\`).

## Period & size for historical OI

\`his_open_interest\` accepts:
- \`period\`: \`60min\`, \`4hour\`, \`12hour\`, \`1day\`
- \`size\`: 1 to 200

## Typical queries → CLI

| User question | CLI command |
|---------------|-------------|
| "BTC current OI" | \`htx-cli futures call GET /linear-swap-api/v1/swap_open_interest --query contract_code=BTC-USDT --json\` |
| "All-contract OI snapshot" | \`htx-cli futures call GET /linear-swap-api/v1/swap_open_interest --json\` |
| "ETH OI 4h trend last 200 bars" | \`htx-cli futures call GET /linear-swap-ex/market/his_open_interest --query contract_code=ETH-USDT&period=4hour&size=200 --json\` |
| "BTC OI 24h change %" | Pull 1d period size=2, compute \`(latest - previous) / previous * 100\` client-side |

## Output guidance

Return:
- **Current OI** in contracts (\`amount\`) and base currency (\`volume\` × multiplier)
- **24h Δ %** (compute from \`his_open_interest\` series)
- **Trend label**: surging (>10% in 4h), rising, stable, declining, plunging (<-10% in 4h)
- For all-contracts query: top 5 by absolute OI and top 5 by 24h growth

## OI signal interpretation

| Pattern | Signal |
|---------|--------|
| OI ↑ + price ↑ | New longs entering — bullish continuation |
| OI ↑ + price ↓ | New shorts entering — bearish continuation |
| OI ↓ + price ↑ | Shorts covering — squeeze risk |
| OI ↓ + price ↓ | Longs unwinding — capitulation |

## Related skills

- \`@htx-skills/funding-rate\` — funding rate context for crowdedness
- \`@htx-skills/elite-positioning\` — top-trader long/short ratio
- \`@htx-skills/derivatives-analyst\` — *(planned Layer 2)* multi-signal pressure scoring
`,
  "oi-tracker/package.json": `{
  "name": "@htx-skills/oi-tracker",
  "version": "1.0.0",
  "description": "HTX USDT-M perpetual open interest skill — current OI snapshot and historical time series for trend and surge detection.",
  "bin": {
    "htx-skills-oi-tracker": "bin/install.js"
  },
  "files": [
    "bin/",
    "references/",
    "SKILL.md",
    "README.md",
    "LICENSE.md"
  ],
  "keywords": [
    "htx",
    "huobi",
    "claude",
    "claude-code",
    "skill",
    "futures",
    "open-interest",
    "perpetual"
  ],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
`,
  "sentiment-analyst/SKILL.md": `---
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

For pure derivatives crowdedness on a specific contract, prefer \`htx-derivatives-analyst\`. For pure technicals, prefer \`htx-technical-analysis\`.

## Underlying tools

| Source | What it provides | Cost |
|--------|------------------|------|
| \`https://api.alternative.me/fng/\` (external) | Crypto Fear & Greed Index (0-100) — daily, free, no key | free |
| \`@htx-skills/elite-positioning\` | top-trader account + position L/S ratio | free |
| \`@htx-skills/spot-market\` | 24h gainers/losers via tickers endpoint | free |

If those Layer 1 skills aren't installed:

\`\`\`bash
npx -y @htx-skills/elite-positioning install
npx -y @htx-skills/spot-market install
\`\`\`

## Standard workflow

### Step 1 — Fetch Fear & Greed (external)

\`\`\`bash
curl -s 'https://api.alternative.me/fng/?limit=30' | jq .
\`\`\`

Returns a 30-day history of values 0–100 with labels:

| Range | Label |
|-------|-------|
| 0-24 | Extreme Fear |
| 25-44 | Fear |
| 45-55 | Neutral |
| 56-74 | Greed |
| 75-100 | Extreme Greed |

### Step 2 — Pull HTX elite positioning (BTC as proxy for the major-coin crowd, plus user-specified symbol)

\`\`\`bash
htx-cli futures call GET /linear-swap-api/v1/swap_elite_account_ratio \\
  -p contract_code=BTC-USDT -p period=4hour --json

htx-cli futures call GET /linear-swap-api/v1/swap_elite_position_ratio \\
  -p contract_code=BTC-USDT -p period=4hour --json
\`\`\`

### Step 3 — Pull breadth from spot tickers

\`\`\`bash
htx-cli spot market tickers --json
\`\`\`

Compute client-side:
- count of pairs with \`change > +5%\` (strong gainers)
- count with \`change < -5%\` (strong losers)
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

\`\`\`json
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
\`\`\`

## What this skill explicitly does NOT do

- ⚠️ **No social media sentiment** (Twitter/X, Reddit, Weibo, Douyin) — HTX has no native endpoint and we're not paying for LunarCrush yet.
- ⚠️ **No KOL monitoring** — same reason.
- ⚠️ **No on-chain whale flow** — needs external paid source (Whale Alert / Nansen).

These gaps are flagged in the output \`risk_warning\` so users know what's not modeled.

## Related skills

- \`@htx-skills/elite-positioning\`, \`@htx-skills/spot-market\` — data sources
- \`@htx-skills/derivatives-analyst\` — combine with derivatives pressure for fuller picture
- \`@htx-skills/market-overview\` — uses the same breadth computation in a different framing
`,
  "settlement/SKILL.md": `---
name: htx-settlement
version: 1.0.0
description: Settlement and insurance fund data for HTX USDT-M perpetuals — estimated next-settlement price, historical settlement records, and insurance fund balance/history. Public, no API key.
auth_required: false
risk_level: none
---

# HTX Settlement & Insurance Fund

Reference data for HTX USDT-M perpetual **settlements** (the periodic mark-to-market events that net unrealized PnL into wallets) and the **insurance fund** (the contract platform's reserve for socialized loss prevention).

## When to use this skill

Load this skill when the user asks about:

- "When is the next settlement on BTC perpetual?"
- "Estimated settlement price right now"
- "Historical settlement records for ETH"
- "How big is HTX's insurance fund?"
- "Insurance fund balance trend"
- "Has the insurance fund been paid out recently?"

## Underlying tool

Drives \`htx-cli\`. Binary on \`\$PATH\` or \`\$HTX_CLI_BIN\`. Always pass \`--json\`.

## Endpoint catalog (4)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | \`/linear-swap-api/v1/swap_estimated_settlement_price\` | \`htx-cli futures call GET /linear-swap-api/v1/swap_estimated_settlement_price [--query contract_code=<code>] --json\` | Estimated price for the next settlement |
| 2 | GET | \`/linear-swap-api/v1/swap_settlement_records\` | \`htx-cli futures call GET /linear-swap-api/v1/swap_settlement_records --query contract_code=<code>&start_time=<ms>&end_time=<ms> --json\` | Historical settlement records (per-contract) |
| 3 | GET | \`/v1/insurance_fund_info\` | \`htx-cli futures call GET /v1/insurance_fund_info --json\` | Current insurance fund balance per asset |
| 4 | GET | \`/v1/insurance_fund_history\` | \`htx-cli futures call GET /v1/insurance_fund_history --json\` | Historical insurance fund balance time series |

## Concept reference

| Term | Meaning |
|------|---------|
| **Settlement** | Periodic netting event where unrealized PnL becomes realized. HTX USDT-M settles **continuously** via mark price PnL — the "settlement records" endpoint refers to delivery-style settlements for any quarterly contracts. |
| **Estimated settlement price** | Forward-looking price that would clear positions if settlement happened now. Useful for risk monitoring of margin levels. |
| **Insurance fund** | Reserve pool funded by liquidation surplus. When a liquidated position can't be auctioned at the bankruptcy price, the fund covers the gap. Drawdowns indicate platform stress. |

## Contract code format

USDT-M perpetual codes follow \`<BASE>-USDT\` (e.g. \`BTC-USDT\`).

## Typical queries → CLI

| User question | CLI command |
|---------------|-------------|
| "BTC estimated settlement price" | \`htx-cli futures call GET /linear-swap-api/v1/swap_estimated_settlement_price --query contract_code=BTC-USDT --json\` |
| "ETH settlement records last 30d" | \`htx-cli futures call GET /linear-swap-api/v1/swap_settlement_records --query contract_code=ETH-USDT --json\` |
| "HTX insurance fund right now" | \`htx-cli futures call GET /v1/insurance_fund_info --json\` |
| "Insurance fund last 90 days" | \`htx-cli futures call GET /v1/insurance_fund_history --json\` |

## Output guidance

For insurance fund queries:
- Show balance per asset (USDT main; ETH/BTC for COIN-M if relevant)
- Show 30d / 90d change
- Flag if fund has **decreased > 10%** in 7d (stress signal)

For settlement queries:
- Show next settlement time (UTC + local)
- Show estimated price + delta from current mark
- For historical records: aggregate by contract, count of settlements

## Related skills

- \`@htx-skills/funding-rate\` — settlements happen alongside funding events
- \`@htx-skills/liquidation-stream\` — liquidations feed the insurance fund
- \`@htx-skills/derivatives-analyst\` — *(planned Layer 2)* multi-signal pressure scoring
`,
  "spot-account/SKILL.md": `---
name: htx/spot-account
version: 2.0.0
description: HTX spot account — balance / holdings / asset valuation / spot ↔ futures transfers.
auth: true
risk: medium
---

# Spot Account

Query spot account and sub-account balance, valuation, transaction history, and inter-account transfers.

> **Authentication**: all endpoints require an API key (read permission is enough; transfers need trade permission)
> **Risk**: read endpoints have no side effects; transfer endpoints require manual confirmation

## When to use

- Query account list / single-account balance / total asset valuation
- Look up balances across different currencies inside the spot account
- Transfer funds between spot and USDT-M / COIN-M perpetual futures
- Query sub-account balance, transfer between sub-accounts

## Quick start

\`\`\`bash
# List all accounts
htx-cli spot account list

# Query a specific account balance (account-id required)
htx-cli spot account balance <account-id>

# Total asset USD valuation
htx-cli spot account valuation
\`\`\`

## Endpoint catalog (10)

### Account query — read (5)

| # | Method | Endpoint | CLI | Description |
|---|--------|----------|-----|-------------|
| 1 | GET | \`/v1/account/accounts\` | \`htx-cli spot account list\` | List all accounts (spot / margin / otc / point) |
| 2 | GET | \`/v1/account/accounts/{id}/balance\` | \`htx-cli spot account balance <id>\` | Per-currency balance of a single account |
| 3 | GET | \`/v2/account/asset-valuation\` | \`htx-cli spot account valuation\` | Total asset valuation (USD / BTC) |
| 4 | GET | \`/v1/account/history\` | \`htx-cli spot account history\` | Account history (last 7 days) |
| 5 | GET | \`/v1/query/deposit-withdraw\` | \`htx-cli spot account deposit-withdraw\` | Deposit/withdraw records |

### 资金划转 — write (5)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 6 | POST | \`/v1/account/transfer\` | \`htx-cli spot call /v1/account/transfer --method POST --auth --body '{"from-account-id":...,"to-account-id":...,"currency":"usdt","amount":"..."}' --json\` | Transfer between user's own spot/margin/otc accounts |
| 7 | POST | \`/v1/futures/transfer\` | \`htx-cli spot call /v1/futures/transfer --method POST --auth --body '{"currency":"btc","amount":"...","type":"pro-to-futures"}' --json\` | Spot ↔ **COIN-M** (coin-margined delivery) futures transfer ONLY. Does NOT work for USDT-M. |
| 8 | POST | \`/v2/account/transfer\` | \`htx-cli spot call /v2/account/transfer --method POST --auth --body '{"from":"spot","to":"linear-swap","currency":"usdt","amount":"5","margin-account":"USDT"}' --json\` | **Spot ↔ USDT-M linear perpetual** / cross-margin / super-margin, etc. Use for any USDT-M futures transfer. |
| 9 | GET | \`/v1/point/account\` | \`htx-cli spot call /v1/point/account --auth --json\` | HTX points balance |
| 10 | POST | \`/v1/point/transfer\` | \`htx-cli spot call /v1/point/transfer --method POST --auth --body '{"fromUid":"...","toUid":"...","amount":"..."}' --json\` | Transfer points |

> **Important**: For USDT-M perpetual swap (linear perpetual), you MUST use \`/v2/account/transfer\` with \`from\`/\`to\` = \`spot\` ↔ \`linear-swap\` and \`margin-account\` = \`USDT\` (cross) or \`USDT-<symbol>\` (isolated, e.g. \`USDT-BTC\`). The \`/v1/futures/transfer\` endpoint is reserved for COIN-M delivery contracts and will return \`Transfer service is temporarily suspended for USDT account\` if misused.

## Workflow patterns

### Show total balance

\`\`\`bash
htx-cli spot account list --json               # find account id with type=spot
htx-cli spot account balance <id> --json       # detailed per-currency balance
htx-cli spot account valuation --json          # single USD total
\`\`\`

### Spot → USDT-M futures transfer (most common)

Use \`/v2/account/transfer\`:

\`\`\`bash
htx-cli spot call /v2/account/transfer --method POST --auth \\
  --body '{"from":"spot","to":"linear-swap","currency":"usdt","amount":"5","margin-account":"USDT"}' --json
\`\`\`

- \`from\` / \`to\`: \`spot\`, \`linear-swap\`, \`margin\`, \`super-margin\`, etc. Reverse them to transfer back.
- \`margin-account\`: \`USDT\` for cross-margin, \`USDT-BTC\` (etc.) for isolated margin.

### Spot → COIN-M futures transfer

Use \`/v1/futures/transfer\` with \`type\` = \`pro-to-futures\` or \`futures-to-pro\` (currency is the coin symbol, e.g. \`btc\`, \`eth\`).

Before calling any transfer endpoint, **display to the user** source, destination, currency, amount, direction. Only proceed after explicit user confirmation.

## Safety

- All transfers are write operations. AI Agent MUST show the user source / destination / currency / amount before calling, and only proceed after explicit confirmation.
- Wrong-direction transfers can cause margin shortfall or forced liquidation.
- API Key never leaves your machine.

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install spot-account
\`\`\`
`,
  "spot-market/SKILL.md": `---
name: htx/spot-market
version: 2.0.0
description: HTX spot market data — ticker / klines / order book / latest trades / currency and symbol metadata.
auth: false
risk: low
---

# Spot Market

Read public spot market data from HTX. **No API key required**; all endpoints are public.

## When to use

- Query a single symbol's real-time price, 24h change, volume
- Pull klines (minute / hour / day / week / month periods)
- View order book depth (bid/ask 5/10/20 levels)
- Market-wide scan (snapshot of all symbol tickers)
- Look up currency / symbol metadata (precision, minimum order size)

## Quick start

\`\`\`bash
# Query BTC/USDT latest market data
htx-cli spot-market market-detail-merged -p symbol=btcusdt

# Pull last 100 ETH/USDT 4h klines
htx-cli spot-market kline -p symbol=ethusdt -p period=4hour -p size=100

# Query market-wide tickers
htx-cli spot-market tickers
\`\`\`

## Available commands (13 endpoints)

### Market data

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| \`market-detail-merged\` | \`GET /market/detail/merged\` | Single-symbol real-time summary (latest price + 24h stats) |
| \`market-detail\` | \`GET /market/detail\` | Single-symbol 24h stats detail |
| \`tickers\` | \`GET /market/tickers\` | Market-wide ticker snapshot for all symbols |
| \`kline\` | \`GET /market/history/kline\` | Historical klines (period: 1min / 5min / 15min / 30min / 60min / 4hour / 1day / 1week / 1mon) |
| \`depth\` | \`GET /market/depth\` | Order book depth (type: step0 / step1 / step2 / step3 / step4 / step5) |
| \`trade\` | \`GET /market/trade\` | Latest single trade |
| \`history-trade\` | \`GET /market/history/trade\` | Historical trades (max 2000) |

### Metadata

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| \`symbols\` | \`GET /v1/common/symbols\` | List of all tradable symbols (precision, min order size, status) |
| \`currencys\` | \`GET /v1/common/currencys\` | List of all currencies |
| \`currencies-v2\` | \`GET /v2/reference/currencies\` | Currency detail (with deposit/withdraw status) |
| \`market-status\` | \`GET /v2/market-status\` | Market status (normal / halted / cancel-only) |
| \`timestamp\` | \`GET /v1/common/timestamp\` | Server timestamp |
| \`chains\` | \`GET /v1/settings/common/chains\` | Chain info |

## Parameter reference

- \`symbol\` — symbol in lowercase without separators, e.g. \`btcusdt\` / \`ethusdt\` / \`solusdt\`
- \`period\` — kline period: \`1min\` \`5min\` \`15min\` \`30min\` \`60min\` \`4hour\` \`1day\` \`1week\` \`1mon\`
- \`size\` — number of records, 1-2000
- \`type\` — depth aggregation precision: \`step0\` (no aggregation) to \`step5\` (coarsest)
- \`depth\` — number of levels: 5 / 10 / 20

## Typical scenarios

**"How much is BTC right now?"**
\`\`\`bash
htx-cli spot-market market-detail-merged -p symbol=btcusdt
# → close field is the latest price
\`\`\`

**"ETH 4h kline trend"**
\`\`\`bash
htx-cli spot-market kline -p symbol=ethusdt -p period=4hour -p size=200
\`\`\`

**"Top 10 24h gainers"**
\`\`\`bash
htx-cli spot-market tickers
# AI Agent parses the data array, sorts by (close-open)/open and takes the top 10
\`\`\`

**"SOL order book depth"**
\`\`\`bash
htx-cli spot-market depth -p symbol=solusdt -p type=step0 -p depth=20
\`\`\`

## Output schema excerpt

\`market-detail-merged\` returns:
\`\`\`json
{
  "ch": "market.btcusdt.detail.merged",
  "ts": 1712345678901,
  "tick": {
    "id": 12345,
    "open": 65000.0,
    "close": 66100.0,
    "high": 66500.0,
    "low": 64800.0,
    "amount": 12345.67,
    "vol": 815432100.5,
    "count": 102345,
    "bid": [66099.5, 0.5],
    "ask": [66100.5, 0.3]
  }
}
\`\`\`

## Notes

- Public endpoint rate limit: roughly 100/s per IP; use \`tickers\` for one-shot aggregate queries
- For COIN-M perpetual / delivery futures market data, use \`htx/futures-market\`
- For specialized data such as funding rate, open interest, liquidations, see the dedicated skill (\`htx/funding-rate\` / \`htx/oi-tracker\` / \`htx/liquidation-stream\`)

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install spot-market
\`\`\`

## Related docs

- HTX official API: https://huobiapi.github.io/docs/spot/v1/cn/
- Full README: ./README.md
`,
  "spot-trading/SKILL.md": `---
name: htx/spot-trading
version: 2.0.0
description: HTX spot trading — limit / market orders / cancel / modify / order query / margin lending.
auth: true
risk: high
---

# Spot Trading

Place and cancel spot orders, modify and query orders, and use margin lending.

> WARNING: **High-risk write skill**. Before every order / cancel / borrow, the AI Agent must show the user the full parameters (symbol, side, type, price, amount) and obtain explicit manual confirmation.

## Authentication and permissions

- API Key needs **trade** permission
- Some query endpoints only need **read** permission
- API Key is used locally only and never uploaded

## Endpoint catalog (11)

### Place / cancel orders (core write operations)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST | \`/v1/order/orders/place\` | Place a single order (limit / market / TP-SL / IOC / FOK) |
| 2 | POST | \`/v1/order/batch-orders\` | Batch place orders (max 10) |
| 3 | POST | \`/v1/order/orders/{order-id}/submitcancel\` | Cancel by order ID |
| 4 | POST | \`/v1/order/orders/submitCancelClientOrder\` | Cancel by client-order-id |
| 5 | POST | \`/v1/order/orders/batchcancel\` | Batch cancel (by order ID list) |
| 6 | POST | \`/v1/order/orders/batchCancelOpenOrders\` | Cancel all open orders (by symbol) |

### Order query (read)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 7 | GET | \`/v1/order/openOrders\` | Current open orders |
| 8 | GET | \`/v1/order/orders/{order-id}\` | Single-order detail |
| 9 | GET | \`/v1/order/orders\` | Historical orders (by time window) |
| 10 | GET | \`/v1/order/matchresults\` | Historical trade detail |

### Margin lending

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 11 | POST | \`/v1/margin/orders\` | Borrow margin funds (write) |

## Order parameters (core)

\`\`\`json
{
  "account-id": "<spot-account-id>",
  "symbol": "btcusdt",
  "type": "buy-limit | sell-limit | buy-market | sell-market | buy-ioc | sell-ioc | buy-limit-fok | sell-limit-fok",
  "amount": "0.001",
  "price": "65000.00",
  "client-order-id": "<optional 32 chars>",
  "source": "spot-api"
}
\`\`\`

- \`buy-limit\` / \`sell-limit\`: limit order, must include \`price\`
- \`buy-market\` / \`sell-market\`: market order. **Buy** \`amount\` = USDT amount; **sell** \`amount\` = base currency quantity
- \`buy-ioc\` / \`sell-ioc\`: immediate-or-cancel; cancels the remainder
- \`buy-limit-fok\` / \`sell-limit-fok\`: fill-or-kill

## Workflow patterns

### Limit buy order

\`\`\`bash
htx-cli spot trading place \\
  --account-id <id> \\
  --symbol btcusdt --type buy-limit \\
  --price 65000 --amount 0.001 \\
  --json
\`\`\`

### Market buy 100 USDT of BTC

\`\`\`bash
# market buy: amount = quote currency (USDT) amount
htx-cli spot trading place \\
  --account-id <id> \\
  --symbol btcusdt --type buy-market \\
  --amount 100 \\
  --json
\`\`\`

### Cancel order

\`\`\`bash
htx-cli spot trading cancel <order-id> --json
\`\`\`

### Cancel all BTC/USDT open orders

\`\`\`bash
htx-cli spot call /v1/order/orders/batchCancelOpenOrders \\
  --method POST --auth \\
  --body '{"account-id":"<id>","symbol":"btcusdt"}' --json
\`\`\`

### Query current open orders

\`\`\`bash
htx-cli spot trading open-orders --symbol btcusdt --json
\`\`\`

## Safety constraints (must read)

Before every order, the AI Agent **MUST**:

1. Display the full order: symbol, side (buy/sell), type (limit/market), amount, limit price, estimated trade value, current order book price (reference)
2. Wait for explicit manual confirmation ("confirm / yes / place order" etc.)
3. Only call the API after confirmation is received

For every cancel:
- Single cancel: show order ID + remaining amount + price
- Batch cancel: show number of affected orders + symbols involved

For every borrow:
- Show currency, amount, current rate, potential risks
- Strongly recommend first checking spot account balance to confirm whether borrowing is necessary

## Error handling

- \`account-frozen\` — account frozen, halt operation
- \`order-amountmin-error\` — amount below minimum order size; check \`min-order-amt\` via \`htx-cli spot-market symbols\`
- \`order-pricemin-error\` — price precision error; check \`price-precision\`
- Some errors are due to rate limiting: max ~10 orders/s; on failure, back off 1s and retry

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install spot-trading
\`\`\`

## Related docs

- HTX spot trading API: https://huobiapi.github.io/docs/spot/v1/cn/#orders
`,
  "ta-master/SKILL.md": `---
name: htx/ta-master
version: 1.0.0
description: HTX technical analysis master — three-pillar weighted scoring (price/volume 50% + derivatives 30% + BTC cycle 20%) yielding a 0-100 composite score with detailed interpretation.
auth: false
risk: low
---

# Technical Analysis Master

Layer 2 orchestration skill, **no API key required**. Composes 6 L1 skills into a three-pillar score and provides a 0-100 composite read.

> **Compliance disclaimer**: the score is a mechanical algorithmic output and **does not constitute investment advice**. Markets carry risk; all decisions are made by the user.

## Three-pillar scoring framework

| Pillar | Weight | Data source | Output |
|---|---|---|---|
| Price/Volume | **50%** | \`htx/technical-analysis\` (51 indicators + 12 patterns + divergences) | 0-100 sub-score |
| Derivatives | **30%** | \`funding-rate\` / \`oi-tracker\` / \`liquidation-stream\` / \`elite-positioning\` / \`mark-price\` | 0-100 sub-score |
| BTC cycle | **20%** | \`htx/technical-analysis cycle.py\` (BTC-USDT only) | 0-100 sub-score |

For non-BTC assets the weights are auto-redistributed to price/volume 62.5% + derivatives 37.5%.

## Composite score interpretation

| Composite score | Label |
|---|---|
| ≥ 70 | **STRONG BULLISH** |
| 55-70 | MILD BULLISH |
| 45-55 | NEUTRAL |
| 30-45 | MILD BEARISH |
| < 30 | **STRONG BEARISH** |

## Workflow

### Full version (BTC, three pillars)

\`\`\`bash
# 1. Pull daily klines (cycle pillar needs 350+ daily klines)
htx-cli spot-market kline -p symbol=btcusdt -p period=1day -p size=400 | jq '.data' > /tmp/btc1d.json
htx-cli spot-market kline -p symbol=btcusdt -p period=4hour -p size=300 | jq '.data' > /tmp/btc4h.json

# 2. Compute price/volume features → pv.json
python -c "
import json
import indicators, patterns
df = indicators._df(json.load(open('/tmp/btc4h.json')))
out = {
    'rsi': indicators.rsi(df)['rsi'].iloc[-1],
    'macd_hist': indicators.macd(df)['macd'].iloc[-1],
    'ema_fast': indicators.ema(df, periods=(20,))['ema20'].iloc[-1],
    'ema_slow': indicators.ema(df, periods=(60,))['ema60'].iloc[-1],
    'adx': indicators.adx(df)['adx'].iloc[-1],
    'divergence': str(indicators.divergence(df)['divergence'].iloc[-1]),
    'patterns_bullish_count': sum(1 for p in patterns.scan(df) if p.startswith('bull') or p in ('three-soldiers','inverted-hammer')),
    'patterns_bearish_count': sum(1 for p in patterns.scan(df) if p.startswith('bear') or p in ('three-crows','shooting-star','hanging-man')),
}
json.dump(out, open('/tmp/pv.json', 'w'))
"

# 3. Pull derivatives → deriv.json
htx-cli funding-rate current -p contract_code=BTC-USDT --json > /tmp/fr.json
htx-cli oi-tracker history -p contract_code=BTC-USDT -p period=60min -p size=24 --json > /tmp/oi.json
htx-cli liquidation-stream recent -p contract=BTC-USDT --json > /tmp/liq.json
htx-cli elite-positioning ratio -p contract_code=BTC-USDT --json > /tmp/elite.json
htx-cli mark-price basis -p contract_code=BTC-USDT --json > /tmp/basis.json
# Then aggregate into deriv.json (see references/derivatives-features.md)

# 4. Compute cycle pillar → cycle.json (BTC only)
python scripts/cycle.py all --kline /tmp/btc1d.json > /tmp/cycle_raw.json
# Extract key fields into cycle.json: ahr999 / mayer / pi_cycle_signal / rainbow_band

# 5. Three-pillar combined score
python scripts/scoring.py --pricevol /tmp/pv.json --derivatives /tmp/deriv.json --cycle /tmp/cycle.json
\`\`\`

### Simple version (non-BTC, two pillars)

\`\`\`bash
python scripts/scoring.py --pricevol pv.json --derivatives deriv.json
\`\`\`

Example output (BTC full three-pillar):

\`\`\`json
{
  "composite": {
    "composite": 62.4,
    "label": "MILD BULLISH",
    "weights": {"pv": 0.5, "deriv": 0.3, "cycle": 0.2}
  },
  "pillars": {
    "price_volume": {
      "score": 65.0,
      "notes": ["RSI 58.3 bullish", "MACD hist > 0", "EMA fast > slow (uptrend)"]
    },
    "derivatives": {
      "score": 55.0,
      "notes": ["Funding 0.012% — bullish bias", "Elite L/S 1.18 — leaning long"]
    },
    "cycle": {
      "score": 70.0,
      "notes": ["AHR999 1.05 — DCA zone", "Mayer 1.32 — fair", "Rainbow: HODL!"]
    }
  }
}
\`\`\`

## Scoring details

See \`scripts/scoring.py\` for the source. Each pillar lists its contributing items and notes.

### Price/volume pillar items

| Signal | Add / subtract |
|---|---|
| RSI > 70 (overbought) | -10 |
| RSI > 55 (bullish-leaning) | +5 |
| RSI < 30 (oversold) | +10 |
| RSI < 45 (bearish-leaning) | -5 |
| MACD hist > 0 / < 0 | ±7 |
| EMA fast above / below slow | ±8 |
| ADX > 25 | strong-trend amplifier (no direct score) |
| Bullish regular divergence (\`bull_reg\`) | +12 |
| Bearish regular divergence (\`bear_reg\`) | -12 |
| Bullish / bearish hidden divergence | ±6 |
| Each bullish pattern | +4 |
| Each bearish pattern | -4 |

### Derivatives pillar items

| Signal | Add / subtract |
|---|---|
| Funding > 0.05% | -12 (longs overheated) |
| Funding < -0.05% | +12 (shorts overheated) |
| OI 24h +15% | -8 (squeeze risk) |
| OI 24h -10% | -6 (capital exiting) |
| Elite L/S > 1.5 | +10 (smart money long) |
| Elite L/S < 0.7 | -10 (smart money short) |
| 1h long-liquidation share > 80% | +8 (bottom signal) |
| 1h short-liquidation share > 80% | -8 (top signal) |
| Basis deviation ±0.5% | ±4 |

### BTC cycle pillar items

| Signal | Add / subtract |
|---|---|
| AHR999 < 0.45 | +20 (bottom-fishing zone) |
| AHR999 > 1.6 | -20 (bubble warning) |
| Pi Cycle TOP triggered | -25 WARNING |
| Mayer < 1 | +8 |
| Mayer > 2.4 | -12 |
| Rainbow in Fire Sale / BUY / Accumulate | +10 |
| Rainbow in FOMO / Sell / Bubble | -10 |

## Data gaps (honest disclosure)

ta-master **does not cover** the following indicators (HTX provides no native endpoint; paid data sources are required):

| Gap | Source |
|---|---|
| MVRV / NUPL / SOPR | Glassnode (on-chain) |
| Hash Ribbon / miner hashrate | Mempool.space |
| LTH/STH supply | Glassnode |
| All-account long/short ratio (retail breakdown) | HTX only provides the elite breakdown |
| Taker active buy/sell volume | Not provided by HTX |
| Liquidation heatmap density | We aggregate from the local liquidation order stream; density is lower than Coinglass |

Future option: integrate via \`--external-source glassnode\` etc.

## Dependent skills

Before installing this skill, ensure the following are installed:
- \`htx/spot-market\` (kline source)
- \`htx/futures-market\` (kline source)
- \`htx/technical-analysis\` (indicator computation engine)
- \`htx/funding-rate\`
- \`htx/oi-tracker\`
- \`htx/liquidation-stream\`
- \`htx/elite-positioning\`
- \`htx/mark-price\`

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install ta-master
\`\`\`

## Typical questions

- "How does BTC look right now combining technicals + derivatives + cycle?"
- "ETH 4H composite score"
- "Market-wide scan, give me coins with ta-master score > 70"
- "Judge BTC right now using AHR999 + funding rate + RSI together"
`,
  "ta-master/scripts/scoring.py": `"""ta-master — three-pillar weighted scoring (0-100 composite).

Pillars:
  1. Price & Volume (50% weight): RSI / MACD / trend / divergence / patterns
  2. Derivatives (30% weight): funding rate / OI delta / liquidation / elite L/S / basis
  3. Macro Cycle (20% weight, BTC only): AHR999 / Mayer / Pi Cycle / Rainbow band

Each pillar produces a 0-100 sub-score, composite = weighted sum.
> 70 = bullish strong  | 30-70 = neutral  | < 30 = bearish strong

Usage:
    python scoring.py --pricevol pv.json --derivatives deriv.json [--cycle cycle.json]

Each input is a JSON file produced by the corresponding L1 skill.
"""
import argparse, json, sys


# ============ Pillar 1: Price & Volume scoring ============
def score_pricevol(data: dict) -> dict:
    """Score 0-100. Higher = bullish.
    Expects: rsi, macd_hist, ema_fast, ema_slow, adx, divergence, patterns_bullish_count, patterns_bearish_count
    """
    score = 50.0  # neutral baseline
    notes = []

    rsi = data.get("rsi")
    if rsi is not None:
        if rsi > 70:    score -= 10; notes.append(f"RSI {rsi:.1f} overbought")
        elif rsi > 55:  score += 5;  notes.append(f"RSI {rsi:.1f} bullish")
        elif rsi < 30:  score += 10; notes.append(f"RSI {rsi:.1f} oversold")
        elif rsi < 45:  score -= 5;  notes.append(f"RSI {rsi:.1f} bearish")

    macd_hist = data.get("macd_hist")
    if macd_hist is not None:
        if macd_hist > 0: score += 7;  notes.append("MACD hist > 0")
        else:             score -= 7;  notes.append("MACD hist < 0")

    fast, slow = data.get("ema_fast"), data.get("ema_slow")
    if fast and slow:
        if fast > slow: score += 8;  notes.append("EMA fast > slow (uptrend)")
        else:           score -= 8;  notes.append("EMA fast < slow (downtrend)")

    adx = data.get("adx")
    if adx is not None and adx > 25:
        notes.append(f"ADX {adx:.1f} strong trend (amplifies signal)")
        # ADX is a strength multiplier, not direction — already captured by EMA

    div = data.get("divergence")
    if div == "bull_reg":  score += 12; notes.append("Bullish regular divergence")
    elif div == "bear_reg": score -= 12; notes.append("Bearish regular divergence")
    elif div == "bull_hid": score += 6;  notes.append("Bullish hidden divergence")
    elif div == "bear_hid": score -= 6;  notes.append("Bearish hidden divergence")

    bull_p = data.get("patterns_bullish_count", 0)
    bear_p = data.get("patterns_bearish_count", 0)
    score += 4 * bull_p
    score -= 4 * bear_p
    if bull_p: notes.append(f"{bull_p} bullish pattern(s)")
    if bear_p: notes.append(f"{bear_p} bearish pattern(s)")

    score = max(0, min(100, score))
    return {"score": round(score, 1), "notes": notes}


# ============ Pillar 2: Derivatives scoring ============
def score_derivatives(data: dict) -> dict:
    score = 50.0
    notes = []

    funding = data.get("funding_rate")
    if funding is not None:
        if funding > 0.0005:    score -= 12; notes.append(f"Funding {funding*100:.3f}% — longs overpaying")
        elif funding > 0.0002:  score -= 5;  notes.append(f"Funding {funding*100:.3f}% — bullish bias")
        elif funding < -0.0005: score += 12; notes.append(f"Funding {funding*100:.3f}% — shorts overpaying")
        elif funding < -0.0002: score += 5;  notes.append(f"Funding {funding*100:.3f}% — bearish bias")

    oi_delta_24h = data.get("oi_delta_pct_24h")
    if oi_delta_24h is not None:
        if oi_delta_24h > 15:  score -= 8;  notes.append(f"OI surged +{oi_delta_24h:.1f}% — squeeze risk")
        elif oi_delta_24h > 5: score += 4;  notes.append(f"OI rising +{oi_delta_24h:.1f}%")
        elif oi_delta_24h < -10: score -= 6; notes.append(f"OI dropped {oi_delta_24h:.1f}% — capitulation/exit")

    elite_ls = data.get("elite_long_short_ratio")
    if elite_ls is not None:
        if elite_ls > 1.5:    score += 10; notes.append(f"Elite L/S {elite_ls:.2f} — smart money long")
        elif elite_ls > 1.1:  score += 4;  notes.append(f"Elite L/S {elite_ls:.2f} — leaning long")
        elif elite_ls < 0.7:  score -= 10; notes.append(f"Elite L/S {elite_ls:.2f} — smart money short")
        elif elite_ls < 0.9:  score -= 4;  notes.append(f"Elite L/S {elite_ls:.2f} — leaning short")

    liq_long_1h = data.get("liq_long_usd_1h", 0)
    liq_short_1h = data.get("liq_short_usd_1h", 0)
    if liq_long_1h + liq_short_1h > 0:
        ratio = liq_long_1h / (liq_long_1h + liq_short_1h)
        if ratio > 0.8:    score += 8;  notes.append(f"Long liq {ratio*100:.0f}% — bottom signal")
        elif ratio < 0.2:  score -= 8;  notes.append(f"Short liq {(1-ratio)*100:.0f}% — top signal")

    basis = data.get("basis_pct")
    if basis is not None:
        if abs(basis) > 1.0:  notes.append(f"Basis {basis:+.2f}% — extreme")
        if basis > 0.5:       score -= 4; notes.append("Premium too high")
        elif basis < -0.5:    score += 4; notes.append("Discount — accumulation hint")

    score = max(0, min(100, score))
    return {"score": round(score, 1), "notes": notes}


# ============ Pillar 3: Macro Cycle (BTC only) ============
def score_cycle(data: dict) -> dict:
    score = 50.0
    notes = []

    ahr = data.get("ahr999")
    if ahr is not None:
        if ahr < 0.45:    score += 20; notes.append(f"AHR999 {ahr:.3f} — accumulate zone")
        elif ahr < 1.2:   score += 5;  notes.append(f"AHR999 {ahr:.3f} — DCA zone")
        elif ahr < 1.6:   score -= 10; notes.append(f"AHR999 {ahr:.3f} — elevated")
        else:             score -= 20; notes.append(f"AHR999 {ahr:.3f} — bubble warning")

    mayer = data.get("mayer")
    if mayer is not None:
        if mayer < 1.0:    score += 8;  notes.append(f"Mayer {mayer:.2f} — undervalued")
        elif mayer < 1.5:  pass
        elif mayer < 2.0:  score -= 5;  notes.append(f"Mayer {mayer:.2f} — elevated")
        else:              score -= 12; notes.append(f"Mayer {mayer:.2f} — overheated")

    pi_signal = data.get("pi_cycle_signal")
    if pi_signal == "TOP_SIGNAL":  score -= 25; notes.append("Pi Cycle TOP signal triggered ⚠️")
    elif pi_signal == "near_top":  score -= 8;  notes.append("Pi Cycle near top")

    band = data.get("rainbow_band")
    if band:
        bull_bands = ("Fire Sale", "BUY!", "Accumulate")
        bear_bands = ("FOMO Intensifies", "Sell. Seriously.", "Maximum Bubble")
        if band in bull_bands:    score += 10; notes.append(f"Rainbow: {band}")
        elif band in bear_bands:  score -= 10; notes.append(f"Rainbow: {band}")

    score = max(0, min(100, score))
    return {"score": round(score, 1), "notes": notes}


# ============ Composite ============
def compose(pv_score, deriv_score, cycle_score=None, weights=None):
    if cycle_score is None:
        # Without cycle, redistribute its 20% to 50/50 split between pv and deriv
        weights = weights or {"pv": 0.625, "deriv": 0.375}
        composite = pv_score * weights["pv"] + deriv_score * weights["deriv"]
    else:
        weights = weights or {"pv": 0.5, "deriv": 0.3, "cycle": 0.2}
        composite = (pv_score * weights["pv"]
                     + deriv_score * weights["deriv"]
                     + cycle_score * weights["cycle"])
    if composite >= 70:    label = "STRONG BULLISH"
    elif composite >= 55:  label = "MILD BULLISH"
    elif composite > 45:   label = "NEUTRAL"
    elif composite > 30:   label = "MILD BEARISH"
    else:                  label = "STRONG BEARISH"
    return {"composite": round(composite, 1), "label": label, "weights": weights}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--pricevol", required=True, help="JSON file with price-volume features")
    p.add_argument("--derivatives", required=True, help="JSON file with derivatives features")
    p.add_argument("--cycle", help="JSON file with cycle features (BTC only, optional)")
    args = p.parse_args()

    pv = json.load(open(args.pricevol))
    deriv = json.load(open(args.derivatives))
    cycle = json.load(open(args.cycle)) if args.cycle else None

    pv_res = score_pricevol(pv)
    deriv_res = score_derivatives(deriv)
    cycle_res = score_cycle(cycle) if cycle else None

    composite = compose(
        pv_res["score"],
        deriv_res["score"],
        cycle_res["score"] if cycle_res else None,
    )

    out = {
        "composite": composite,
        "pillars": {
            "price_volume": pv_res,
            "derivatives": deriv_res,
        },
    }
    if cycle_res:
        out["pillars"]["cycle"] = cycle_res

    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
`,
  "technical-analysis/SKILL.md": `---
name: htx/technical-analysis
version: 3.0.0
description: HTX technical indicator analysis engine — 51 indicators + 12 candlestick patterns + 5 BTC cycle indicators + automatic divergence detection, all computed locally in Python.
auth: false
risk: low
---

# Technical Analysis — Indicator Engine v3

Local computation engine, **no API key required**. Pulls data from HTX kline endpoints and computes indicators / patterns / cycles locally with numpy/pandas.

> **Compliance disclaimer**: this skill provides raw indicator values and does not embed any strategy recommendations or trading advice. All decisions are made by the user based on their own risk tolerance.

## Capability overview

| Category | Count | File |
|---|---|---|
| Moving averages | 8 (ma, ema, wma, dema, tema, hma, kama, zlema) | \`scripts/indicators.py\` |
| Trend | 8 (macd, adx, aroon, cci, supertrend, sar, dpo, envelope) | same |
| Momentum | 10 (rsi, stoch-rsi, stoch, kdj, roc, mom, ppo, trix, wr, uo) | same |
| Volatility | 8 (bb, bbwidth, bbpct, atr, keltner, donchian, hv, stddev) | same |
| Volume | 6 (obv, vwap, mvwap, cmf, mfi, ad) | same |
| Statistics | 5 (lr, slope, angle, variance, sigma) | same |
| Other | 5 (fisher, tr, tp, mp, cho) + divergence | same |
| **Candlestick patterns** | 12 (doji / engulfing / harami / 3-soldiers / 3-crows ...) | \`scripts/patterns.py\` |
| **BTC cycle** | 5 (ahr999 / ahr999x / rainbow / pi-cycle / mayer) | \`scripts/cycle.py\` |
| **Indicator total** | **51 indicators + 12 patterns + 5 cycles = 68** | |

## Quick start

### Pull klines + compute indicators

\`\`\`bash
# 1. Pull BTC/USDT 4-hour klines
htx-cli spot-market kline -p symbol=btcusdt -p period=4hour -p size=300 \\
  | jq '.data' > /tmp/btc4h.json

# 2. Compute RSI
python scripts/indicators.py rsi --kline /tmp/btc4h.json --params 14
# → {"rsi": 62.4, "ts": 1779000000000}

# 3. Compute MACD (default 12,26,9)
python scripts/indicators.py macd --kline /tmp/btc4h.json
# → {"dif": 320.1, "dea": 245.3, "macd": 149.6, "ts": ...}

# 4. Scan all candlestick patterns
python scripts/patterns.py scan --kline /tmp/btc4h.json
# → {"patterns": ["doji", "bull-engulf"], "ts": ...}

# 5. BTC cycle one-shot full run
python scripts/cycle.py all --kline /tmp/btc1d.json
\`\`\`

### List all indicators

\`\`\`bash
python scripts/indicators.py list
# → ["ma", "ema", "rsi", "macd", "supertrend", ...]
\`\`\`

## Command reference

See \`references/\`:
- \`references/indicators.md\` — parameters / return fields / formulas for the 51 technical indicators
- \`references/patterns.md\` — judgment rules and typical scenarios for the 12 candlestick patterns
- \`references/cycle.md\` — formulas and interpretation ranges for the 5 BTC cycle indicators
- \`references/divergence.md\` — automatic divergence detection algorithm and usage notes

## Automatic divergence detection

\`\`\`bash
python scripts/indicators.py divergence --kline /tmp/btc4h.json --params 14
# → {"divergence": "bull_reg", ...}
\`\`\`

Return values:
- \`bull_reg\` — price makes a new low, indicator does not (**bottom reversal signal**)
- \`bear_reg\` — price makes a new high, indicator does not (**top reversal signal**)
- \`bull_hid\` — price makes a higher low, indicator a lower low (**pullback within uptrend**)
- \`bear_hid\` — price makes a lower high, indicator a higher high (**bounce within downtrend**)

## BTC cycle indicators (BTC-USDT only)

All 5 indicators are based on price + time formulas; no on-chain data required:

| Indicator | Use | Interpretation |
|---|---|---|
| \`ahr999\` | DCA timing | <0.45 bottom-fish / 0.45-1.2 DCA / >1.2 top warning |
| \`ahr999x\` | Pure cycle signal | Ratio vs fitted curve |
| \`rainbow\` | 9-band rainbow valuation | "Fire Sale" → "Maximum Bubble" |
| \`pi-cycle\` | Cycle-top warning | 111d MA crosses above 350d MA × 2 = historical top |
| \`mayer\` | Long-term valuation | <1 undervalued / >2.4 historical bubble |

## Data requirements

| Indicator type | Min klines |
|---|---|
| Short-period (RSI 14, MACD 26, ATR 14) | 50 bars |
| Long-period (MA200, KAMA) | 200+ bars |
| BTC cycle (Pi Cycle 350d, Mayer 200d) | 350+ daily klines |
| Divergence detection | 50+ bars |

## Typical scenarios

**"How does BTC 4H look technically?"**
\`\`\`bash
htx-cli spot-market kline -p symbol=btcusdt -p period=4hour -p size=200 | jq '.data' > btc.json
python scripts/indicators.py rsi --kline btc.json
python scripts/indicators.py macd --kline btc.json
python scripts/indicators.py supertrend --kline btc.json
python scripts/patterns.py scan --kline btc.json
python scripts/indicators.py divergence --kline btc.json
# AI synthesizes all outputs to make a judgment
\`\`\`

**"Is ETH overbought?"**
\`\`\`bash
python scripts/indicators.py rsi --kline eth4h.json
# rsi > 70 means overbought
\`\`\`

**"BTC long-term valuation right now"**
\`\`\`bash
htx-cli spot-market kline -p symbol=btcusdt -p period=1day -p size=400 | jq '.data' > btc1d.json
python scripts/cycle.py all --kline btc1d.json
\`\`\`

## Relationship with other skills

- **Data source**: depends on \`htx/spot-market\` or \`htx/futures-market\` for klines
- **Upper-layer orchestration**: invoked by \`htx/ta-master\` as the "price/volume" pillar

## Installation

\`\`\`bash
npx -y @sheerl/htx-cli skill install technical-analysis
\`\`\`
`,
  "technical-analysis/references/cycle.md": `# BTC Cycle Indicator Reference

All 5 indicators are based purely on BTC historical price + time formulas (genesis date 2009-01-03), with no on-chain data required. **Applicable to BTC-USDT only**.

\`\`\`bash
python scripts/cycle.py <name> --kline btc1d.json
python scripts/cycle.py all --kline btc1d.json   # run all at once
\`\`\`

## AHR999

\`\`\`
AHR999 = (price / MA200) × (price / fitted_price)
fitted_price = 10 ^ (5.84 × log10(days_since_genesis) - 17.01)
\`\`\`

| Range | Meaning |
|---|---|
| < 0.45 | **Bottom-fishing zone** (accumulate) |
| 0.45 - 1.2 | DCA zone |
| > 1.2 | Top warning / bubble |

## AHR999X

Uses only the cycle factor: \`price / fitted_price\`, dropping the MA200 ratio for a purer reflection of cycle position.

## BTC Rainbow Chart

9 logarithmic valuation bands:

| Color | Name | Meaning |
|---|---|---|
| Blue | Fire Sale | Extreme undervaluation, once every 4 years |
| Light Blue | BUY! | Undervalued — buy |
| Green | Accumulate | Accumulation zone |
| Light Green | Still Cheap | Still on the cheap side |
| Yellow | HODL! | Fair value |
| Orange | Hot | Running hot |
| Red-orange | FOMO Intensifies | FOMO heating up |
| Red | Sell. Seriously. | Seriously consider trimming |
| Purple | Maximum Bubble | Extreme bubble |

## Pi Cycle Top

\`\`\`
Signal: 111-day MA crosses ABOVE 350-day MA × 2
\`\`\`

Historically all three BTC tops (2013 / 2017 / 2021) were reached within 3 days of this signal triggering. Extremely rare; once triggered it is a strong signal to reduce exposure.

## Mayer Multiple

\`\`\`
Mayer = price / 200d_MA
\`\`\`

| Range | Meaning |
|---|---|
| < 1.0 | Undervalued |
| 1.0 - 1.5 | Fair value |
| 1.5 - 2.0 | Elevated |
| 2.0 - 2.4 | Overheated |
| > 2.4 | Historical bubble zone |

## Data Requirements

- AHR999 / AHR999X / Mayer: >= 200 daily candles
- Pi Cycle: >= 350 daily candles
- Rainbow: any number
- Pre-genesis prices do not exist; HTX klines are complete from 2017 onward. Earlier prices can be supplemented with a CoinMarketCap CSV
`,
  "technical-analysis/references/indicators.md": `# Technical Indicator Reference (51 indicators)

Common invocation:
\`\`\`bash
python scripts/indicators.py <name> --kline <kline.json> [--params <p1,p2,...>] [--list] [--limit 10]
\`\`\`

\`--list\` returns the historical series (last 10 bars by default); without it, returns only the latest value.

## Moving Averages (8)

| Name | Default params | Returned fields | Use |
|---|---|---|---|
| \`ma\` | \`5,20,60\` | \`ma5, ma20, ma60\` | Simple MA, multi-period overlay for trend |
| \`ema\` | \`5,20\` | \`ema5, ema20\` | Exponential MA, weighted toward recent data |
| \`wma\` | \`20\` | \`wma\` | Linear weighted MA |
| \`dema\` | \`20\` | \`dema\` | Double EMA, reduced lag |
| \`tema\` | \`20\` | \`tema\` | Triple EMA, more aggressive |
| \`hma\` | \`20\` | \`hma\` | Hull MA, smooth and responsive |
| \`kama\` | \`10\` | \`kama\` | Adaptive MA: tracks trends, calm in chop |
| \`zlema\` | \`20\` | \`zlema\` | Zero-lag EMA |

## Trend (8)

| Name | Params | Returns | Use |
|---|---|---|---|
| \`macd\` | \`12,26,9\` | \`dif, dea, macd\` | Classic trend + momentum, golden/death cross |
| \`adx\` | \`14\` | \`adx, plus_di, minus_di\` | Trend strength, >25 = strong trend |
| \`aroon\` | \`14\` | \`aroon_up, aroon_down, aroon_osc\` | Identifies start/end of trends |
| \`cci\` | \`20\` | \`cci\` | Commodity Channel Index, +/-100 typical thresholds |
| \`supertrend\` | \`10,3\` | \`supertrend, direction\` | Trend-following + buy/sell signals |
| \`sar\` | — | \`sar\` | Parabolic SAR |
| \`dpo\` | \`20\` | \`dpo\` | Detrended Price Oscillator |
| \`envelope\` | \`20,0.1\` | \`upper, middle, lower\` | Simple envelope |

## Momentum (10)

| Name | Params | Returns | Use |
|---|---|---|---|
| \`rsi\` | \`14\` | \`rsi\` | Relative Strength, >70 overbought / <30 oversold |
| \`stoch-rsi\` | \`14\` | \`k, d\` | Stochastic of RSI |
| \`stoch\` | \`14,3,3\` | \`k, d\` | Stochastic |
| \`kdj\` | \`9,3,3\` | \`k, d, j\` | Most common in Chinese markets |
| \`roc\` | \`12\` | \`roc\` | Rate of change |
| \`mom\` | \`10\` | \`mom\` | Momentum (difference) |
| \`ppo\` | \`12,26,9\` | \`ppo, signal, hist\` | Percentage Price Oscillator |
| \`trix\` | \`15\` | \`trix\` | Triple-smoothed momentum |
| \`wr\` | \`14\` | \`wr\` | Williams %R |
| \`uo\` | \`7,14,28\` | \`uo\` | Ultimate Oscillator |

## Volatility (8)

| Name | Params | Returns | Use |
|---|---|---|---|
| \`bb\` (alias \`boll\`) | \`20,2\` | \`upper, middle, lower\` | Bollinger Bands |
| \`bbwidth\` | \`20,2\` | \`bbwidth\` | Bollinger Band Width, squeeze detection |
| \`bbpct\` | \`20,2\` | \`bbpct\` | Bollinger %B (position) |
| \`atr\` | \`14\` | \`atr\` | Average True Range, used for stops |
| \`keltner\` | \`20,2\` | \`upper, middle, lower\` | Keltner Channel |
| \`donchian\` | \`20\` | \`upper, middle, lower\` | Donchian Channel |
| \`hv\` | \`20\` | \`hv\` | Historical Volatility (annualized) |
| \`stddev\` | \`20\` | \`stddev\` | Standard deviation |

## Volume (6)

| Name | Returns | Use |
|---|---|---|
| \`obv\` | \`obv\` | Volume accumulation |
| \`vwap\` | \`vwap\` | Volume-Weighted Average Price |
| \`mvwap\` | \`mvwap\` | Rolling VWAP |
| \`cmf\` | \`cmf\` | Chaikin Money Flow |
| \`mfi\` | \`mfi\` | Money Flow Index |
| \`ad\` | \`ad\` | Accumulation/Distribution Line |

## Statistics (5)

| Name | Returns |
|---|---|
| \`lr\` | \`lr\` (Linear Regression endpoint) |
| \`slope\` | \`slope\` |
| \`angle\` | \`angle_deg\` |
| \`variance\` | \`variance\` |
| \`sigma\` | \`sigma\` (z-score) |

## Other (5)

| Name | Returns |
|---|---|
| \`fisher\` | \`fisher, trigger\` |
| \`tr\` | True Range |
| \`tp\` | Typical Price |
| \`mp\` | Median Price |
| \`cho\` | Chaikin Oscillator |

## Parameter Notes

- Most indicators take a single period via \`--params 14\`
- \`macd\` / \`ppo\` / \`kdj\` take 3 values: \`--params 12,26,9\`
- \`supertrend\` takes \`--params 10,3\` (period, multiplier)
- \`bb\` / \`envelope\` take \`--params 20,2\` (period, dev)
`,
  "technical-analysis/references/patterns.md": `# Candlestick Pattern Recognition (12 patterns)

\`\`\`bash
python scripts/patterns.py <name> --kline kline.json [--list]
python scripts/patterns.py scan --kline kline.json   # scan all, return latest matches
\`\`\`

Returns \`{"match": true|false, "ts": ...}\` or in scan mode \`{"patterns": ["doji", "bull-engulf"], "ts": ...}\`.

## 12 Patterns

### Reversal

| Name | Signal | Criteria |
|---|---|---|
| \`doji\` | Neutral / reversal hint | Body < 10% of shadow |
| \`hanging-man\` | Top reversal | End of uptrend, small body + long lower shadow |
| \`inverted-hammer\` | Bottom reversal | End of downtrend, small body + long upper shadow |
| \`shooting-star\` | Top reversal | End of uptrend, small body + long upper shadow |
| \`bull-engulf\` | Bullish engulfing | Long bullish candle fully engulfs prior bearish candle |
| \`bear-engulf\` | Bearish engulfing | Long bearish candle fully engulfs prior bullish candle |

### Harami

| Name | Signal | Criteria |
|---|---|---|
| \`bull-harami\` | Bullish harami | Small bullish candle fully contained within prior large bearish candle |
| \`bear-harami\` | Bearish harami | Small bearish candle fully contained within prior large bullish candle |
| \`bull-harami-cross\` | Strengthened bullish | bull-harami where the small bullish candle is a doji |
| \`bear-harami-cross\` | Strengthened bearish | bear-harami where the small bearish candle is a doji |

### Continuation

| Name | Signal | Criteria |
|---|---|---|
| \`three-soldiers\` | Strong bullish | 3 consecutive bullish candles, each closing above the previous, small upper shadows |
| \`three-crows\` | Strong bearish | 3 consecutive bearish candles, each closing below the previous, small lower shadows |

## Usage Tips

- **Pattern != Signal**: A standalone pattern is not a tradable signal; it must be combined with context (trend / key levels / volume)
- **Multi-timeframe confirmation**: If bull-engulf appears on 1H, first check whether the 4H trend agrees
- **Location matters**: bull-engulf at support / historical bottom > bull-engulf in the middle of a range
- **Combine with divergence**: Pattern + RSI bullish divergence = high-probability reversal

## Integration with ta-master

ta-master accumulates pattern matches in the "Price-Volume Score Pillar":
- Bullish pattern match: +4 points each
- Bearish pattern match: -4 points each
`,
  "technical-analysis/scripts/cycle.py": `"""BTC macro cycle indicators that only need price history (no on-chain data).

Implements: AHR999, AHR999X, BTC Rainbow Chart, Pi Cycle Top, Mayer Multiple.
All formulas are public.

CLI:
    python cycle.py <indicator> --kline btc_kline.json
    python cycle.py all --kline btc_kline.json
"""
import argparse, json, math, sys
from datetime import datetime, timezone

import numpy as np
import pandas as pd


# Bitcoin genesis block: 2009-01-03 UTC
GENESIS_TS_MS = int(datetime(2009, 1, 3, tzinfo=timezone.utc).timestamp() * 1000)


def _df(kline):
    df = pd.DataFrame(kline).sort_values("id").reset_index(drop=True)
    df["close"] = df["close"].astype(float)
    df["high"] = df["high"].astype(float)
    df["low"] = df["low"].astype(float)
    return df


def _days_since_genesis(ts_ms: int) -> float:
    return max((ts_ms - GENESIS_TS_MS) / (1000 * 86400), 1)


# ============ AHR999 ============
# AHR999 = (price / 200d_avg) * (price / fitted_price)
# fitted_price = 10 ** (5.84 * log10(days) - 17.01)
# Source: ahr999, public formula on Bilibili / weibo
def ahr999(df):
    if len(df) < 200:
        return {"ahr999": None, "zone": "insufficient data (need 200+ bars)"}
    price = df["close"].iloc[-1]
    ma200 = df["close"].rolling(200).mean().iloc[-1]
    days = _days_since_genesis(int(df["id"].iloc[-1]))
    fitted = 10 ** (5.84 * math.log10(days) - 17.01)
    val = (price / ma200) * (price / fitted)
    if val < 0.45:
        zone = "accumulate"
    elif val < 1.2:
        zone = "DCA"
    else:
        zone = "bubble warning"
    return {"ahr999": round(val, 4), "zone": zone, "price": price, "ma200": round(ma200, 2), "fitted": round(fitted, 2)}


# ============ AHR999X (variant focusing only on the cycle factor) ============
def ahr999x(df):
    """AHR999X = price / fitted_price (drop the MA200 ratio for purer cycle signal)."""
    if len(df) < 1:
        return {"ahr999x": None}
    price = df["close"].iloc[-1]
    days = _days_since_genesis(int(df["id"].iloc[-1]))
    fitted = 10 ** (5.84 * math.log10(days) - 17.01)
    val = price / fitted
    return {"ahr999x": round(val, 4), "fitted": round(fitted, 2), "price": price}


# ============ BTC Rainbow Chart ============
# 9 logarithmic bands derived from the long-term BTC price growth curve.
# Each band is a multiplier applied to a base log-fit:
#   base = 10 ** (a * ln(days) + b)  with a ≈ 2.66, b ≈ -17.9
# Bands (multipliers, low to high): see below.
def rainbow(df):
    if len(df) < 1:
        return {"band": None}
    price = df["close"].iloc[-1]
    days = _days_since_genesis(int(df["id"].iloc[-1]))
    base = 10 ** (2.66 * math.log10(days) - 17.9)
    multipliers = [
        ("Fire Sale",         0.4, "#3b66f0"),
        ("BUY!",              0.55, "#42c0f5"),
        ("Accumulate",        0.75, "#3ab94e"),
        ("Still Cheap",       1.0, "#a3e842"),
        ("HODL!",             1.4, "#ffe200"),
        ("Hot",               1.85, "#ff9900"),
        ("FOMO Intensifies",  2.4, "#ff5b00"),
        ("Sell. Seriously.",  3.1, "#e83a3a"),
        ("Maximum Bubble",    4.0, "#a0118f"),
    ]
    band = "Fire Sale"
    for name, mult, _ in multipliers:
        if price <= base * mult:
            band = name
            break
    else:
        band = "Maximum Bubble"
    return {"band": band, "ratio_to_base": round(price / base, 3), "fitted_base": round(base, 2)}


# ============ Pi Cycle Top ============
# Buy/sell signal: 111-day MA crosses 350-day MA × 2
def pi_cycle(df):
    if len(df) < 350:
        return {"pi_cycle": None, "note": "need 350+ days"}
    ma111 = df["close"].rolling(111).mean()
    ma350x2 = df["close"].rolling(350).mean() * 2
    last_111 = ma111.iloc[-1]
    last_350x2 = ma350x2.iloc[-1]
    prev_111 = ma111.iloc[-2]
    prev_350x2 = ma350x2.iloc[-2]
    cross_up = prev_111 < prev_350x2 and last_111 >= last_350x2
    cross_down = prev_111 > prev_350x2 and last_111 <= last_350x2
    if cross_up:
        signal = "TOP_SIGNAL"  # historically very reliable major-top warning
    elif cross_down:
        signal = "DOWN_CROSS"
    else:
        ratio = last_111 / last_350x2
        signal = "near_top" if ratio > 0.95 else "neutral"
    return {
        "ma111": round(last_111, 2),
        "ma350x2": round(last_350x2, 2),
        "ratio": round(last_111 / last_350x2, 4),
        "signal": signal,
    }


# ============ Mayer Multiple ============
# Mayer = price / 200d MA. <1 = undervalued, >2.4 historically = overvalued
def mayer(df):
    if len(df) < 200:
        return {"mayer": None, "note": "need 200+ days"}
    price = df["close"].iloc[-1]
    ma200 = df["close"].rolling(200).mean().iloc[-1]
    val = price / ma200
    if val < 1.0:
        zone = "undervalued"
    elif val < 1.5:
        zone = "fair"
    elif val < 2.0:
        zone = "elevated"
    elif val < 2.4:
        zone = "overheated"
    else:
        zone = "bubble"
    return {"mayer": round(val, 3), "ma200": round(ma200, 2), "price": price, "zone": zone}


CYCLE_INDICATORS = {
    "ahr999": ahr999,
    "ahr999x": ahr999x,
    "rainbow": rainbow,
    "pi-cycle": pi_cycle,
    "mayer": mayer,
}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("indicator", help="ahr999 / ahr999x / rainbow / pi-cycle / mayer / all")
    p.add_argument("--kline", required=True)
    args = p.parse_args()

    df = _df(json.load(open(args.kline)))

    if args.indicator == "all":
        out = {"ts": int(df["id"].iloc[-1])}
        for name, fn in CYCLE_INDICATORS.items():
            try:
                out[name] = fn(df)
            except Exception as e:
                out[name] = {"error": str(e)}
        print(json.dumps(out, indent=2)); return

    fn = CYCLE_INDICATORS.get(args.indicator)
    if fn is None:
        print(json.dumps({"error": f"Unknown: {args.indicator}",
                          "available": sorted(CYCLE_INDICATORS.keys())})); sys.exit(1)
    out = fn(df)
    out["ts"] = int(df["id"].iloc[-1])
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
`,
  "technical-analysis/scripts/indicators.py": `"""HTX Skill Hub — technical indicators (pure Python, numpy/pandas only).

50+ indicators across 7 categories. CLI:
    python indicators.py <name> --kline kline.json [--params 14] [--list]
"""
import argparse, json, math, sys
import numpy as np, pandas as pd


def _df(kline):
    df = pd.DataFrame(kline).sort_values("id").reset_index(drop=True)
    for c in ("open", "high", "low", "close", "vol", "amount"):
        if c in df: df[c] = df[c].astype(float)
    return df


def _last(d):
    out = {}
    for k, v in d.items():
        val = v.iloc[-1] if hasattr(v, "iloc") else v
        if isinstance(val, (np.floating, np.integer)): val = float(val)
        out[k] = None if (isinstance(val, float) and math.isnan(val)) else val
    return out


def _series(d, ts, limit=10):
    rows = []
    n = min(limit, len(ts))
    for i in range(len(ts) - n, len(ts)):
        row = {"ts": int(ts.iloc[i])}
        for k, v in d.items():
            val = v.iloc[i] if hasattr(v, "iloc") else v
            if isinstance(val, (np.floating, np.integer)): val = float(val)
            row[k] = None if (isinstance(val, float) and math.isnan(val)) else val
        rows.append(row)
    return rows


# ============ Moving averages (8) ============
def ma(df, periods=(5, 20, 60)):
    return {f"ma{p}": df["close"].rolling(p).mean() for p in periods}

def ema(df, periods=(5, 20)):
    return {f"ema{p}": df["close"].ewm(span=p, adjust=False).mean() for p in periods}

def wma(df, period=20):
    w = np.arange(1, period + 1)
    return {"wma": df["close"].rolling(period).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)}

def dema(df, period=20):
    e1 = df["close"].ewm(span=period, adjust=False).mean()
    return {"dema": 2 * e1 - e1.ewm(span=period, adjust=False).mean()}

def tema(df, period=20):
    e1 = df["close"].ewm(span=period, adjust=False).mean()
    e2 = e1.ewm(span=period, adjust=False).mean()
    e3 = e2.ewm(span=period, adjust=False).mean()
    return {"tema": 3 * e1 - 3 * e2 + e3}

def hma(df, period=20):
    half, sp = period // 2, int(np.sqrt(period))
    def _wma(s, n):
        w = np.arange(1, n + 1)
        return s.rolling(n).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)
    diff = 2 * _wma(df["close"], half) - _wma(df["close"], period)
    return {"hma": _wma(diff, sp)}

def kama(df, period=10, fast=2, slow=30):
    chg = (df["close"] - df["close"].shift(period)).abs()
    vol = df["close"].diff().abs().rolling(period).sum()
    er = chg / vol
    sc = (er * (2/(fast+1) - 2/(slow+1)) + 2/(slow+1)) ** 2
    out = df["close"].copy()
    for i in range(period, len(df)):
        if pd.isna(out.iloc[i-1]): out.iloc[i] = df["close"].iloc[i]
        else: out.iloc[i] = out.iloc[i-1] + sc.iloc[i] * (df["close"].iloc[i] - out.iloc[i-1])
    return {"kama": out}

def zlema(df, period=20):
    lag = (period - 1) // 2
    return {"zlema": (2*df["close"] - df["close"].shift(lag)).ewm(span=period, adjust=False).mean()}


# ============ Trend (8) ============
def macd(df, fast=12, slow=26, signal=9):
    ef = df["close"].ewm(span=fast, adjust=False).mean()
    es = df["close"].ewm(span=slow, adjust=False).mean()
    dif = ef - es
    dea = dif.ewm(span=signal, adjust=False).mean()
    return {"dif": dif, "dea": dea, "macd": (dif - dea) * 2}

def adx(df, period=14):
    h, l, c = df["high"], df["low"], df["close"]
    pdm, mdm = h.diff(), -l.diff()
    pdm = pdm.where((pdm > mdm) & (pdm > 0), 0)
    mdm = mdm.where((mdm > pdm.where(pdm == 0, 0)) & (mdm > 0), 0)
    tr = pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    atr_ = tr.ewm(span=period, adjust=False).mean()
    pdi = 100 * pdm.ewm(span=period, adjust=False).mean() / atr_
    mdi = 100 * mdm.ewm(span=period, adjust=False).mean() / atr_
    dx = 100 * (pdi - mdi).abs() / (pdi + mdi)
    return {"adx": dx.ewm(span=period, adjust=False).mean(), "plus_di": pdi, "minus_di": mdi}

def aroon(df, period=14):
    hi = df["high"].rolling(period+1).apply(lambda x: x.argmax(), raw=True)
    lo = df["low"].rolling(period+1).apply(lambda x: x.argmin(), raw=True)
    up, dn = 100*hi/period, 100*lo/period
    return {"aroon_up": up, "aroon_down": dn, "aroon_osc": up - dn}

def cci(df, period=20):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    sma = tp.rolling(period).mean()
    mad = tp.rolling(period).apply(lambda x: np.fabs(x - x.mean()).mean(), raw=True)
    return {"cci": (tp - sma) / (0.015 * mad)}

def supertrend(df, period=10, multiplier=3.0):
    h, l, c = df["high"], df["low"], df["close"]
    hl2 = (h + l) / 2
    tr = pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    atr_ = tr.ewm(span=period, adjust=False).mean()
    up, dn = hl2 + multiplier*atr_, hl2 - multiplier*atr_
    st = c.copy()
    direction = pd.Series([1]*len(df), index=df.index)
    for i in range(1, len(df)):
        if c.iloc[i] > up.iloc[i-1]: direction.iloc[i] = 1
        elif c.iloc[i] < dn.iloc[i-1]: direction.iloc[i] = -1
        else: direction.iloc[i] = direction.iloc[i-1]
        st.iloc[i] = dn.iloc[i] if direction.iloc[i] == 1 else up.iloc[i]
    return {"supertrend": st, "direction": direction.map({1: "buy", -1: "sell"})}

def sar(df, af_step=0.02, af_max=0.2):
    h, l = df["high"], df["low"]
    sar_ = pd.Series(np.nan, index=df.index)
    trend, af, ep = 1, af_step, h.iloc[0]
    sar_.iloc[0] = l.iloc[0]
    for i in range(1, len(df)):
        sar_.iloc[i] = sar_.iloc[i-1] + af * (ep - sar_.iloc[i-1])
        if trend == 1:
            if l.iloc[i] < sar_.iloc[i]:
                trend, sar_.iloc[i], ep, af = -1, ep, l.iloc[i], af_step
            elif h.iloc[i] > ep: ep, af = h.iloc[i], min(af + af_step, af_max)
        else:
            if h.iloc[i] > sar_.iloc[i]:
                trend, sar_.iloc[i], ep, af = 1, ep, h.iloc[i], af_step
            elif l.iloc[i] < ep: ep, af = l.iloc[i], min(af + af_step, af_max)
    return {"sar": sar_}

def dpo(df, period=20):
    return {"dpo": df["close"] - df["close"].rolling(period).mean().shift((period//2) + 1)}

def envelope(df, period=20, dev=0.1):
    sma = df["close"].rolling(period).mean()
    return {"upper": sma * (1+dev), "middle": sma, "lower": sma * (1-dev)}


# ============ Momentum (10) ============
def rsi(df, period=14):
    d = df["close"].diff()
    g = d.where(d > 0, 0).ewm(span=period, adjust=False).mean()
    l = (-d.where(d < 0, 0)).ewm(span=period, adjust=False).mean()
    return {"rsi": 100 - 100 / (1 + g / l)}

def stoch_rsi(df, period=14, k_period=3, d_period=3):
    r = rsi(df, period)["rsi"]
    rmin, rmax = r.rolling(period).min(), r.rolling(period).max()
    fk = 100 * (r - rmin) / (rmax - rmin)
    k = fk.rolling(k_period).mean()
    return {"k": k, "d": k.rolling(d_period).mean()}

def stoch(df, k_period=14, d_period=3, smooth=3):
    lo, hi = df["low"].rolling(k_period).min(), df["high"].rolling(k_period).max()
    fk = 100 * (df["close"] - lo) / (hi - lo)
    k = fk.rolling(smooth).mean()
    return {"k": k, "d": k.rolling(d_period).mean()}

def kdj(df, period=9, signal_k=3, signal_d=3):
    lo, hi = df["low"].rolling(period).min(), df["high"].rolling(period).max()
    rsv = 100 * (df["close"] - lo) / (hi - lo)
    k = rsv.ewm(com=signal_k - 1, adjust=False).mean()
    d = k.ewm(com=signal_d - 1, adjust=False).mean()
    return {"k": k, "d": d, "j": 3*k - 2*d}

def roc(df, period=12):
    return {"roc": 100 * (df["close"] - df["close"].shift(period)) / df["close"].shift(period)}

def mom(df, period=10):
    return {"mom": df["close"] - df["close"].shift(period)}

def ppo(df, fast=12, slow=26, signal=9):
    ef = df["close"].ewm(span=fast, adjust=False).mean()
    es = df["close"].ewm(span=slow, adjust=False).mean()
    line = 100 * (ef - es) / es
    sig = line.ewm(span=signal, adjust=False).mean()
    return {"ppo": line, "signal": sig, "hist": line - sig}

def trix(df, period=15):
    e1 = df["close"].ewm(span=period, adjust=False).mean()
    e2 = e1.ewm(span=period, adjust=False).mean()
    e3 = e2.ewm(span=period, adjust=False).mean()
    return {"trix": 100 * e3.diff() / e3}

def wr(df, period=14):
    hi, lo = df["high"].rolling(period).max(), df["low"].rolling(period).min()
    return {"wr": -100 * (hi - df["close"]) / (hi - lo)}

def uo(df, p1=7, p2=14, p3=28):
    bp = df["close"] - pd.concat([df["low"], df["close"].shift()], axis=1).min(axis=1)
    tr_ = pd.concat([df["high"]-df["low"], (df["high"]-df["close"].shift()).abs(),
                     (df["low"]-df["close"].shift()).abs()], axis=1).max(axis=1)
    a1 = bp.rolling(p1).sum() / tr_.rolling(p1).sum()
    a2 = bp.rolling(p2).sum() / tr_.rolling(p2).sum()
    a3 = bp.rolling(p3).sum() / tr_.rolling(p3).sum()
    return {"uo": 100 * (4*a1 + 2*a2 + a3) / 7}


# ============ Volatility (8) ============
def bb(df, period=20, dev=2.0):
    m = df["close"].rolling(period).mean()
    s = df["close"].rolling(period).std()
    return {"upper": m + dev*s, "middle": m, "lower": m - dev*s}

def bbwidth(df, period=20, dev=2.0):
    b = bb(df, period, dev)
    return {"bbwidth": (b["upper"] - b["lower"]) / b["middle"]}

def bbpct(df, period=20, dev=2.0):
    b = bb(df, period, dev)
    return {"bbpct": (df["close"] - b["lower"]) / (b["upper"] - b["lower"])}

def atr(df, period=14):
    h, l, c = df["high"], df["low"], df["close"]
    tr_ = pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    return {"atr": tr_.ewm(span=period, adjust=False).mean()}

def keltner(df, period=20, mult=2.0):
    m = df["close"].ewm(span=period, adjust=False).mean()
    a = atr(df, period)["atr"]
    return {"upper": m + mult*a, "middle": m, "lower": m - mult*a}

def donchian(df, period=20):
    hi, lo = df["high"].rolling(period).max(), df["low"].rolling(period).min()
    return {"upper": hi, "lower": lo, "middle": (hi + lo) / 2}

def hv(df, period=20, ann=365):
    lr = np.log(df["close"] / df["close"].shift())
    return {"hv": lr.rolling(period).std() * np.sqrt(ann) * 100}

def stddev(df, period=20):
    return {"stddev": df["close"].rolling(period).std()}


# ============ Volume (6) ============
def obv(df):
    return {"obv": (np.sign(df["close"].diff()).fillna(0) * df["vol"]).cumsum()}

def vwap(df):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    return {"vwap": (tp * df["vol"]).cumsum() / df["vol"].cumsum()}

def mvwap(df, period=20):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    return {"mvwap": (tp * df["vol"]).rolling(period).sum() / df["vol"].rolling(period).sum()}

def cmf(df, period=20):
    mfm = ((df["close"] - df["low"]) - (df["high"] - df["close"])) / (df["high"] - df["low"])
    mfv = mfm * df["vol"]
    return {"cmf": mfv.rolling(period).sum() / df["vol"].rolling(period).sum()}

def mfi(df, period=14):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    mf = tp * df["vol"]
    pos = mf.where(tp > tp.shift(), 0).rolling(period).sum()
    neg = mf.where(tp < tp.shift(), 0).rolling(period).sum()
    return {"mfi": 100 - 100 / (1 + pos / neg)}

def ad(df):
    clv = ((df["close"] - df["low"]) - (df["high"] - df["close"])) / (df["high"] - df["low"])
    return {"ad": (clv.fillna(0) * df["vol"]).cumsum()}


# ============ Statistical (5) ============
def lr(df, period=20):
    def _f(x):
        n = len(x); idx = np.arange(n)
        s, i = np.polyfit(idx, x, 1)
        return i + s * (n - 1)
    return {"lr": df["close"].rolling(period).apply(_f, raw=True)}

def slope(df, period=20):
    return {"slope": df["close"].rolling(period).apply(
        lambda x: np.polyfit(np.arange(len(x)), x, 1)[0], raw=True)}

def angle(df, period=20):
    return {"angle_deg": np.degrees(np.arctan(slope(df, period)["slope"]))}

def variance(df, period=20):
    return {"variance": df["close"].rolling(period).var()}

def sigma(df, period=20):
    m = df["close"].rolling(period).mean()
    s = df["close"].rolling(period).std()
    return {"sigma": (df["close"] - m) / s}


# ============ Other (5) ============
def fisher(df, period=10):
    hi, lo = df["high"].rolling(period).max(), df["low"].rolling(period).min()
    norm = 2 * ((df["close"] - lo) / (hi - lo) - 0.5)
    norm = norm.clip(-0.999, 0.999)
    f = 0.5 * np.log((1 + norm) / (1 - norm))
    return {"fisher": f, "trigger": f.shift()}

def tr(df):
    h, l, c = df["high"], df["low"], df["close"]
    return {"tr": pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)}

def tp(df):
    return {"tp": (df["high"] + df["low"] + df["close"]) / 3}

def mp(df):
    return {"mp": (df["high"] + df["low"]) / 2}

def cho(df, fast=3, slow=10):
    a = ad(df)["ad"]
    return {"cho": a.ewm(span=fast, adjust=False).mean() - a.ewm(span=slow, adjust=False).mean()}


# ============ Divergence detection ============
def divergence(df, indicator="rsi", period=14, lookback=20):
    """Detect bullish/bearish regular & hidden divergences."""
    fn = INDICATORS.get(indicator)
    if fn is None: raise ValueError(f"Unknown: {indicator}")
    ind = list(fn(df, period=period).values())[0]
    out = pd.Series([None]*len(df), index=df.index, dtype=object)

    def _piv(s, kind="low", w=2):
        out_ = []
        for i in range(w, len(s) - w):
            window = s.iloc[i-w:i+w+1]
            if kind == "low" and s.iloc[i] == window.min(): out_.append(i)
            elif kind == "high" and s.iloc[i] == window.max(): out_.append(i)
        return out_

    lows, highs = _piv(df["close"], "low"), _piv(df["close"], "high")

    for j in range(1, len(lows)):
        ip, ic = lows[j-1], lows[j]
        if ic - ip > lookback: continue
        pp, pc = df["close"].iloc[ip], df["close"].iloc[ic]
        np_, nc = ind.iloc[ip], ind.iloc[ic]
        if pd.isna(np_) or pd.isna(nc): continue
        if pc < pp and nc > np_: out.iloc[ic] = "bull_reg"
        elif pc > pp and nc < np_: out.iloc[ic] = "bull_hid"

    for j in range(1, len(highs)):
        ip, ic = highs[j-1], highs[j]
        if ic - ip > lookback: continue
        pp, pc = df["close"].iloc[ip], df["close"].iloc[ic]
        np_, nc = ind.iloc[ip], ind.iloc[ic]
        if pd.isna(np_) or pd.isna(nc): continue
        if pc > pp and nc < np_: out.iloc[ic] = "bear_reg"
        elif pc < pp and nc > np_: out.iloc[ic] = "bear_hid"

    return {"divergence": out}


INDICATORS = {
    "ma": ma, "ema": ema, "wma": wma, "dema": dema, "tema": tema, "hma": hma, "kama": kama, "zlema": zlema,
    "macd": macd, "adx": adx, "aroon": aroon, "cci": cci, "supertrend": supertrend, "sar": sar, "dpo": dpo, "envelope": envelope,
    "rsi": rsi, "stoch-rsi": stoch_rsi, "stoch": stoch, "kdj": kdj, "roc": roc, "mom": mom,
    "ppo": ppo, "trix": trix, "wr": wr, "uo": uo,
    "bb": bb, "boll": bb, "bbwidth": bbwidth, "bbpct": bbpct, "atr": atr,
    "keltner": keltner, "donchian": donchian, "hv": hv, "stddev": stddev,
    "obv": obv, "vwap": vwap, "mvwap": mvwap, "cmf": cmf, "mfi": mfi, "ad": ad,
    "lr": lr, "slope": slope, "angle": angle, "variance": variance, "sigma": sigma,
    "fisher": fisher, "tr": tr, "tp": tp, "mp": mp, "cho": cho,
    "divergence": divergence,
}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("indicator")
    p.add_argument("--kline", required=False)
    p.add_argument("--params", default="")
    p.add_argument("--list", action="store_true")
    p.add_argument("--limit", type=int, default=10)
    args = p.parse_args()

    if args.indicator == "list":
        print(json.dumps(sorted(INDICATORS.keys()), indent=2)); return

    fn = INDICATORS.get(args.indicator)
    if fn is None:
        print(json.dumps({"error": f"Unknown: {args.indicator}",
                          "available": sorted(INDICATORS.keys())})); sys.exit(1)
    if not args.kline:
        print(json.dumps({"error": "--kline required"})); sys.exit(1)

    df = _df(json.load(open(args.kline)))
    kw = {}
    if args.params:
        nums = [int(x) if x.isdigit() else float(x) for x in args.params.split(",")]
        if args.indicator in ("ma", "ema"): kw["periods"] = tuple(nums)
        elif args.indicator in ("macd", "ppo"):
            kw.update({"fast": nums[0], "slow": nums[1], "signal": nums[2]} if len(nums) >= 3 else {})
        elif args.indicator == "supertrend" and len(nums) >= 2:
            kw.update({"period": nums[0], "multiplier": nums[1]})
        elif args.indicator in ("bb", "envelope") and len(nums) >= 2:
            kw.update({"period": nums[0], "dev": nums[1]})
        elif args.indicator == "kdj" and len(nums) >= 3:
            kw.update({"period": nums[0], "signal_k": nums[1], "signal_d": nums[2]})
        else: kw["period"] = nums[0]

    res = fn(df, **kw)
    if args.list:
        print(json.dumps(_series(res, df["id"], args.limit), indent=2))
    else:
        out = _last(res); out["ts"] = int(df["id"].iloc[-1])
        print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
`,
  "technical-analysis/scripts/patterns.py": `"""Candlestick pattern detection — 12 patterns, pure pandas.

CLI:
    python patterns.py <pattern> --kline kline.json [--list]
    python patterns.py scan --kline kline.json   # scan all patterns at last bar
"""
import argparse, json, sys
import numpy as np, pandas as pd


def _df(kline):
    df = pd.DataFrame(kline).sort_values("id").reset_index(drop=True)
    for c in ("open", "high", "low", "close"): df[c] = df[c].astype(float)
    df["body"] = (df["close"] - df["open"]).abs()
    df["range"] = df["high"] - df["low"]
    df["upper_shadow"] = df["high"] - df[["open", "close"]].max(axis=1)
    df["lower_shadow"] = df[["open", "close"]].min(axis=1) - df["low"]
    df["bullish"] = df["close"] > df["open"]
    return df


def doji(df, threshold=0.1):
    """Body is < threshold of range."""
    return (df["body"] / df["range"]) < threshold


def hanging_man(df):
    """Small body at top, long lower shadow, in uptrend."""
    return (
        (df["body"] / df["range"] < 0.3) &
        (df["lower_shadow"] > 2 * df["body"]) &
        (df["upper_shadow"] < df["body"]) &
        (df["close"].rolling(5).mean() > df["close"].rolling(20).mean())
    )


def inverted_hammer(df):
    """Small body at bottom, long upper shadow, in downtrend."""
    return (
        (df["body"] / df["range"] < 0.3) &
        (df["upper_shadow"] > 2 * df["body"]) &
        (df["lower_shadow"] < df["body"]) &
        (df["close"].rolling(5).mean() < df["close"].rolling(20).mean())
    )


def shooting_star(df):
    """Like inverted hammer but in uptrend."""
    return (
        (df["body"] / df["range"] < 0.3) &
        (df["upper_shadow"] > 2 * df["body"]) &
        (df["lower_shadow"] < df["body"]) &
        (df["close"].rolling(5).mean() > df["close"].rolling(20).mean())
    )


def bull_engulf(df):
    """Bullish candle engulfs prior bearish candle."""
    prev_bearish = df["close"].shift() < df["open"].shift()
    curr_bullish = df["close"] > df["open"]
    engulf = (df["open"] < df["close"].shift()) & (df["close"] > df["open"].shift())
    return prev_bearish & curr_bullish & engulf


def bear_engulf(df):
    """Bearish candle engulfs prior bullish candle."""
    prev_bullish = df["close"].shift() > df["open"].shift()
    curr_bearish = df["close"] < df["open"]
    engulf = (df["open"] > df["close"].shift()) & (df["close"] < df["open"].shift())
    return prev_bullish & curr_bearish & engulf


def bull_harami(df):
    """Small bullish body inside prior large bearish body."""
    prev_bearish = df["close"].shift() < df["open"].shift()
    prev_large = df["body"].shift() > df["body"].shift().rolling(20).mean()
    curr_bullish = df["close"] > df["open"]
    inside = (df["open"] > df["close"].shift()) & (df["close"] < df["open"].shift())
    return prev_bearish & prev_large & curr_bullish & inside


def bear_harami(df):
    """Small bearish body inside prior large bullish body."""
    prev_bullish = df["close"].shift() > df["open"].shift()
    prev_large = df["body"].shift() > df["body"].shift().rolling(20).mean()
    curr_bearish = df["close"] < df["open"]
    inside = (df["open"] < df["close"].shift()) & (df["close"] > df["open"].shift())
    return prev_bullish & prev_large & curr_bearish & inside


def bull_harami_cross(df):
    """Bull harami where the inner candle is a doji."""
    return bull_harami(df) & doji(df)


def bear_harami_cross(df):
    """Bear harami where the inner candle is a doji."""
    return bear_harami(df) & doji(df)


def three_soldiers(df):
    """Three consecutive bullish candles, each closing higher, with small upper shadows."""
    bull3 = df["bullish"] & df["bullish"].shift() & df["bullish"].shift(2)
    higher_close = (df["close"] > df["close"].shift()) & (df["close"].shift() > df["close"].shift(2))
    open_within = (df["open"] > df["open"].shift()) & (df["open"] < df["close"].shift())
    open_within_2 = (df["open"].shift() > df["open"].shift(2)) & (df["open"].shift() < df["close"].shift(2))
    small_shadow = df["upper_shadow"] < df["body"] * 0.5
    return bull3 & higher_close & open_within & open_within_2 & small_shadow


def three_crows(df):
    """Three consecutive bearish candles, each closing lower."""
    bear3 = (~df["bullish"]) & (~df["bullish"].shift()) & (~df["bullish"].shift(2))
    lower_close = (df["close"] < df["close"].shift()) & (df["close"].shift() < df["close"].shift(2))
    open_within = (df["open"] < df["open"].shift()) & (df["open"] > df["close"].shift())
    open_within_2 = (df["open"].shift() < df["open"].shift(2)) & (df["open"].shift() > df["close"].shift(2))
    return bear3 & lower_close & open_within & open_within_2


PATTERNS = {
    "doji": doji,
    "hanging-man": hanging_man,
    "inverted-hammer": inverted_hammer,
    "shooting-star": shooting_star,
    "bull-engulf": bull_engulf,
    "bear-engulf": bear_engulf,
    "bull-harami": bull_harami,
    "bear-harami": bear_harami,
    "bull-harami-cross": bull_harami_cross,
    "bear-harami-cross": bear_harami_cross,
    "three-soldiers": three_soldiers,
    "three-crows": three_crows,
}


def scan(df):
    """Run all patterns and return which ones matched at the latest bar."""
    matches = []
    for name, fn in PATTERNS.items():
        s = fn(df)
        if bool(s.iloc[-1]):
            matches.append(name)
    return matches


def main():
    p = argparse.ArgumentParser()
    p.add_argument("pattern")
    p.add_argument("--kline", required=True)
    p.add_argument("--list", action="store_true")
    p.add_argument("--limit", type=int, default=10)
    args = p.parse_args()

    df = _df(json.load(open(args.kline)))

    if args.pattern == "scan":
        out = {"ts": int(df["id"].iloc[-1]), "patterns": scan(df)}
        print(json.dumps(out, indent=2)); return

    fn = PATTERNS.get(args.pattern)
    if fn is None:
        print(json.dumps({"error": f"Unknown: {args.pattern}", "available": sorted(PATTERNS.keys())}))
        sys.exit(1)

    s = fn(df)
    if args.list:
        rows = []
        n = min(args.limit, len(df))
        for i in range(len(df) - n, len(df)):
            rows.append({"ts": int(df["id"].iloc[i]), "match": bool(s.iloc[i])})
        print(json.dumps(rows, indent=2))
    else:
        print(json.dumps({"ts": int(df["id"].iloc[-1]), "match": bool(s.iloc[-1])}, indent=2))


if __name__ == "__main__":
    main()
`,
};
