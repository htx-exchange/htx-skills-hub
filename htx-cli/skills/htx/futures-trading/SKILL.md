---
name: htx-futures-trading
version: 1.0.0
description: Place / cancel / query HTX USDT-M futures orders; adjust leverage and position mode; set trigger and TP/SL strategy orders. HIGH RISK — all write operations require explicit user confirmation.
auth_required: true
risk_level: high
confirmation_required: true
---

# HTX USDT-M Futures Trading

USDT-margined perpetual futures trading. **HIGH RISK.** Leverage amplifies losses — liquidation can wipe a position. Every write operation **must be confirmed by the user** before execution.

## When to use this skill

- "Open a 10x long on BTC-USDT cross at 85000"
- "Close all my ETH perp positions"
- "Flash-close my BTC position"
- "Set TP 90000 / SL 82000 on my BTC long"
- "Place a trigger order to open short if BTC drops to 80000"
- "Change my leverage from 10x to 20x"
- "Cancel all my open orders and strategy orders"

## Underlying tool

Drives `htx-cli`. Binary on `$PATH` or `$HTX_CLI_BIN`. Always `--json`.

```bash
htx-cli config set-key    <AccessKeyId>
htx-cli config set-secret <SecretKey>
```

Key must have **trade** permission. Futures base URL defaults to `https://api.hbdm.com`.

## Mandatory confirmation flow

Before **any** write, present to the user:

| Field | Value |
|-------|-------|
| Action | place / cancel / cancel-all / flash-close / leverage-change / position-mode / trigger / TP-SL |
| Contract | e.g. `BTC-USDT` |
| Mode | isolated / cross |
| Direction | buy (long) / sell (short); open / close |
| Quantity | contracts |
| Order type | limit / market / post-only / FOK / IOC |
| Price | limit price, omit for market |
| Leverage | current and new (when changing) |
| Estimated liquidation price | **critical for user to see before confirming** |

Require an explicit "yes" / "confirm". For batch cancels, list IDs first. For flash-close, show current unrealized PnL.

## Endpoint catalog (50)

All paths base at `/linear-swap-api`. Mode column: `I` = isolated, `C` = cross, `*` = both / general.

### Base orders & position controls (14)

| # | Method | Path | CLI | Mode | RW |
|---|--------|------|-----|------|----|
| 1 | POST | `/v1/swap_order` | `htx-cli futures order place --contract-code <c> --direction <buy/sell> --offset <open/close> --lever-rate <n> --volume <n> [--price <p>] [--order-price-type limit/opponent/optimal_20/post_only/ioc/fok] --json` | I | W |
| 2 | POST | `/v1/swap_cross_order` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_order --body '{...}' --json` | C | W |
| 3 | POST | `/v1/swap_cross_batch_orders` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_batch_orders --body '{"orders_data":[{...}]}' --json` | C | W |
| 4 | POST | `/v1/swap_cancel` | `htx-cli futures order cancel --contract-code <c> --order-id <id> --json` | I | W |
| 5 | POST | `/v1/swap_cross_cancel` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_cancel --body '{...}' --json` | C | W |
| 6 | POST | `/v1/swap_cancelall` | `htx-cli futures call POST /linear-swap-api/v1/swap_cancelall --body '{"contract_code":"..."}' --json` | I | W |
| 7 | POST | `/v1/swap_cross_cancelall` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_cancelall --body '{...}' --json` | C | W |
| 8 | POST | `/v1/swap_lightning_close_position` | `htx-cli futures call POST /linear-swap-api/v1/swap_lightning_close_position --body '{...}' --json` | I | W |
| 9 | POST | `/v1/swap_cross_lightning_close_position` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_lightning_close_position --body '{...}' --json` | C | W |
| 10 | POST | `/v1/swap_switch_lever_rate` | `htx-cli futures call POST /linear-swap-api/v1/swap_switch_lever_rate --body '{"contract_code":"...","lever_rate":...}' --json` | I | W |
| 11 | POST | `/v1/swap_cross_switch_lever_rate` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_switch_lever_rate --body '{...}' --json` | C | W |
| 12 | POST | `/v1/swap_switch_position_mode` | `htx-cli futures call POST /linear-swap-api/v1/swap_switch_position_mode --body '{"position_mode":"single_side/dual_side"}' --json` | I | W |
| 13 | POST | `/v1/swap_cross_switch_position_mode` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_switch_position_mode --body '{...}' --json` | C | W |
| 14 | POST | `/v1/linear-cancel-after` | `htx-cli futures call POST /linear-swap-api/v1/linear-cancel-after --body '{"trigger_time":...}' --json` | * | W |

### Order queries — read (16)

| # | Method | Path | CLI | Mode |
|---|--------|------|-----|------|
| 1 | POST | `/v1/swap_cross_query_trade_state` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_query_trade_state --json` | C |
| 2 | POST | `/v1/swap_order_info` | `htx-cli futures call POST /linear-swap-api/v1/swap_order_info --body '{"order_id":"..."}' --json` | I |
| 3 | POST | `/v1/swap_cross_order_info` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_order_info --json` | C |
| 4 | POST | `/v1/swap_order_detail` | `htx-cli futures call POST /linear-swap-api/v1/swap_order_detail --json` | I |
| 5 | POST | `/v1/swap_cross_order_detail` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_order_detail --json` | C |
| 6 | POST | `/v1/swap_openorders` | `htx-cli futures order list [--contract-code <c>] --json` | I |
| 7 | POST | `/v1/swap_cross_openorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_openorders --json` | C |
| 8 | POST | `/v3/swap_hisorders` | `htx-cli futures call POST /linear-swap-api/v3/swap_hisorders --json` | I |
| 9 | POST | `/v3/swap_cross_hisorders` | `htx-cli futures call POST /linear-swap-api/v3/swap_cross_hisorders --json` | C |
| 10 | POST | `/v3/swap_hisorders_exact` | `htx-cli futures call POST /linear-swap-api/v3/swap_hisorders_exact --json` | I |
| 11 | POST | `/v3/swap_cross_hisorders_exact` | `htx-cli futures call POST /linear-swap-api/v3/swap_cross_hisorders_exact --json` | C |
| 12 | POST | `/v3/swap_matchresults` | `htx-cli futures call POST /linear-swap-api/v3/swap_matchresults --json` | I |
| 13 | POST | `/v3/swap_cross_matchresults` | `htx-cli futures call POST /linear-swap-api/v3/swap_cross_matchresults --json` | C |
| 14 | POST | `/v3/swap_matchresults_exact` | `htx-cli futures call POST /linear-swap-api/v3/swap_matchresults_exact --json` | I |
| 15 | POST | `/v3/swap_cross_matchresults_exact` | `htx-cli futures call POST /linear-swap-api/v3/swap_cross_matchresults_exact --json` | C |
| 16 | GET | `/v1/swap_position_side` / `/v1/swap_cross_position_side` | `htx-cli futures call GET /linear-swap-api/v1/swap_position_side --json` | * |

### Trigger orders (10)

| # | Method | Path | CLI | Mode | RW |
|---|--------|------|-----|------|----|
| 1 | POST | `/v1/swap_trigger_order` | `htx-cli futures call POST /linear-swap-api/v1/swap_trigger_order --body '{...}' --json` | I | W |
| 2 | POST | `/v1/swap_cross_trigger_order` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_trigger_order --json` | C | W |
| 3 | POST | `/v1/swap_trigger_cancel` | `htx-cli futures call POST /linear-swap-api/v1/swap_trigger_cancel --json` | I | W |
| 4 | POST | `/v1/swap_cross_trigger_cancel` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_trigger_cancel --json` | C | W |
| 5 | POST | `/v1/swap_trigger_cancelall` | `htx-cli futures call POST /linear-swap-api/v1/swap_trigger_cancelall --json` | I | W |
| 6 | POST | `/v1/swap_cross_trigger_cancelall` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_trigger_cancelall --json` | C | W |
| 7 | POST | `/v1/swap_trigger_openorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_trigger_openorders --json` | I | R |
| 8 | POST | `/v1/swap_cross_trigger_openorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_trigger_openorders --json` | C | R |
| 9 | POST | `/v1/swap_trigger_hisorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_trigger_hisorders --json` | I | R |
| 10 | POST | `/v1/swap_cross_trigger_hisorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_trigger_hisorders --json` | C | R |

### TP / SL orders (10)

| # | Method | Path | CLI | Mode | RW |
|---|--------|------|-----|------|----|
| 1 | POST | `/v1/swap_tpsl_order` | `htx-cli futures call POST /linear-swap-api/v1/swap_tpsl_order --body '{...}' --json` | I | W |
| 2 | POST | `/v1/swap_cross_tpsl_order` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_tpsl_order --json` | C | W |
| 3 | POST | `/v1/swap_tpsl_cancel` | `htx-cli futures call POST /linear-swap-api/v1/swap_tpsl_cancel --json` | I | W |
| 4 | POST | `/v1/swap_cross_tpsl_cancel` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_tpsl_cancel --json` | C | W |
| 5 | POST | `/v1/swap_tpsl_cancelall` | `htx-cli futures call POST /linear-swap-api/v1/swap_tpsl_cancelall --json` | I | W |
| 6 | POST | `/v1/swap_cross_tpsl_cancelall` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_tpsl_cancelall --json` | C | W |
| 7 | POST | `/v1/swap_tpsl_openorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_tpsl_openorders --json` | I | R |
| 8 | POST | `/v1/swap_cross_tpsl_openorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_tpsl_openorders --json` | C | R |
| 9 | POST | `/v1/swap_tpsl_hisorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_tpsl_hisorders --json` | I | R |
| 10 | POST | `/v1/swap_cross_tpsl_hisorders` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_tpsl_hisorders --json` | C | R |

## Safety checklist

Before every write:

- [ ] Fetch current mark price from `futures-market` skill.
- [ ] Show: contract, direction, offset (open/close), volume, price, leverage.
- [ ] **Compute and show the estimated liquidation price** for the resulting position.
- [ ] For leverage changes: show old → new and the new liquidation price.
- [ ] For flash-close: show current position size and unrealized PnL.
- [ ] For batch / cancel-all: list the order IDs first.
- [ ] For TP/SL: show the trigger price and its distance from current mark.
- [ ] Wait for explicit user confirmation ("yes" / "confirm").
- [ ] Execute and report the JSON response.

## Typical session — open long

```bash
# 1. Price check
htx-cli futures market funding-rate BTC-USDT --json

# 2. Current position / available
htx-cli futures account info --contract-code BTC-USDT --json

# 3. User confirms preview, then:
htx-cli futures order place \
    --contract-code BTC-USDT --direction buy --offset open \
    --lever-rate 10 --volume 1 --price 85000 \
    --order-price-type limit --json

# 4. Monitor
htx-cli futures order list --contract-code BTC-USDT --json
```

## References

- `references/authentication.md`
- `references/order-types.md` — order types, trigger/TPSL field layout
