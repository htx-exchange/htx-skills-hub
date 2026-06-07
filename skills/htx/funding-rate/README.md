# https://github.com/htx-exchange/htx-skills-hub/funding-rate

HTX (Huobi) **USDT-M perpetual funding rate** skill for Claude Code. Current rate, batch all-contract rates, historical series, and estimated next-period rate kline.

- 4 endpoints, all **public** (no API key)
- Risk: **none**

## Install

```bash
htx-cli skill install funding-rate
```

Target: `~/.claude/skills/htx/funding-rate/`.

### Custom directory / force / uninstall

```bash
htx-cli skill install funding-rate
htx-cli skill list
```

Resolution order: `--dest` → `$CLAUDE_SKILLS_DIR` → `$XDG_DATA_HOME/claude/skills` → `~/.claude/skills`.

## Prerequisites

1. **Node.js ≥ 18**
2. **`htx-cli`** on `$PATH`

## Verify

In Claude Code:

> "What's BTC's perpetual funding rate right now?"

Claude runs:

```bash
htx-cli futures market funding-rate BTC-USDT --json
```

## Endpoints covered

| Endpoint | Description |
|----------|-------------|
| `swap_funding_rate` | Current rate (single contract) |
| `swap_batch_funding_rate` | All-contracts snapshot |
| `swap_historical_funding_rate` | Historical series |
| `market/history/estimated_rate_kline` | Estimated next-period kline |

## Related skills

- `https://github.com/htx-exchange/htx-skills-hub/oi-tracker` — open interest current + history
- `https://github.com/htx-exchange/htx-skills-hub/elite-positioning` — top-trader long/short ratio
- `https://github.com/htx-exchange/htx-skills-hub/derivatives-analyst` — multi-signal pressure scoring
- `https://github.com/htx-exchange/htx-skills-hub/futures-market` — general futures market data

## License

MIT.
