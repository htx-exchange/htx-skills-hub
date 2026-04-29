---
name: htx-spot-account
version: 1.0.0
description: Query HTX spot account balances, valuations, transaction history, and move funds between internal HTX accounts. Requires API key (read permission; transfers need write).
auth_required: true
risk_level: low
---

# HTX Spot Account

Spot account and asset management for HTX. **Requires API key** with read permission. Transfer endpoints (4 of 9) are writes but funds stay inside HTX — low risk.

## When to use this skill

- "How much USDT do I have?"
- "What's my total asset valuation in USD?"
- "Show my account history / flow records"
- "Transfer 1000 USDT from spot to futures"
- "Check my HTX points balance"

## Underlying tool

Drives `htx-cli`. Binary must be on `$PATH` or at `$HTX_CLI_BIN`. Always use `--json`.

## Configure credentials (one-time)

```bash
htx-cli config set-key   <AccessKeyId>
htx-cli config set-secret <SecretKey>
htx-cli config show
```

See `references/authentication.md` for signing details.

## Endpoint catalog (10)

### Account queries — read (5)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | `/v1/account/accounts` | `htx-cli spot account list --json` | All accounts for the user |
| 2 | GET | `/v1/account/accounts/{id}/balance` | `htx-cli spot account balance <account-id> --json` | Balance detail |
| 3 | GET | `/v2/account/valuation` | `htx-cli spot account valuation --json` | Total valuation of all accounts |
| 4 | GET | `/v2/account/asset-valuation` | `htx-cli spot call /v2/account/asset-valuation -p accountType=spot -p valuationCurrency=USD --auth --json` | Per-account asset valuation |
| 5 | GET | `/v1/account/history` | `htx-cli spot call /v1/account/history -p account-id=<id> --auth --json` | Account flow / ledger |

### Fund transfers — write (5)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | POST | `/v1/account/transfer` | `htx-cli spot call /v1/account/transfer --method POST --auth --body '{"from-account-id":...,"to-account-id":...,"currency":"usdt","amount":"..."}' --json` | Transfer between user's own spot/margin/otc accounts |
| 2 | POST | `/v1/futures/transfer` | `htx-cli spot call /v1/futures/transfer --method POST --auth --body '{"currency":"btc","amount":"...","type":"pro-to-futures"}' --json` | Spot ↔ **COIN-M** (币本位交割) futures transfer ONLY. Does NOT work for USDT-M. |
| 3 | POST | `/v2/account/transfer` | `htx-cli spot call /v2/account/transfer --method POST --auth --body '{"from":"spot","to":"linear-swap","currency":"usdt","amount":"5","margin-account":"USDT"}' --json` | **Spot ↔ USDT-M linear swap** / cross-margin / super-margin, etc. Use for any USDT-M futures transfer. |
| 4 | GET | `/v1/point/account` | `htx-cli spot call /v1/point/account --auth --json` | HTX points balance |
| 5 | POST | `/v1/point/transfer` | `htx-cli spot call /v1/point/transfer --method POST --auth --body '{"fromUid":"...","toUid":"...","amount":"..."}' --json` | Transfer points |

> **Important**: For USDT-M perpetual swap (线性永续), you MUST use `/v2/account/transfer` with `from`/`to` = `spot` ↔ `linear-swap` and `margin-account` = `USDT` (cross) or `USDT-<symbol>` (isolated, e.g. `USDT-BTC`). The `/v1/futures/transfer` endpoint is reserved for COIN-M delivery contracts and will return `Transfer service is temporarily suspended for USDT account` if misused.

## Workflow patterns

### Show total balance

```bash
htx-cli spot account list --json               # find account id with type=spot
htx-cli spot account balance <id> --json       # detailed per-currency balance
htx-cli spot account valuation --json          # single USD total
```

### Spot → USDT-M futures transfer (most common)

Use `/v2/account/transfer`:

```bash
htx-cli spot call /v2/account/transfer --method POST --auth \
  --body '{"from":"spot","to":"linear-swap","currency":"usdt","amount":"5","margin-account":"USDT"}' --json
```

- `from` / `to`: `spot`, `linear-swap`, `margin`, `super-margin`, etc. Reverse them to transfer back.
- `margin-account`: `USDT` for cross-margin, `USDT-BTC` (etc.) for isolated margin.

### Spot → COIN-M (币本位) futures transfer

Use `/v1/futures/transfer` with `type` = `pro-to-futures` or `futures-to-pro` (currency is the coin symbol, e.g. `btc`, `eth`).

Before calling any transfer endpoint, **display to the user** source, destination, currency, amount, direction. Only proceed after explicit user confirmation.

## Safety

- Read endpoints: safe to call without confirmation.
- Transfer endpoints: **must** confirm with the user first — show source, destination, currency, amount.
- Never log the secret key. Never pass it as a CLI argument; use `htx-cli config set-secret` so it's stored once.

## References

- `references/authentication.md` — HMAC-SHA256 signing and key management
