# https://github.com/htx-exchange/htx-skills-hub/oi-tracker

HTX (Huobi) **USDT-M perpetual open interest** skill for Claude Code. Current OI snapshot + historical series.

- 2 endpoints, all **public** (no API key)
- Risk: **none**

## Install

```bash
htx-cli skill install oi-tracker
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

- `https://github.com/htx-exchange/htx-skills-hub/funding-rate`
- `https://github.com/htx-exchange/htx-skills-hub/elite-positioning`
- `https://github.com/htx-exchange/htx-skills-hub/derivatives-analyst`

## License

MIT.
