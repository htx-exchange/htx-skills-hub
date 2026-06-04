# @htx-skills/spot-trading

HTX (Huobi) **spot trading** skill for Claude Code. Place orders, cancel orders, margin borrow & repay.

- 11 endpoints: 7 order ops + 4 margin
- Requires HTX API key with **trade** permission
- Risk: **HIGH** — every write operation requires explicit user confirmation

## Install

### One-shot via npx

```bash
npx -y @htx-skills/spot-trading install
```

Installs to `~/.claude/skills/htx/spot-trading/`.

### From local checkout

```bash
cd skills/htx/spot-trading
node bin/install.js install
```

### Custom target / overwrite / remove

```bash
npx -y @htx-skills/spot-trading install --dest /path/to/skills
npx -y @htx-skills/spot-trading install --force
npx -y @htx-skills/spot-trading uninstall
npx -y @htx-skills/spot-trading path
```

Resolution order: `--dest` → `$CLAUDE_SKILLS_DIR` → `$XDG_DATA_HOME/claude/skills` → `~/.claude/skills`.

## Prerequisites

1. **Node.js ≥ 18**
2. **`htx-cli`** on `$PATH` (or `$HTX_CLI_BIN`):
   ```bash
   cd htx-cli/agent-harness-go
   go build -o bin/htx-cli ./cmd/htx-cli
   export PATH="$PWD/bin:$PATH"
   ```
3. **HTX API key with trade permission** (and margin if you'll use margin endpoints). Configure once:
   ```bash
   htx-cli config set-key    <AccessKeyId>
   htx-cli config set-secret <SecretKey>
   ```
4. **Strongly recommended:** bind the API key to a specific IP and **disable withdraw permission**.

## Safety model

This skill moves real money. The agent is instructed in `SKILL.md` to:

1. Fetch current market price and show the user the distance between their chosen price and current.
2. Show full order details (symbol, side, type, amount, price, estimated cost).
3. For margin borrow, show the implied liquidation price.
4. Ask for explicit confirmation.
5. Only then invoke `htx-cli spot order place` / `cancel`.

For batch cancels, the agent must list the order IDs first.

## Verify

In Claude Code:

> "Place a limit buy on 0.001 BTC at 60000"

Claude will load `SKILL.md`, fetch the ticker, show you the order preview, and **wait for your confirmation** before running:

```bash
htx-cli spot order place --account-id <id> --symbol btcusdt \
    --type buy-limit --amount 0.001 --price 60000 --json
```

## Endpoints covered

| Category | Count |
|----------|-------|
| Order operations | 7 |
| Margin loan | 4 |
| **Total** | **11** |

## Related skills

- `@htx-skills/spot-market` — market data (no key)
- `@htx-skills/spot-account` — balances, transfers
- `@htx-skills/futures-trading` — USDT-M futures trading

## License

MIT.
