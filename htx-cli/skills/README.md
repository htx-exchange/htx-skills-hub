# HTX Skills Hub

A set of six independently installable Claude Code / Claude Agent skills that
wrap the [`htx-cli`](../) Rust binary (the HTX — formerly Huobi — REST API
harness). Each skill is scoped to a single permission tier so that Agents load
only what they need and users can grant the narrowest possible API-key rights.

- GitHub: https://github.com/htx-exchange/htx-skills-hub
- Latest release: https://github.com/htx-exchange/htx-skills-hub/releases/tag/v1.0.0

| Skill | Endpoints | Auth | Risk |
| --- | --- | --- | --- |
| [`spot-market`](./htx/spot-market)         | 15 | none          | zero  |
| [`spot-account`](./htx/spot-account)       | 9  | read key      | low   |
| [`spot-trading`](./htx/spot-trading)       | 11 | trade key     | high  |
| [`futures-market`](./htx/futures-market)   | 36 | mostly none   | zero  |
| [`futures-account`](./htx/futures-account) | 30 | read key      | low   |
| [`futures-trading`](./htx/futures-trading) | 50 | trade key     | high  |

The split follows `HTX_Skill_Split_Plan.docx`:

- **Least privilege** — price queries never touch a trade-enabled API key.
- **Smaller context** — Agents no longer load 116 futures endpoints to answer
  "what is the funding rate?".
- **Progressive loading** — market → account → trading, matching the user's
  intent.

## Prerequisites

- A built `htx-cli` binary on `PATH`. The Go implementation lives in
  [`../agent-harness-go`](../agent-harness-go). Install it via the GitHub
  release installer at the repo root:

  ```bash
  ./install.sh          # installs the current-platform binary to ~/.local/bin
  ```

  Or point at a specific binary via `HTX_CLI_BIN=/abs/path/to/htx-cli`.
- Node.js ≥ 18 (only required to run the installer; skills themselves have no
  runtime Node dependency).
- Claude Code or any agent runtime that reads skills from one of the search
  paths below.

## Install a skill with npx

Each skill is a standalone npm package. Install one at a time — no skill has
any dependency on another.

```bash
# zero-risk market data only
npx -y @htx-skills/spot-market install

# add account read when the user asks about balances
npx -y @htx-skills/spot-account install

# add trading only when the user is actually placing orders
npx -y @htx-skills/spot-trading install

# U-margined perpetuals
npx -y @htx-skills/futures-market install
npx -y @htx-skills/futures-account install
npx -y @htx-skills/futures-trading install
```

### Install all six at once

From a local checkout, the bundled helper installs every skill in one shot:

```bash
./skills/install-all.sh                    # installs all 6 from the local repo
./skills/install-all.sh --dest ./my-skills # custom target directory
./skills/install-all.sh --uninstall        # removes all 6
./skills/install-all.sh --force            # overwrite existing files
./skills/install-all.sh --only spot-market,spot-account   # subset
```

### What `install` does

The installer copies `SKILL.md`, `LICENSE.md` and the `references/` directory
into a skills directory. Target resolution order:

1. `--dest <dir>` CLI flag
2. `$CLAUDE_SKILLS_DIR`
3. `$XDG_DATA_HOME/claude/skills`
4. `~/.claude/skills`  *(default on macOS / Linux)*

Inside that directory the skill is written to `htx/<skill-name>/`, e.g.
`~/.claude/skills/htx/spot-market/SKILL.md`. Existing files are overwritten
only when `--force` is passed.

```bash
npx -y @htx-skills/spot-market install --dest ./my-skills --force
npx -y @htx-skills/spot-market uninstall          # removes htx/spot-market/
npx -y @htx-skills/spot-market path               # prints install target
```

### Local install (no registry)

If you have a local checkout of this repo, each skill directory is a working
npm package. Install it directly from the filesystem:

```bash
npx -y ./htx-cli/skills/htx/spot-market install
# or pack a tarball first
cd htx-cli/skills/htx/spot-market && npm pack
npx -y ./htx-skills-spot-market-0.1.0.tgz install
```

## Configuring credentials

All authenticated skills read the same two environment variables (or CLI
flags) that `htx-cli` itself uses:

```bash
export HTX_API_KEY=...
export HTX_SECRET_KEY=...
```

Recommended setup:

- Use a **read-only** key for `spot-account` and `futures-account`.
- Use a separate **trade-enabled** key for `spot-trading` and `futures-trading`,
  ideally with IP allow-listing and no withdrawal permission.
- Market-data skills should see **no key at all** (unset the env vars in the
  shell that runs them).

## Repository layout

```
htx-cli/skills/
├── README.md                  # this file
└── htx/
    ├── spot-market/
    │   ├── SKILL.md
    │   ├── README.md
    │   ├── LICENSE.md
    │   ├── package.json
    │   ├── bin/install.js
    │   └── references/symbols.md
    ├── spot-account/…
    ├── spot-trading/…
    ├── futures-market/…
    ├── futures-account/…
    └── futures-trading/…
```

## License

MIT — see each skill's `LICENSE.md`.
