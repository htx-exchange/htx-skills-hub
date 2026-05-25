---
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

```bash
# BTC perpetual current funding rate
htx-cli funding-rate current -p contract_code=BTC-USDT

# All perpetual funding rates market-wide
htx-cli funding-rate batch

# BTC historical funding rate (last 30 periods = 10 days)
htx-cli funding-rate history -p contract_code=BTC-USDT -p page_size=30
```

## Available commands (4 endpoints)

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| `current` | `GET /linear-swap-api/v1/swap_funding_rate` | Single-contract current rate + next settlement time |
| `batch` | `GET /linear-swap-api/v1/swap_batch_funding_rate` | Batch funding rates for all contracts market-wide |
| `history` | `GET /linear-swap-api/v1/swap_historical_funding_rate` | Historical funding rate series (paginated) |
| `estimated-kline` | `GET /linear-swap-ex/market/history/funding_rate` | Estimated next-period funding rate kline |

## Parameter reference

- `contract_code` — `BTC-USDT` / `ETH-USDT` / `SOL-USDT` etc.
- `page_index` — page number, starting from 1
- `page_size` — records per page, max 50
- `period` — kline period (used by `estimated-kline`): `1min` `5min` `15min` `30min` `60min` `4hour` `1day`
- `size` — number of klines, 1-2000

## Typical scenarios

**"What is the current funding rate of BTC perpetual?"**
```bash
htx-cli funding-rate current -p contract_code=BTC-USDT
# Returns funding_rate (current period) + estimated_rate (estimated next period) + next_funding_time
```

**"Which coins have negative funding rates? (Get paid for going long?)"**
```bash
htx-cli funding-rate batch
# AI Agent filters contracts where funding_rate < 0
```

**"BTC funding rate trend over the last 7 days"**
```bash
# 7 days = 21 periods
htx-cli funding-rate history -p contract_code=BTC-USDT -p page_size=21
# Array sorted by time descending
```

**"Top 5 hottest (highest funding rate) perpetuals market-wide"**
```bash
htx-cli funding-rate batch
# Sort descending by funding_rate, take top 5
```

## Output schema excerpt

`current` returns:
```json
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
```

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

```bash
npx -y @sheerl/htx-cli skill install funding-rate
```
