---
name: htx/spot-account
version: 2.0.0
description: HTX spot account — balance / holdings / asset valuation / spot ↔ futures transfers.
auth: true
risk: medium
---

# Spot Account

Query spot account and sub-account balance, valuation, transaction history, and inter-account transfers.

> **Authentication**: all endpoints require an API key (read permission is enough; transfers need trade permission)
> **Risk**: read endpoints have no side effects; transfer endpoints require manual confirmation

## When to use

- Query account list / single-account balance / total asset valuation
- Look up balances across different currencies inside the spot account
- Transfer funds between spot and USDT-M / COIN-M perpetual futures
- Query sub-account balance, transfer between sub-accounts

## Quick start

```bash
# List all accounts
htx-cli spot account list

# Query a specific account balance (account-id required)
htx-cli spot account balance <account-id>

# Total asset USD valuation
htx-cli spot account valuation
```

## Endpoint catalog (10)

### Account query — read (5)

| # | Method | Endpoint | CLI | Description |
|---|--------|----------|-----|-------------|
| 1 | GET | `/v1/account/accounts` | `htx-cli spot account list` | List all accounts (spot / margin / otc / point) |
| 2 | GET | `/v1/account/accounts/{id}/balance` | `htx-cli spot account balance <id>` | Per-currency balance of a single account |
| 3 | GET | `/v2/account/asset-valuation` | `htx-cli spot account valuation` | Total asset valuation (USD / BTC) |
| 4 | GET | `/v1/account/history` | `htx-cli spot account history` | Account history (last 7 days) |
| 5 | GET | `/v1/query/deposit-withdraw` | `htx-cli spot account deposit-withdraw` | Deposit/withdraw records |

### 资金划转 — write (5)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 6 | POST | `/v1/account/transfer` | `htx-cli spot call /v1/account/transfer --method POST --auth --body '{"from-account-id":...,"to-account-id":...,"currency":"usdt","amount":"..."}' --json` | Transfer between user's own spot/margin/otc accounts |
| 7 | POST | `/v1/futures/transfer` | `htx-cli spot call /v1/futures/transfer --method POST --auth --body '{"currency":"btc","amount":"...","type":"pro-to-futures"}' --json` | Spot ↔ **COIN-M** (coin-margined delivery) futures transfer ONLY. Does NOT work for USDT-M. |
| 8 | POST | `/v2/account/transfer` | `htx-cli spot call /v2/account/transfer --method POST --auth --body '{"from":"spot","to":"linear-swap","currency":"usdt","amount":"5","margin-account":"USDT"}' --json` | **Spot ↔ USDT-M linear perpetual** / cross-margin / super-margin, etc. Use for any USDT-M futures transfer. |
| 9 | GET | `/v1/point/account` | `htx-cli spot call /v1/point/account --auth --json` | HTX points balance |
| 10 | POST | `/v1/point/transfer` | `htx-cli spot call /v1/point/transfer --method POST --auth --body '{"fromUid":"...","toUid":"...","amount":"..."}' --json` | Transfer points |

> **Important**: For USDT-M perpetual swap (linear perpetual), you MUST use `/v2/account/transfer` with `from`/`to` = `spot` ↔ `linear-swap` and `margin-account` = `USDT` (cross) or `USDT-<symbol>` (isolated, e.g. `USDT-BTC`). The `/v1/futures/transfer` endpoint is reserved for COIN-M delivery contracts and will return `Transfer service is temporarily suspended for USDT account` if misused.

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

### Spot → COIN-M futures transfer

Use `/v1/futures/transfer` with `type` = `pro-to-futures` or `futures-to-pro` (currency is the coin symbol, e.g. `btc`, `eth`).

Before calling any transfer endpoint, **display to the user** source, destination, currency, amount, direction. Only proceed after explicit user confirmation.

## Safety

- All transfers are write operations. AI Agent MUST show the user source / destination / currency / amount before calling, and only proceed after explicit confirmation.
- Wrong-direction transfers can cause margin shortfall or forced liquidation.
- API Key never leaves your machine.

## Installation

```bash
npx -y @sheerl/htx-cli skill install spot-account
```
