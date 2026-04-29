# @htx-skills/spot-market

HTX (Huobi) **spot market data** skill for Claude Code. Public endpoints only — no API key, zero risk.

- 15 endpoints: reference data + market data
- No authentication
- Safe for the agent to call freely without user confirmation

## What you get

A Claude skill installed under `~/.claude/skills/htx/spot-market/` containing:

- `SKILL.md` — endpoint catalog and usage guide that Claude loads on demand
- `references/` — symbol and currency quick-reference
- `README.md`, `LICENSE.md`

The skill drives the `htx-cli` binary via shell commands. See [Prerequisites](#prerequisites).

## Install

### Install from npm (one-shot, recommended)

```bash
npx -y @htx-skills/spot-market install
```

This writes the skill into the default Claude skills directory:

```
~/.claude/skills/htx/spot-market/
```

### Install from a local checkout

```bash
cd skills/htx/spot-market
npx -y . install
# or
node bin/install.js install
```

### Install to a custom directory

```bash
npx -y @htx-skills/spot-market install --dest /path/to/skills
# or via environment
CLAUDE_SKILLS_DIR=/path/to/skills npx -y @htx-skills/spot-market install
```

Resolution order for the target directory:

1. `--dest DIR` flag
2. `$CLAUDE_SKILLS_DIR`
3. `$XDG_DATA_HOME/claude/skills`
4. `~/.claude/skills`

### Overwrite an existing install

```bash
npx -y @htx-skills/spot-market install --force
```

### Uninstall

```bash
npx -y @htx-skills/spot-market uninstall
```

### Show install path

```bash
npx -y @htx-skills/spot-market path
```

## Prerequisites

This skill is a thin wrapper over the `htx-cli` binary. You need:

1. **Node.js ≥ 18** (for `npx`)
2. **The `htx-cli` binary** on your `$PATH`, or its absolute path exported as `$HTX_CLI_BIN`

Build the CLI from source:

```bash
cd htx-cli/agent-harness-go
go build -o bin/htx-cli ./cmd/htx-cli
export PATH="$PWD/bin:$PATH"
```

No API key is required for this skill — all endpoints are public.

## Verify

After install, launch Claude Code and ask a market-data question:

> "What's the current BTC price on HTX?"

Claude will load `SKILL.md` from the install directory and invoke:

```bash
htx-cli spot market ticker btcusdt --json
```

## Endpoints covered

| Category | Count | Examples |
|----------|-------|----------|
| Reference data | 7 | market status, symbols, currencies, server time |
| Market data | 8 | ticker, tickers, klines, depth, trades, overview |
| **Total** | **15** | |

See `SKILL.md` for the full catalog and CLI invocations.

## Related skills

- `@htx-skills/spot-account` — spot balances and transfers (read permission)
- `@htx-skills/spot-trading` — spot order placement (trade permission, high risk)
- `@htx-skills/futures-market` — USDT-M futures market data

## License

MIT. See `LICENSE.md`.
