# @htx-skills/liquidation-stream

HTX (Huobi) **USDT-M perpetual liquidation orders** skill for Claude Code. Forced-liquidation events for squeeze monitoring and cluster detection.

- 1 endpoint, **public** (no API key)
- Risk: **none**

## Install

```bash
npx -y @htx-skills/liquidation-stream install
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

- `@htx-skills/funding-rate`
- `@htx-skills/oi-tracker`
- `@htx-skills/derivatives-analyst`

## License

MIT.
