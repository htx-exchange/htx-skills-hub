---
name: htx/spot-trading
version: 2.0.0
description: HTX spot trading — limit / market orders / cancel / modify / order query / margin lending.
auth: true
risk: high
---

# Spot Trading

Place and cancel spot orders, modify and query orders, and use margin lending.

> WARNING: **High-risk write skill**. Before every order / cancel / borrow, the AI Agent must show the user the full parameters (symbol, side, type, price, amount) and obtain explicit manual confirmation.

## Authentication and permissions

- API Key needs **trade** permission
- Some query endpoints only need **read** permission
- API Key is used locally only and never uploaded

## Endpoint catalog (11)

### Place / cancel orders (core write operations)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST | `/v1/order/orders/place` | Place a single order (limit / market / TP-SL / IOC / FOK) |
| 2 | POST | `/v1/order/batch-orders` | Batch place orders (max 10) |
| 3 | POST | `/v1/order/orders/{order-id}/submitcancel` | Cancel by order ID |
| 4 | POST | `/v1/order/orders/submitCancelClientOrder` | Cancel by client-order-id |
| 5 | POST | `/v1/order/orders/batchcancel` | Batch cancel (by order ID list) |
| 6 | POST | `/v1/order/orders/batchCancelOpenOrders` | Cancel all open orders (by symbol) |

### Order query (read)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 7 | GET | `/v1/order/openOrders` | Current open orders |
| 8 | GET | `/v1/order/orders/{order-id}` | Single-order detail |
| 9 | GET | `/v1/order/orders` | Historical orders (by time window) |
| 10 | GET | `/v1/order/matchresults` | Historical trade detail |

### Margin lending

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 11 | POST | `/v1/margin/orders` | Borrow margin funds (write) |

## Order parameters (core)

```json
{
  "account-id": "<spot-account-id>",
  "symbol": "btcusdt",
  "type": "buy-limit | sell-limit | buy-market | sell-market | buy-ioc | sell-ioc | buy-limit-fok | sell-limit-fok",
  "amount": "0.001",
  "price": "65000.00",
  "client-order-id": "<optional 32 chars>",
  "source": "spot-api"
}
```

- `buy-limit` / `sell-limit`: limit order, must include `price`
- `buy-market` / `sell-market`: market order. **Buy** `amount` = USDT amount; **sell** `amount` = base currency quantity
- `buy-ioc` / `sell-ioc`: immediate-or-cancel; cancels the remainder
- `buy-limit-fok` / `sell-limit-fok`: fill-or-kill

## Workflow patterns

### Limit buy order

```bash
htx-cli spot trading place \
  --account-id <id> \
  --symbol btcusdt --type buy-limit \
  --price 65000 --amount 0.001 \
  --json
```

### Market buy 100 USDT of BTC

```bash
# market buy: amount = quote currency (USDT) amount
htx-cli spot trading place \
  --account-id <id> \
  --symbol btcusdt --type buy-market \
  --amount 100 \
  --json
```

### Cancel order

```bash
htx-cli spot trading cancel <order-id> --json
```

### Cancel all BTC/USDT open orders

```bash
htx-cli spot call /v1/order/orders/batchCancelOpenOrders \
  --method POST --auth \
  --body '{"account-id":"<id>","symbol":"btcusdt"}' --json
```

### Query current open orders

```bash
htx-cli spot trading open-orders --symbol btcusdt --json
```

## Safety constraints (must read)

Before every order, the AI Agent **MUST**:

1. Display the full order: symbol, side (buy/sell), type (limit/market), amount, limit price, estimated trade value, current order book price (reference)
2. Wait for explicit manual confirmation ("confirm / yes / place order" etc.)
3. Only call the API after confirmation is received

For every cancel:
- Single cancel: show order ID + remaining amount + price
- Batch cancel: show number of affected orders + symbols involved

For every borrow:
- Show currency, amount, current rate, potential risks
- Strongly recommend first checking spot account balance to confirm whether borrowing is necessary

## Error handling

- `account-frozen` — account frozen, halt operation
- `order-amountmin-error` — amount below minimum order size; check `min-order-amt` via `htx-cli spot-market symbols`
- `order-pricemin-error` — price precision error; check `price-precision`
- Some errors are due to rate limiting: max ~10 orders/s; on failure, back off 1s and retry

## Installation

```bash
npx -y @sheerl/htx-cli skill install spot-trading
```

## Related docs

- HTX spot trading API: https://huobiapi.github.io/docs/spot/v1/cn/#orders
