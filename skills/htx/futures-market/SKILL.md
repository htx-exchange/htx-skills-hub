---
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

```bash
# BTC perpetual latest market data
htx-cli futures-market detail-merged -p contract_code=BTC-USDT

# ETH perpetual 1h klines
htx-cli futures-market kline -p contract_code=ETH-USDT -p period=60min -p size=200

# All perpetual contract info
htx-cli futures-market contract-info
```

## Available commands (15 endpoints)

### Market data

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| `detail-merged` | `GET /linear-swap-ex/market/detail/merged` | Single-contract real-time summary |
| `detail-batch-merged` | `GET /linear-swap-ex/market/detail/batch_merged` | Batch real-time summary across contracts |
| `kline` | `GET /linear-swap-ex/market/history/kline` | Historical klines |
| `depth` | `GET /linear-swap-ex/market/depth` | Order book depth |
| `bbo` | `GET /linear-swap-ex/market/bbo` | Best bid/offer |
| `trade` | `GET /linear-swap-ex/market/trade` | Latest single trade |
| `history-trade` | `GET /linear-swap-ex/market/history/trade` | Historical trades |

### Index and fair-value prices

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| `index-price` | `GET /linear-swap-api/v1/swap_index` | Real-time index price |

> For mark price / premium index / basis klines, use `htx/mark-price`

### Metadata

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| `contract-info` | `GET /linear-swap-api/v1/swap_contract_info` | Contract metadata |
| `query-elements` | `GET /linear-swap-api/v1/swap_query_elements` | Contract elements (precision, size) |
| `risk-info` | `GET /linear-swap-api/v1/swap_risk_info` | Platform risk reserve fund |
| `funding-rate-cap` | `GET /linear-swap-api/v1/swap_funding_rate_cap_info` | Funding rate upper/lower bounds |

### System status

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| `timestamp` | `GET /api/v1/timestamp` | Server time |
| `heartbeat` | `GET /heartbeat/` | System heartbeat and status |
| `transfer-state` | `GET /linear-swap-api/v1/swap_transfer_state` | Transfer switch state |

## Parameter reference

- `contract_code` — Contract code, uppercase with hyphen, e.g. `BTC-USDT` / `ETH-USDT` / `SOL-USDT`
- `period` — `1min` `5min` `15min` `30min` `60min` `4hour` `1day` `1week` `1mon`
- `size` — Number of klines returned, 1-2000
- `type` — Order book aggregation: `step0` to `step19`
- `business_type` — `swap` (USDT perpetual) / `futures` (delivery) / `all`

## Typical scenarios

**"What is the premium of the BTC perpetual over spot?"**
```bash
# Perpetual latest price
htx-cli futures-market detail-merged -p contract_code=BTC-USDT
# Spot latest price
htx-cli spot-market market-detail-merged -p symbol=btcusdt
# AI Agent compares the two to compute the premium percentage
```

**"Top coins by ETH perpetual 24h turnover"**
```bash
htx-cli futures-market detail-batch-merged -p business_type=swap
# Parse and sort by the vol field
```

**"What is the contract size of the BTC perpetual?"**
```bash
htx-cli futures-market contract-info -p contract_code=BTC-USDT
# contract_size field: BTC-USDT = 0.001 BTC per contract
```

## Notes

- This skill only covers **general market data**. For specialized data, use the dedicated skill:
  - Funding rate → `htx/funding-rate`
  - Open interest → `htx/oi-tracker`
  - Long/short ratio → `htx/elite-positioning`
  - Liquidation orders → `htx/liquidation-stream`
  - Mark price / basis → `htx/mark-price`
  - Settlement / insurance fund → `htx/settlement`
- For write operations (order placement, leverage change), use `htx/futures-trading`
- For account queries, use `htx/futures-account`

## Installation

```bash
npx -y @sheerl/htx-cli skill install futures-market
```

## Related docs

- HTX perpetual futures API: https://huobiapi.github.io/docs/usdt_swap/v1/cn/
