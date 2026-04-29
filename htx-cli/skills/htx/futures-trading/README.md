# @htx-skills/futures-trading

HTX (Huobi) **USDT-M futures trading** skill for Claude Code. Place/cancel orders, change leverage, trigger orders, TP/SL.

- 50 endpoints: base orders + queries + trigger + TP/SL, both isolated and cross
- Requires HTX API key with **trade** permission
- Risk: **HIGH** — leverage amplifies losses; every write requires user confirmation

## Install

### One-shot via npx

```bash
npx -y @htx-skills/futures-trading install
```

Target: `~/.claude/skills/htx/futures-trading/`.

### From local checkout

```bash
cd skills/htx/futures-trading
node bin/install.js install
```

### Custom target / force / uninstall

```bash
npx -y @htx-skills/futures-trading install --dest /path/to/skills
npx -y @htx-skills/futures-trading install --force
npx -y @htx-skills/futures-trading uninstall
npx -y @htx-skills/futures-trading path
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
3. **HTX API key with trade permission**:
   ```bash
   htx-cli config set-key    <AccessKeyId>
   htx-cli config set-secret <SecretKey>
   ```
4. **Strongly recommended:** bind the key to a specific IP and **disable withdraw permission**.

## Safety model

This skill can open, close, and adjust leveraged positions. The agent is instructed in `SKILL.md` to, before any write:

1. Pull the current mark price and current position.
2. Show full order preview: contract, direction, offset, volume, price, leverage.
3. Compute and display the **estimated liquidation price**.
4. For leverage changes: show old → new and the new liquidation price.
5. For flash-close: show unrealized PnL.
6. For batch / cancel-all: list the order IDs.
7. Wait for an explicit confirmation.
8. Only then run the CLI command.

## Verify

In Claude Code (**demo account recommended the first time**):

> "Open a 1-contract 10x long on BTC-USDT at 60000 limit"

Claude loads `SKILL.md`, shows the full order preview + liquidation price, and **waits for your confirmation** before running:

```bash
htx-cli futures order place --contract-code BTC-USDT \
    --direction buy --offset open --lever-rate 10 \
    --volume 1 --price 60000 --order-price-type limit --json
```

## Endpoints covered

| Category | Count |
|----------|-------|
| Base orders & position controls | 14 |
| Order queries | 16 |
| Trigger orders | 10 |
| TP / SL orders | 10 |
| **Total** | **50** |

## Related skills

- `@htx-skills/futures-market` — public futures market data (fetch mark price, funding, OI)
- `@htx-skills/futures-account` — positions and balances
- `@htx-skills/spot-trading` — spot order placement

## License

MIT.
