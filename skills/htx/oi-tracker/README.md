# @htx-skills/oi-tracker

HTX (Huobi) **USDT-M perpetual open interest** skill for Claude Code. Current OI snapshot + historical series.

- 2 endpoints, all **public** (no API key)
- Risk: **none**

## Install

```bash
npx -y @htx-skills/oi-tracker install
```

Target: `~/.claude/skills/htx/oi-tracker/`.

## Prerequisites

1. **Node.js ≥ 18**
2. **`htx-cli`** on `$PATH`

## Verify

In Claude Code:

> "What's BTC's open interest right now and how has it changed in 24h?"

## Endpoints covered

| Endpoint | Description |
|----------|-------------|
| `swap_open_interest` | Current OI snapshot |
| `market/his_open_interest` | OI historical time series |

## Related skills

- `@htx-skills/funding-rate`
- `@htx-skills/elite-positioning`
- `@htx-skills/derivatives-analyst`

## License

MIT.
