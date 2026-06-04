---
name: htx-spot-trading
version: 1.0.0
description: Place, cancel, and query spot orders on HTX; apply for and repay margin loans. Requires API key with trade permission. HIGH RISK — all write operations require explicit user confirmation.
auth_required: true
risk_level: high
confirmation_required: true
---

# HTX Spot Trading

Spot order placement / cancellation and margin borrow-lend. **HIGH RISK.** Every write operation changes real fund balances and **must be confirmed by the user** before execution (Human-in-the-Loop).

## When to use this skill

- "Market-buy 0.1 BTC"
- "Place a limit buy on ETH at 3500"
- "Cancel all my BTC/USDT open orders"
- "Borrow USDT and long ETH on margin"
- "Repay my margin loan"
- "Show my order history / fills"

## Underlying tool

Drives `htx-cli`. Binary on `$PATH` or `$HTX_CLI_BIN`. Always `--json`.

Configure credentials once:

```bash
htx-cli config set-key    <AccessKeyId>
htx-cli config set-secret <SecretKey>
```

Key must have **trade** permission enabled (and **margin** if using margin endpoints).

## Mandatory confirmation flow

Before **any** write operation, present to the user:

| Field | Shown value |
|-------|-------------|
| Action | place / cancel / batch-cancel / margin-borrow / margin-repay |
| Symbol | e.g. `btcusdt` |
| Side | buy / sell |
| Type | `buy-limit`, `sell-limit`, `buy-market`, `sell-market`, `buy-ioc`, `sell-ioc`, `buy-limit-maker`, etc. |
| Amount | quantity (and whether base or quote) |
| Price | limit price (omit for market) |
| Account | spot / margin / super-margin account id |
| Estimated cost | price × amount |

Proceed only after an explicit affirmative ("yes", "confirm", "go"). For batch cancels, list the IDs first.

## Endpoint catalog (11)

### Order operations (7)

| # | Method | Endpoint | CLI invocation | RW |
|---|--------|----------|----------------|----|
| 1 | POST | `/v1/order/orders/place` | `htx-cli spot order place --account-id <id> --symbol <symbol> --type <type> --amount <n> [--price <p>] [--client-order-id <coid>] --json` | W |
| 2 | POST | `/v1/order/orders/{id}/cancel` | `htx-cli spot order cancel <order-id> --json` | W |
| 3 | POST | `/v1/order/orders/batchcancel` | `htx-cli spot call POST /v1/order/orders/batchcancel --body '{"order-ids":["..."]}' --json` | W |
| 4 | GET | `/v1/order/orders/{id}` | `htx-cli spot order query <order-id> --json` | R |
| 5 | GET | `/v1/order/orders` | `htx-cli spot order list --symbol <symbol> --states <states> --json` | R |
| 6 | GET | `/v1/order/orders/getClientOrder` | `htx-cli spot call GET /v1/order/orders/getClientOrder --query clientOrderId=<coid> --json` | R |
| 7 | GET | `/v1/order/matchresults` | `htx-cli spot call GET /v1/order/matchresults --query symbol=<symbol> --json` | R |

### Margin loan (4)

| # | Method | Endpoint | CLI invocation | RW |
|---|--------|----------|----------------|----|
| 1 | POST | `/v1/margin/orders` | `htx-cli spot call POST /v1/margin/orders --body '{"symbol":"btcusdt","currency":"usdt","amount":"..."}' --json` | W |
| 2 | POST | `/v1/margin/orders/{id}/repay` | `htx-cli spot call POST /v1/margin/orders/<id>/repay --body '{"amount":"..."}' --json` | W |
| 3 | GET | `/v1/margin/loan-orders` | `htx-cli spot call GET /v1/margin/loan-orders --query symbol=<symbol> --json` | R |
| 4 | GET | `/v1/margin/accounts/balance` | `htx-cli spot call GET /v1/margin/accounts/balance --query symbol=<symbol> --json` | R |

## Order types

See `references/order-types.md`. Common values for `--type`:

- `buy-limit`, `sell-limit` — limit order
- `buy-market`, `sell-market` — market order (for `buy-market`, `amount` is quote currency)
- `buy-ioc`, `sell-ioc` — immediate-or-cancel
- `buy-limit-maker`, `sell-limit-maker` — post-only
- `buy-stop-limit`, `sell-stop-limit` — stop-limit
- `buy-limit-fok`, `sell-limit-fok` — fill-or-kill

## Safety checklist

Before any write:

- [ ] Fetch current price via `htx-cli spot market ticker <symbol> --json` and show the distance from the user's price
- [ ] Show quantity, price, and **estimated total cost**
- [ ] For margin borrow: show borrow rate and the **liquidation price** implied by the position
- [ ] For batch cancel: list the order IDs that will be cancelled
- [ ] Wait for explicit confirmation ("yes" / "confirm")
- [ ] Emit the CLI command, capture its JSON response, report success/failure

## Typical session

```bash
# 1. Check price
htx-cli spot market ticker btcusdt --json

# 2. Find account id
htx-cli spot account list --json   # type=spot

# 3. Confirm with user, then place order
htx-cli spot order place --account-id 123 --symbol btcusdt \
    --type buy-limit --amount 0.01 --price 82000 --json

# 4. Monitor
htx-cli spot order query <order-id> --json
```

## References

- `references/authentication.md`
- `references/order-types.md`
