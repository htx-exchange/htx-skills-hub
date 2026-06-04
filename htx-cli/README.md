# HTX Skills

HTX (formerly Huobi) skills for AI coding assistants. Provides spot & USDT-M futures market data, account queries, order placement, leverage and position management, and internal transfers via a single Go-based CLI harness (`htx-cli`).

- GitHub: https://github.com/htx-exchange/htx-skills-hub
- Latest release: https://github.com/htx-exchange/htx-skills-hub/releases/tag/v1.0.0

## Available Skills

| Skill | Description |
|-------|-------------|
| `htx-spot-market` | Public spot market data — tickers, klines, depth, trades, symbols, reference data (15 endpoints, no key) |
| `htx-spot-account` | Spot balances, valuations, transaction history, internal transfers (9 endpoints, read key) |
| `htx-spot-trading` | Place / cancel / query spot orders, margin borrow-lend (11 endpoints, trade key) |
| `htx-futures-market` | USDT-M perpetual market data — contract info, funding rates, OI, klines, depth, liquidations, sentiment (36 endpoints, mostly public) |
| `htx-futures-account` | USDT-M futures account & position query, leverage query, sub-account management, internal transfers (30 endpoints, read key) |
| `htx-futures-trading` | Place / cancel / query futures orders, adjust leverage and position mode, trigger and TP/SL strategy orders (50 endpoints, trade key) |

Skills are split by permission tier so agents load only what they need and users can grant the narrowest possible API-key rights.

## Supported Products

HTX Spot (all pairs) and HTX USDT-M Perpetual Futures.

## Prerequisites

Authenticated skills require HTX API credentials. Apply at [HTX API Management](https://www.htx.com/en-us/apikey/).

Recommended: export credentials as environment variables:

```bash
export HTX_API_KEY="your-access-key-id"
export HTX_SECRET_KEY="your-secret-key"
```

Or use the CLI-managed config:

```bash
htx-cli config set-key    <AccessKeyId>
htx-cli config set-secret <SecretKey>
htx-cli config show
```

Recommended key hygiene:

- Use a **read-only** key for `htx-spot-account` / `htx-futures-account`.
- Use a separate **trade-enabled** key (ideally IP-allow-listed, no withdrawal permission) for `htx-spot-trading` / `htx-futures-trading`.
- Market-data skills need **no key at all**.

**Security warning**: Never commit credentials to git and never expose them in logs, screenshots, or chat messages.

## Installation

### Recommended (binary + all skills)

```bash
./install-all.sh                              # binary (GitHub release) + all skills
./install-all.sh --binary-only                # binary only
./install-all.sh --skills-only                # skills only
./install-all.sh --only spot-market,spot-account   # skills subset
./install-all.sh --uninstall                  # remove skills (binary left in place)
./install-all.sh --help
```

```bash
source ~/.zshrc # or source ~/.bashrc
```

`npx` (Node.js ≥ 18) is required for the skills step; if it's missing, the binary still installs and the script prints a warning.

### Skills only

```bash
./skills/install-all.sh                       # all six from the local repo
./skills/install-all.sh --registry            # from npm registry (@htx-skills/*)
./skills/install-all.sh --only spot-market
./skills/install-all.sh --uninstall
```

Individual skills:

```bash
npx -y @htx-skills/spot-market install
npx -y @htx-skills/futures-trading install
```

The installer copies `SKILL.md`, `LICENSE.md` and `references/` into the first writable target of: `--dest <dir>` → `$CLAUDE_SKILLS_DIR` → `$XDG_DATA_HOME/claude/skills` → `~/.claude/skills`.

## Skill Workflows

The skills work together in typical trading flows:

**Spot Price Check**: `htx-spot-market` (ticker / kline / depth)

**Spot Buy**: `htx-spot-market` (price discovery) → `htx-spot-account` (check balance) → `htx-spot-trading` (place order)

**Portfolio Overview**: `htx-spot-account` (spot balances) → `htx-futures-account` (positions + PnL) → `htx-spot-market` / `htx-futures-market` (mark-to-market)

**Futures Research**: `htx-futures-market` (funding rate + OI + long/short ratio) → `htx-futures-market` (kline)

**Open a Perp Position**: `htx-futures-market` (mark price) → `htx-futures-account` (available margin + max leverage) → `htx-futures-trading` (set leverage + place order)

**Risk Management**: `htx-futures-account` (position + liq price) → `htx-futures-trading` (TP/SL trigger order) → `htx-futures-trading` (flash close)

**Cross-product Transfer**: `htx-spot-account` (balance) → `htx-spot-account` (transfer spot→futures) → `htx-futures-account` (verify credit)

## Install CLI

### Shell Script (macOS / Linux)

Auto-detects your platform, downloads the latest **stable** release, verifies SHA256 checksum, and installs to `~/.local/bin`:

```bash
curl -sSL https://raw.githubusercontent.com/htx-exchange/htx-skills-hub/main/htx-cli/install.sh | sh
```

To install the latest **beta** version (includes pre-releases):

```bash
curl -sSL https://raw.githubusercontent.com/htx-exchange/htx-skills-hub/main/htx-cli/install.sh | sh -s -- --beta
```

> **Note:** The default installer always uses the latest stable release; `--beta` is opt-in only.

### PowerShell (Windows)

Auto-detects your platform, downloads the latest **stable** release, verifies SHA256 checksum, and installs to `%USERPROFILE%\.local\bin`:

```powershell
irm https://raw.githubusercontent.com/htx-exchange/htx-skills-hub/main/htx-cli/install.ps1 | iex
```

## Build from source

Requires Go 1.23+.

```bash
./build.sh                  # version inferred from git
./build.sh v1.2.3           # explicit version tag
VERSION=v1.2.3 ./build.sh   # via env
```

Output goes to `./dist/` (macOS / Linux / Windows binaries, archives, `checksums.txt`).

## Repository layout

```
htx-cli/
├── agent-harness-go/     # Go source for the binary
├── openapi/              # OpenAPI specs
├── skills/
│   ├── install-all.sh    # skills bulk installer
│   └── htx/
│       ├── spot-market/
│       ├── spot-account/
│       ├── spot-trading/
│       ├── futures-market/
│       ├── futures-account/
│       └── futures-trading/
├── build.sh              # cross-compile
├── install.sh            # binary installer (remote)
├── install.ps1           # binary installer (Windows)
└── install-all.sh        # binary + skills unified installer
```

## API Key Security Notice & Disclaimer

**Production Usage** For stable and reliable usage, you must provide your own API credentials by setting:

* `HTX_API_KEY`
* `HTX_SECRET_KEY`

You are solely responsible for the security, confidentiality, and proper management of your own API keys. The maintainers are not liable for any unauthorized access, asset loss, or damages resulting from improper key management, from trade-enabled keys executing orders under agent control, or from use of the skills outside their intended scope.

**Trading Risk** Futures and margin trading involves a high risk of loss. Leverage amplifies both gains and losses — liquidation can wipe a position entirely. All write operations in `htx-spot-trading` and `htx-futures-trading` require explicit user confirmation, but final responsibility for every order placed rests with the user.

## License

MIT — see each skill's `LICENSE.md`.
