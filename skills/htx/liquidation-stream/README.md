# https://github.com/htx-exchange/htx-skills-hub/liquidation-stream

HTX (Huobi) **USDT-M perpetual liquidation orders** skill for Claude Code. Forced-liquidation events for squeeze monitoring and cluster detection.

- 1 endpoint, **public** (no API key)
- Risk: **none**

## Install

```bash
htx-cli skill install liquidation-stream
```

## Prerequisites

1. **Node.js ≥ 18**
2. **`htx-cli`** on `$PATH`

## Verify

> "How much was liquidated on BTC perpetual in the last 24h?"

## Endpoint covered

| Endpoint | Description |
|----------|-------------|
| `swap_liquidation_orders` | Forced liquidation orders, filterable by side and date range |

## Related skills

- `https://github.com/htx-exchange/htx-skills-hub/funding-rate`
- `https://github.com/htx-exchange/htx-skills-hub/oi-tracker`
- `https://github.com/htx-exchange/htx-skills-hub/derivatives-analyst`

## License

MIT.
