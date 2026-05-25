---
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

```bash
# Query BTC/USDT latest market data
htx-cli spot-market market-detail-merged -p symbol=btcusdt

# Pull last 100 ETH/USDT 4h klines
htx-cli spot-market kline -p symbol=ethusdt -p period=4hour -p size=100

# Query market-wide tickers
htx-cli spot-market tickers
```

## Available commands (13 endpoints)

### Market data

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| `market-detail-merged` | `GET /market/detail/merged` | Single-symbol real-time summary (latest price + 24h stats) |
| `market-detail` | `GET /market/detail` | Single-symbol 24h stats detail |
| `tickers` | `GET /market/tickers` | Market-wide ticker snapshot for all symbols |
| `kline` | `GET /market/history/kline` | Historical klines (period: 1min / 5min / 15min / 30min / 60min / 4hour / 1day / 1week / 1mon) |
| `depth` | `GET /market/depth` | Order book depth (type: step0 / step1 / step2 / step3 / step4 / step5) |
| `trade` | `GET /market/trade` | Latest single trade |
| `history-trade` | `GET /market/history/trade` | Historical trades (max 2000) |

### Metadata

| Command | HTX endpoint | Description |
|---------|--------------|-------------|
| `symbols` | `GET /v1/common/symbols` | List of all tradable symbols (precision, min order size, status) |
| `currencys` | `GET /v1/common/currencys` | List of all currencies |
| `currencies-v2` | `GET /v2/reference/currencies` | Currency detail (with deposit/withdraw status) |
| `market-status` | `GET /v2/market-status` | Market status (normal / halted / cancel-only) |
| `timestamp` | `GET /v1/common/timestamp` | Server timestamp |
| `chains` | `GET /v1/settings/common/chains` | Chain info |

## Parameter reference

- `symbol` — symbol in lowercase without separators, e.g. `btcusdt` / `ethusdt` / `solusdt`
- `period` — kline period: `1min` `5min` `15min` `30min` `60min` `4hour` `1day` `1week` `1mon`
- `size` — number of records, 1-2000
- `type` — depth aggregation precision: `step0` (no aggregation) to `step5` (coarsest)
- `depth` — number of levels: 5 / 10 / 20

## Typical scenarios

**"How much is BTC right now?"**
```bash
htx-cli spot-market market-detail-merged -p symbol=btcusdt
# → close field is the latest price
```

**"ETH 4h kline trend"**
```bash
htx-cli spot-market kline -p symbol=ethusdt -p period=4hour -p size=200
```

**"Top 10 24h gainers"**
```bash
htx-cli spot-market tickers
# AI Agent parses the data array, sorts by (close-open)/open and takes the top 10
```

**"SOL order book depth"**
```bash
htx-cli spot-market depth -p symbol=solusdt -p type=step0 -p depth=20
```

## Output schema excerpt

`market-detail-merged` returns:
```json
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
```

## Notes

- Public endpoint rate limit: roughly 100/s per IP; use `tickers` for one-shot aggregate queries
- For COIN-M perpetual / delivery futures market data, use `htx/futures-market`
- For specialized data such as funding rate, open interest, liquidations, see the dedicated skill (`htx/funding-rate` / `htx/oi-tracker` / `htx/liquidation-stream`)

## Installation

```bash
npx -y @sheerl/htx-cli skill install spot-market
```

## Related docs

- HTX official API: https://huobiapi.github.io/docs/spot/v1/cn/
- Full README: ./README.md
