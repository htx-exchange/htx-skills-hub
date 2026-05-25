# @htx-skills/elite-positioning

HTX (Huobi) **top-trader long/short ratio** skill for Claude Code. Distinguishes smart-money signals from retail crowd via dual-mode (account-based + position-based) ratios.

- 2 endpoints, all **public** (no API key)
- Risk: **none**

## Install

```bash
npx -y @htx-skills/elite-positioning install
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

- `@htx-skills/funding-rate`
- `@htx-skills/oi-tracker`
- `@htx-skills/sentiment-analyst`

## License

MIT.
