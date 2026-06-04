# Futures order types & field reference

## `order_price_type`

| Value | Behaviour |
|-------|-----------|
| `limit` | Limit order. Requires `price`. |
| `opponent` | Best opposite-side price. No `price`. |
| `optimal_5` / `optimal_10` / `optimal_20` | Best-N opposite price. |
| `post_only` | Maker only; rejected if would take. |
| `ioc` | Immediate-or-cancel limit. |
| `fok` | Fill-or-kill limit. |
| `opponent_ioc` / `optimal_5_ioc` / `optimal_10_ioc` / `optimal_20_ioc` | IOC variants. |
| `opponent_fok` / `optimal_5_fok` / `optimal_10_fok` / `optimal_20_fok` | FOK variants. |

## `direction` and `offset`

```
direction: buy  | sell
offset:    open | close | both   // both = close-first then open-remainder
```

Position mode `dual_side` also accepts `reduce_only` via a separate flag.

## Base order — required fields

```json
{
  "contract_code": "BTC-USDT",
  "volume": 1,
  "direction": "buy",
  "offset": "open",
  "lever_rate": 10,
  "price": "85000",
  "order_price_type": "limit"
}
```

- `volume` is **number of contracts** (not coin). For BTC-USDT each contract = 0.001 BTC; varies per contract — check `swap_contract_info`.

## Trigger order — extra fields

```json
{
  "trigger_type": "ge",        // "ge" (>=) or "le" (<=)
  "trigger_price": "80000",
  "order_price": "79990",
  "order_price_type": "limit"  // or "optimal_20"
}
```

A trigger order fires a regular order when mark price crosses `trigger_price`.

## TP/SL order — extra fields

Attach to an open position:

```json
{
  "tp_trigger_price": "90000",
  "tp_order_price": "89990",
  "tp_order_price_type": "limit",
  "sl_trigger_price": "82000",
  "sl_order_price": "81990",
  "sl_order_price_type": "limit",
  "volume": 1,
  "direction": "sell"          // opposite of your position
}
```

Only one side (tp or sl) may be set; both can be set together. `direction` must be the **closing** side.

## Close-position idioms

- **Limit close:** `direction` opposite to position, `offset: close`, `price`, `volume`.
- **Market close:** same fields with `order_price_type: opponent` and no `price`.
- **Flash close (lightning):** use `/swap_lightning_close_position` — fills immediately against the book at the best available price; pass `volume` and `direction`.
