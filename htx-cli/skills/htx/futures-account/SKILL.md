---
name: htx-futures-account
version: 1.0.0
description: HTX USDT-M futures account management — account & position query, leverage & limit query, sub-account management, internal transfers. Requires API key (read permission; transfers need write).
auth_required: true
risk_level: low
---

# HTX USDT-M Futures Account

USDT-M futures account / position query + internal transfers. **Requires API key** (read permission). Transfers are low risk — funds stay inside HTX.

## When to use this skill

- "What BTC perp positions do I have? Entry price? PnL?"
- "How much available margin on my cross account?"
- "Show my sub-accounts' positions"
- "What's my max leverage for ETH-USDT?"
- "Move 500 USDT from main to sub-account"

## Underlying tool

Drives `htx-cli`. Binary on `$PATH` or `$HTX_CLI_BIN`. Always `--json`.

```bash
htx-cli config set-key    <AccessKeyId>
htx-cli config set-secret <SecretKey>
```

Read permission is enough for 26 of 30 endpoints. Transfers (4) need write.

## Endpoint catalog (30)

All paths in this skill have base `/linear-swap-api` unless noted. "Mode" column: `I` = isolated (逐仓), `C` = cross (全仓), `*` = either.

### Account & position query — read (8)

| # | Method | Path | CLI invocation | Mode |
|---|--------|------|----------------|------|
| 1 | POST | `/v1/swap_account_info` | `htx-cli futures account info [--contract-code <c>] --json` | I |
| 2 | POST | `/v1/swap_cross_account_info` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_account_info --json` | C |
| 3 | POST | `/v1/swap_position_info` | `htx-cli futures account position-info [--contract-code <c>] --json` | I |
| 4 | POST | `/v1/swap_cross_position_info` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_position_info --json` | C |
| 5 | POST | `/v1/swap_account_position_info` | `htx-cli futures call POST /linear-swap-api/v1/swap_account_position_info --json` | I |
| 6 | POST | `/v1/swap_cross_account_position_info` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_account_position_info --json` | C |
| 7 | POST | `/v3/swap_financial_record` | `htx-cli futures call POST /linear-swap-api/v3/swap_financial_record --json` | * |
| 8 | POST | `/v3/swap_financial_record_exact` | `htx-cli futures call POST /linear-swap-api/v3/swap_financial_record_exact --json` | * |

### Leverage & limit query — read (10)

| # | Method | Path | CLI invocation | Mode |
|---|--------|------|----------------|------|
| 1 | POST | `/v1/swap_available_level_rate` | `htx-cli futures call POST /linear-swap-api/v1/swap_available_level_rate --json` | I |
| 2 | POST | `/v1/swap_cross_available_level_rate` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_available_level_rate --json` | C |
| 3 | POST | `/v1/swap_order_limit` | `htx-cli futures call POST /linear-swap-api/v1/swap_order_limit --json` | * |
| 4 | POST | `/v1/swap_fee` | `htx-cli futures call POST /linear-swap-api/v1/swap_fee --json` | * |
| 5 | POST | `/v1/swap_transfer_limit` | `htx-cli futures call POST /linear-swap-api/v1/swap_transfer_limit --json` | I |
| 6 | POST | `/v1/swap_cross_transfer_limit` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_transfer_limit --json` | C |
| 7 | POST | `/v1/swap_position_limit` | `htx-cli futures call POST /linear-swap-api/v1/swap_position_limit --json` | I |
| 8 | POST | `/v1/swap_cross_position_limit` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_position_limit --json` | C |
| 9 | POST | `/v1/swap_lever_position_limit` | `htx-cli futures call POST /linear-swap-api/v1/swap_lever_position_limit --json` | I |
| 10 | POST | `/v1/swap_cross_lever_position_limit` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_lever_position_limit --json` | C |

### Sub-account management — read (8)

| # | Method | Path | CLI invocation | Mode |
|---|--------|------|----------------|------|
| 1 | POST | `/v1/swap_sub_account_list` | `htx-cli futures call POST /linear-swap-api/v1/swap_sub_account_list --json` | * |
| 2 | POST | `/v1/swap_account_info_list` | `htx-cli futures call POST /linear-swap-api/v1/swap_account_info_list --json` | I |
| 3 | POST | `/v1/swap_cross_account_info_list` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_account_info_list --json` | C |
| 4 | POST | `/v1/swap_account_info_sub` | `htx-cli futures call POST /linear-swap-api/v1/swap_account_info_sub --json` | I |
| 5 | POST | `/v1/swap_cross_account_info_sub` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_account_info_sub --json` | C |
| 6 | POST | `/v1/swap_position_info_sub` | `htx-cli futures call POST /linear-swap-api/v1/swap_position_info_sub --json` | I |
| 7 | POST | `/v1/swap_cross_position_info_sub` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_position_info_sub --json` | C |
| 8 | POST | `/v3/swap_financial_record_exact` (sub) | `htx-cli futures call POST /linear-swap-api/v3/swap_financial_record_exact --body '{"sub_uid":...}' --json` | * |

### Transfer & misc (4)

| # | Method | Path | CLI invocation | RW |
|---|--------|------|----------------|----|
| 1 | POST | `/v1/swap_master_sub_transfer` | `htx-cli futures call POST /linear-swap-api/v1/swap_master_sub_transfer --body '{...}' --json` | W |
| 2 | POST | `/v1/swap_master_sub_transfer_record` | `htx-cli futures call POST /linear-swap-api/v1/swap_master_sub_transfer_record --json` | R |
| 3 | POST | `/v1/swap_transfer_inner` | `htx-cli futures call POST /linear-swap-api/v1/swap_transfer_inner --body '{...}' --json` | W |
| 4 | GET | `/v1/swap_api_trading_status` | `htx-cli futures call GET /linear-swap-api/v1/swap_api_trading_status --json` | R |

## Typical workflow

### Show position for a contract

```bash
htx-cli futures account position-info --contract-code BTC-USDT --json
htx-cli futures account info --contract-code BTC-USDT --json     # margin / balance
```

Report:
- Direction (long/short), size, entry price, mark price, unrealized PnL
- Leverage, position-margin, liquidation price

### Master → sub transfer (write)

Before calling, confirm with user:
- From UID → To UID
- Currency (`usdt`)
- Amount
- Direction (`master_to_sub` / `sub_to_master`)

## Safety

- Read endpoints: free to call.
- Transfer endpoints (2 of 30): **must** present full transfer preview and wait for explicit user confirmation.
- Do not log secrets. Use `htx-cli config set-secret` once.

## References

- `references/authentication.md`
