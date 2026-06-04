# @htx-skills/futures-market

HTX (Huobi) **USDT-M futures market data** skill for Claude Code. Contract info, funding rates, OI, liquidations, klines, depth, sentiment.

- 36 endpoints: 30 public + 6 needing read permission
- Mostly no API key needed; the 6 reference endpoints need **read** permission
- Risk: **none** (the one write endpoint is `swap_switch_account_type`, still requires explicit user confirmation per `SKILL.md`)

## Install

### One-shot via npx

```bash
npx -y @htx-skills/futures-market install
```

Target: `~/.claude/skills/htx/futures-market/`.

### From local checkout

```bash
cd skills/htx/futures-market
node bin/install.js install
```

### Custom directory / force / uninstall

```bash
npx -y @htx-skills/futures-market install --dest /path/to/skills
npx -y @htx-skills/futures-market install --force
npx -y @htx-skills/futures-market uninstall
npx -y @htx-skills/futures-market path
```

Resolution order: `--dest` → `$CLAUDE_SKILLS_DIR` → `$XDG_DATA_HOME/claude/skills` → `~/.claude/skills`.

## Prerequisites

1. **Node.js ≥ 18**
2. **`htx-cli`** on `$PATH`:
   ```bash
   cd htx-cli/agent-harness-go
   go build -o bin/htx-cli ./cmd/htx-cli
   export PATH="$PWD/bin:$PATH"
   ```
3. **(Optional) HTX API key** with read permission — only needed for the 6 tier-margin / account-type endpoints. Configure via:
   ```bash
   htx-cli config set-key    <AccessKeyId>
   htx-cli config set-secret <SecretKey>
   ```

## Verify

In Claude Code:

> "What's BTC's perpetual funding rate right now?"

Claude runs:

```bash
htx-cli futures market funding-rate BTC-USDT --json
```

## Endpoints covered

| Category | Count | Auth |
|----------|-------|------|
| Contract & system info | 14 | public |
| Funding rate & sentiment | 5 | public |
| Market data | 11 | public |
| Reference data | 6 | read |
| **Total** | **36** | |

## Related skills

- `@htx-skills/spot-market` — spot market data
- `@htx-skills/futures-account` — futures positions & balances
- `@htx-skills/futures-trading` — futures order placement (high risk)

## License

MIT.
