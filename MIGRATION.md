# Migration v1 → v2

> v2.0.0 was released in 2026-05. This document describes the structural, naming, and CLI usage changes in v2.

## TL;DR

v1 packed every futures capability into a single `futures-market` skill (36 endpoints). v2 splits it into 7 focused atomic skills and adds 4 new Layer 2 analysis engines.

## Key Changes

### 1. Unified CLI flag

| v1 | v2 |
|----|----|
| `--query key=val&key=val` | `--param key=val` or `-p key=val` (repeatable) |

```bash
# v1
htx-cli futures call /v1/swap_funding_rate --query "contract_code=BTC-USDT"

# v2
htx-cli futures call /v1/swap_funding_rate -p contract_code=BTC-USDT
```

### 2. Futures market split

The v1 `futures-market` skill bundled all 36 endpoints, which made it unwieldy. v2 splits it into:

| v2 skill | endpoints | Focus |
|----------|-----------|-------|
| `futures-market` | 15 | General market data: contract info / candlesticks / order book / index / system status |
| `funding-rate` | 4 | Funding Rate (current / batch / history / estimated candlesticks) |
| `oi-tracker` | 2 | Open Interest snapshot + history |
| `elite-positioning` | 2 | Elite Long/Short Ratio (account / position basis) |
| `liquidation-stream` | 1 | Liquidation order stream |
| `mark-price` | 3 | Mark Price / Premium Index / Basis candlesticks |
| `settlement` | 4 | Settlement price / Insurance Fund |

The previously planned `basis-monitor` has been merged into `mark-price` in v2 (3 endpoints total, including basis).

### 3. Layer 2 analysis engines (new)

v2 introduces 4 new Layer 2 skills that compose L1 atomic skills to produce holistic judgments:

- `technical-analysis` — Locally computes 12 classic technical indicators (pure Python implementation in `scripts/indicators.py`)
- `derivatives-analyst` — 5-dimensional crowdedness Composite Score (0-100) combining Funding Rate + Open Interest + Long/Short Ratio + Liquidation + Basis
- `sentiment-analyst` — Fear & Greed Index + Elite Long/Short Ratio + market breadth
- `market-overview` — Whole-market scan + sector rotation (see `references/sectors.md`)

Layer 2 skills do not call HTX APIs directly. They invoke L1 skills via htx-cli to fetch data, then perform composition and analysis locally.

### 4. Security enhancements

- All L0 write-operation skills (`spot-trading` / `futures-trading`, plus transfer endpoints in `spot-account` / `futures-account`) explicitly require the AI Agent to enforce **mandatory manual confirmation** in their SKILL.md
- API Keys are used only on the local machine and are never sent externally

## Upgrade Steps

```bash
# Uninstall v1
htx-cli skills uninstall htx/futures-market

# Install v2
npx -y @htx-skills/futures-market install
npx -y @htx-skills/funding-rate install
npx -y @htx-skills/oi-tracker install
# ... install other skills as needed
```

## Breaking Changes

| Item | v1 | v2 | Impact |
|------|----|----|--------|
| CLI flag | `--query` | `--param` / `-p` | Rewrite prompt templates |
| `futures-market` skill | Single skill, 36 endpoints | Split into 7 skills | Install separately |
| `basis-monitor` skill | Standalone, 1 endpoint | Merged into `mark-price` | Update install name |

## Feedback

File issues at: https://github.com/sheerl/htx-skills-hub/issues
