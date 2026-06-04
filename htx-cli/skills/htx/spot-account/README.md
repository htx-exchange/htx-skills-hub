# @htx-skills/spot-account

HTX (Huobi) **spot account** skill for Claude Code. Balances, valuations, ledger, and internal transfers.

- 9 endpoints: 5 read + 4 write (transfers)
- Requires HTX API key with **read** permission; transfers additionally need **write**
- Risk: **low** — funds never leave HTX

## Install

### One-shot via npx

```bash
npx -y @htx-skills/spot-account install
```

Writes to `~/.claude/skills/htx/spot-account/`.

### From a local checkout

```bash
cd skills/htx/spot-account
node bin/install.js install
```

### Custom target directory

```bash
npx -y @htx-skills/spot-account install --dest /path/to/skills
# or
CLAUDE_SKILLS_DIR=/path/to/skills npx -y @htx-skills/spot-account install
```

Resolution order: `--dest` → `$CLAUDE_SKILLS_DIR` → `$XDG_DATA_HOME/claude/skills` → `~/.claude/skills`.

### Overwrite / uninstall / show path

```bash
npx -y @htx-skills/spot-account install --force
npx -y @htx-skills/spot-account uninstall
npx -y @htx-skills/spot-account path
```

## Prerequisites

1. **Node.js ≥ 18**
2. **`htx-cli` on `$PATH`** (or set `$HTX_CLI_BIN`). Build it from source:

   ```bash
   cd htx-cli/agent-harness-go
   go build -o bin/htx-cli ./cmd/htx-cli
   export PATH="$PWD/bin:$PATH"
   ```

3. **HTX API key with read permission** (write for transfers). Configure once:

   ```bash
   htx-cli config set-key    <AccessKeyId>
   htx-cli config set-secret <SecretKey>
   ```

   Credentials are persisted in `~/.config/htx-cli/config.toml` (or platform equivalent).

## Verify

In Claude Code:

> "What's my spot USDT balance?"

Claude loads `SKILL.md` and runs:

```bash
htx-cli spot account list --json
htx-cli spot account balance <id> --json
```

## Endpoints covered

| Category | Count |
|----------|-------|
| Account query (read) | 5 |
| Fund transfer (read/write) | 4 |
| **Total** | **9** |

See `SKILL.md` for the full table.

## Related skills

- `@htx-skills/spot-market` — public market data, no API key
- `@htx-skills/spot-trading` — spot order placement (high risk)
- `@htx-skills/futures-account` — USDT-M futures account

## Security

- Transfers require explicit user confirmation before execution.
- Secrets are stored via `htx-cli config set-secret`; never passed as CLI args.
- This skill will never send withdrawals outside HTX — that endpoint is not included.

## License

MIT. See `LICENSE.md`.
