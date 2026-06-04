# Spot order types

Value for `--type` when calling `htx-cli spot order place`.

| Type | Side | Behaviour |
|------|------|-----------|
| `buy-limit` | buy | Limit order. `--price` required. |
| `sell-limit` | sell | Limit order. `--price` required. |
| `buy-market` | buy | Market buy. **`--amount` is quote-currency amount** (e.g. USDT). No `--price`. |
| `sell-market` | sell | Market sell. `--amount` is base-currency amount. |
| `buy-ioc` | buy | Immediate-or-cancel, limit price. |
| `sell-ioc` | sell | Immediate-or-cancel, limit price. |
| `buy-limit-maker` | buy | Post-only: rejected if would take liquidity. |
| `sell-limit-maker` | sell | Post-only. |
| `buy-limit-fok` | buy | Fill-or-kill: full fill or nothing. |
| `sell-limit-fok` | sell | Fill-or-kill. |
| `buy-stop-limit` | buy | Stop-limit. Requires `operator` (`gte` / `lte`) and `stop-price`. |
| `sell-stop-limit` | sell | Stop-limit. |

## Amount semantics

- For `buy-market`: `amount` = quote asset (how much USDT to spend).
- For everything else: `amount` = base asset.

## Order states (for `--states`)

```
submitted, partial-filled, partial-canceled, filled, canceled
```

Example:

```bash
htx-cli spot order list --symbol btcusdt --states submitted,partial-filled --json
```

## Client order id

Pass `--client-order-id <coid>` for idempotency. Query later by `getClientOrder`:

```bash
htx-cli spot call GET /v1/order/orders/getClientOrder --query clientOrderId=<coid> --json
```
