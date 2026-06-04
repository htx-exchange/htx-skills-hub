# @htx-skills/futures-account

HTX (Huobi) **USDT-M futures account** skill for Claude Code. Positions, balances, leverage / limit queries, sub-accounts, internal transfers.

- 30 endpoints: 26 read + 2 transfer writes + 2 misc
- Requires HTX API key with **read** permission (transfers need **write**)
- Risk: **low** — funds never leave HTX; transfers still require explicit user confirmation

## Install

### One-shot via npx

```bash
npx -y @htx-skills/futures-account install
```

Target: `~/.claude/skills/htx/futures-account/`.

### From local checkout

```bash
cd skills/htx/futures-account
node bin/install.js install
```

### Custom target / force / uninstall

```bash
npx -y @htx-skills/futures-account install --dest /path/to/skills
npx -y @htx-skills/futures-account install --force
npx -y @htx-skills/futures-account uninstall
npx -y @htx-skills/futures-account path
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
3. **HTX API key** with read permission (trade for transfers):
   ```bash
   htx-cli config set-key    <AccessKeyId>
   htx-cli config set-secret <SecretKey>
   ```

## Verify

In Claude Code:

> "What BTC futures positions do I have?"

Claude runs:

```bash
htx-cli futures account position-info --contract-code BTC-USDT --json
htx-cli futures account info          --contract-code BTC-USDT --json
```

## Endpoints covered

| Category | Count |
|----------|-------|
| Account & position query | 8 |
| Leverage & limit query | 10 |
| Sub-account management | 8 |
| Transfer & misc | 4 |
| **Total** | **30** |

## Related skills

- `@htx-skills/futures-market` — public futures market data
- `@htx-skills/futures-trading` — futures order placement (HIGH risk)
- `@htx-skills/spot-account` — spot account / balances

## License

MIT.
