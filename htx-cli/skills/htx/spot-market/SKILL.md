---
name: htx-spot-market
version: 1.0.0
description: Query HTX (Huobi) spot market data — tickers, klines, depth, trades, symbols, reference data. Public endpoints, no API key required.
auth_required: false
risk_level: none
---

# HTX Spot Market

Public spot market data from HTX. **No authentication required.** Agent may call these endpoints freely without user confirmation.

## When to use this skill

Load this skill when the user asks about:

- Current price of a spot symbol (e.g. `btcusdt`, `ethusdt`)
- K-line / OHLC data, chart data, candles
- Order book depth, bid/ask, best bid/offer
- Recent trades, trade history
- Listed symbols, supported currencies, chain info
- Server time, market status (open / halted / cancel-only)
- 24h market overview, top gainers/losers

## Underlying tool

This skill drives the `htx-cli` binary. The binary must be on `$PATH` (or at `$HTX_CLI_BIN`). Binary location in the source repo:

```
htx-cli/agent-harness-go/bin/htx-cli
```

Always pass `--json` so output is machine-parseable.

## Endpoint catalog (15)

### Reference Data (7)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | `/v2/market-status` | `htx-cli spot market status --json` | Market status (normal / halted / cancel-only) |
| 2 | GET | `/v2/settings/common/symbols` | `htx-cli spot market symbols --json` | All trading pair configuration |
| 3 | GET | `/v2/settings/common/currencies` | `htx-cli spot market currencies --json` | All currency configuration |
| 4 | GET | `/v1/settings/common/symbols` | `htx-cli spot call GET /v1/settings/common/symbols --json` | Symbol precision info |
| 5 | GET | `/v1/settings/common/market-symbols` | `htx-cli spot call GET /v1/settings/common/market-symbols --json` | Spot market symbol config |
| 6 | GET | `/v2/reference/currencies` | `htx-cli spot call GET /v2/reference/currencies --json` | Currency + chain info |
| 7 | GET | `/v1/common/timestamp` | `htx-cli spot market timestamp --json` | Server timestamp (ms) |

### Market Data (8)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | `/market/history/kline` | `htx-cli spot market klines <symbol> --period <period> [--size N] --json` | K-line (OHLC). Periods: `1min,5min,15min,30min,60min,4hour,1day,1mon,1week,1year` |
| 2 | GET | `/market/detail` | `htx-cli spot market ticker <symbol> --json` | Latest ticker (price / volume / 24h stats) |
| 3 | GET | `/market/tickers` | `htx-cli spot market tickers --json` | All-market ticker snapshot |
| 4 | GET | `/market/depth` | `htx-cli spot market depth <symbol> [--type step0] --json` | Order book depth |
| 5 | GET | `/market/trade` | `htx-cli spot market trades <symbol> --json` | Latest trades |
| 6 | GET | `/market/history/trade` | `htx-cli spot call GET /market/history/trade --query symbol=<symbol>&size=<N> --json` | Historical trades |
| 7 | GET | `/market/overview` | `htx-cli spot call GET /market/overview --json` | 24h market overview |
| 8 | GET | `/market/orderbook` | `htx-cli spot call GET /market/orderbook --query symbol=<symbol> --json` | Full order book |

## Typical queries

- "What's the current BTC price?" → `htx-cli spot market ticker btcusdt --json`
- "ETH/USDT 4-hour klines" → `htx-cli spot market klines ethusdt --period 4hour --size 200 --json`
- "SOL order book, best bid/ask" → `htx-cli spot market depth solusdt --type step0 --json`
- "Top gainers in the last 24h?" → `htx-cli spot market tickers --json` then sort client-side by change %
- "Is the market open?" → `htx-cli spot market status --json`

## Notes for the agent

- All endpoints here are **public** — never attach `AccessKeyId` or signatures.
- Emit `--json` on every call so you can parse the result.
- When the user says a symbol like "BTC", map it to `btcusdt` unless they name another quote currency.
- Klines: default to `1day` size `100` if the user doesn't specify.
- For "full orderbook vs depth": use `depth` for top-of-book / small N levels; use `orderbook` for full snapshot.

## References

- `references/symbols.md` — symbol / currency quick reference
