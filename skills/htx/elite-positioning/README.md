# https://github.com/htx-exchange/htx-skills-hub/elite-positioning

HTX (Huobi) **top-trader long/short ratio** skill for Claude Code. Distinguishes smart-money signals from retail crowd via dual-mode (account-based + position-based) ratios.

- 2 endpoints, all **public** (no API key)
- Risk: **none**

## Install

```bash
htx-cli skill install elite-positioning
```

Target: `~/.claude/skills/htx/elite-positioning/`.

## Prerequisites

1. **Node.js ≥ 18**
2. **`htx-cli`** on `$PATH`

## Verify

In Claude Code:

> "Are top traders net long or short on BTC right now?"

## Endpoints covered

| Endpoint | Description |
|----------|-------------|
| `swap_elite_account_ratio` | Account-count L/S ratio (breadth) |
| `swap_elite_position_ratio` | Position-size L/S ratio (capital weight) |

## Related skills

- `https://github.com/htx-exchange/htx-skills-hub/funding-rate`
- `https://github.com/htx-exchange/htx-skills-hub/oi-tracker`
- `https://github.com/htx-exchange/htx-skills-hub/sentiment-analyst`

## License

MIT.
