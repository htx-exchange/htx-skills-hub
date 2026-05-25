---
name: htx/futures-trading
version: 2.0.0
description: HTX USDT-M perpetual futures order management — open / close / TP/SL / trigger orders / modify / cancel.
auth: true
risk: high
---

# Futures Trading

Place, cancel, modify orders, set TP/SL and trigger orders, and close positions on USDT-M perpetual futures.

> WARNING: **Extremely high-risk write skill**. Perpetual futures use leverage; an erroneous order can cause rapid loss or liquidation. Every action must require manual confirmation before execution.

## Authentication and permissions

- API Key needs **futures-trade** permission
- Some query endpoints only need **futures-read** permission

## Endpoint overview (grouped by function, ~50 endpoints)

> Path base `/linear-swap-api`. `cross_` prefix = cross-margin; no prefix = isolated.

### 1. Place order — write

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/swap_order` | Isolated single order |
| POST | `/v1/swap_cross_order` | Cross-margin single order |
| POST | `/v1/swap_batchorder` | Isolated batch orders (max 10) |
| POST | `/v1/swap_cross_batchorder` | Cross-margin batch orders |

### 2. Cancel — write

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/swap_cancel` | Isolated single cancel |
| POST | `/v1/swap_cross_cancel` | Cross-margin single cancel |
| POST | `/v1/swap_cancelall` | Isolated cancel all |
| POST | `/v1/swap_cross_cancelall` | Cross-margin cancel all |

### 3. Modify — write

| Method | Path |
|--------|------|
| POST | `/v1/swap_switch_lever_rate` (change leverage) |
| POST | `/v1/swap_cross_switch_lever_rate` |

### 4. TP/SL / trailing stop — write

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/swap_tpsl_order` | Isolated TP/SL |
| POST | `/v1/swap_cross_tpsl_order` | Cross-margin TP/SL |
| POST | `/v1/swap_tpsl_cancel` | Cancel TP/SL |
| POST | `/v1/swap_cross_tpsl_cancel` | Cancel cross-margin TP/SL |
| POST | `/v1/swap_track_order` | Trailing stop order |
| POST | `/v1/swap_cross_track_order` | Cross-margin trailing stop |

### 5. Trigger orders — write

| Method | Path |
|--------|------|
| POST | `/v1/swap_trigger_order` |
| POST | `/v1/swap_cross_trigger_order` |
| POST | `/v1/swap_trigger_cancel` |
| POST | `/v1/swap_cross_trigger_cancel` |
| POST | `/v1/swap_trigger_cancelall` |
| POST | `/v1/swap_cross_trigger_cancelall` |

### 6. Lightning close — write

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/swap_lightning_close_position` | Isolated lightning close |
| POST | `/v1/swap_cross_lightning_close_position` | Cross-margin lightning close |

### 7. Order query (read)

| Method | Path |
|--------|------|
| POST | `/v1/swap_openorders` (isolated open orders) |
| POST | `/v1/swap_cross_openorders` (cross-margin open orders) |
| POST | `/v1/swap_order_info` (single order info) |
| POST | `/v1/swap_cross_order_info` |
| POST | `/v1/swap_order_detail` (order detail) |
| POST | `/v1/swap_cross_order_detail` |
| POST | `/v1/swap_hisorders` (historical orders) |
| POST | `/v1/swap_cross_hisorders` |
| POST | `/v1/swap_matchresults` (trade detail) |
| POST | `/v1/swap_cross_matchresults` |
| POST | `/v1/swap_hisorders_exact` (exact query) |
| POST | `/v1/swap_cross_hisorders_exact` |
| POST | `/v3/swap_hisorders_exact` |
| POST | `/v3/swap_cross_hisorders_exact` |
| POST | `/v3/swap_matchresults_exact` |
| POST | `/v3/swap_cross_matchresults_exact` |
| POST | `/v1/swap_tpsl_openorders` |
| POST | `/v1/swap_cross_tpsl_openorders` |
| POST | `/v1/swap_tpsl_hisorders` |
| POST | `/v1/swap_cross_tpsl_hisorders` |
| POST | `/v1/swap_relation_tpsl_order` |

## Order parameters (core)

```json
{
  "contract_code": "BTC-USDT",
  "direction": "buy | sell",
  "offset": "open | close",
  "lever_rate": 10,
  "order_price_type": "limit | post_only | optimal_5 | optimal_10 | optimal_20 | ioc | fok | opponent | lightning",
  "price": "65000",
  "volume": 1,
  "client_order_id": <int64 optional>,
  "tp_trigger_price": "70000",  
  "tp_order_price": "70100",
  "sl_trigger_price": "62000",
  "sl_order_price": "61900"
}
```

- `direction + offset` combinations:
  - `buy + open` = open long
  - `sell + open` = open short
  - `buy + close` = close short
  - `sell + close` = close long
- `volume` unit: **contracts** (`BTC-USDT` 1 contract = 0.001 BTC; check `contract_size`)

## Workflow patterns

### Cross-margin BTC perpetual 10x open long 0.1 BTC

```bash
# 1. First check contract_size: BTC-USDT = 0.001 BTC per contract
htx-cli futures-market contract-info -p contract_code=BTC-USDT
# 0.1 BTC = 100 contracts

# 2. Place order (open long)
htx-cli futures call /v1/swap_cross_order --auth \
  --body '{
    "contract_code": "BTC-USDT",
    "direction": "buy",
    "offset": "open",
    "lever_rate": 10,
    "order_price_type": "optimal_5",
    "volume": 100
  }' --json
```

### Place TP and SL together (cross-margin)

```bash
htx-cli futures call /v1/swap_cross_tpsl_order --auth \
  --body '{
    "contract_code": "BTC-USDT",
    "direction": "sell",
    "tp_trigger_price": "70000",
    "tp_order_price": "70100",
    "tp_order_price_type": "limit",
    "sl_trigger_price": "62000",
    "sl_order_price": "61900",
    "sl_order_price_type": "limit",
    "volume": 100
  }' --json
```

### Close all SOL-USDT positions

```bash
# Lightning close (market order)
htx-cli futures call /v1/swap_cross_lightning_close_position --auth \
  --body '{
    "contract_code": "SOL-USDT",
    "direction": "sell"
  }' --json
```

### Cancel all BTC-USDT open orders

```bash
htx-cli futures call /v1/swap_cross_cancelall --auth \
  --body '{"contract_code":"BTC-USDT"}' --json
```

## Safety constraints (must read)

Before every order, the AI Agent **MUST**:

1. Calculate and display:
   - Contract / direction / leverage / contracts / underlying quantity (contracts × contract_size) / order price
   - Estimated margin required
   - Current mark price + deviation from limit price
   - Liquidation price (if computable)
2. Warn about risk: leverage above 5x must explicitly note "high leverage = high liquidation risk"
3. Display the account's current available margin (call futures-account)
4. Wait for the user to explicitly say "confirm order"
5. Only execute after confirmation

For every close / lightning close:
- Display current position size, cost basis, current PnL
- Confirm whether it is "close all" or "partial close"
- Lightning close = market order, immediate fill, no price protection

For every leverage change:
- Display current leverage → target leverage
- Check whether positions / open orders will be impacted
- Warn about risk (higher leverage = closer liquidation price)

## Error codes

- `position-empty` — no position, cannot close
- `volume-precision-error` — contracts must be integer
- `lever-rate-too-high` — exceeds the contract's leverage tier cap
- `available-margin-insufficient` — insufficient margin; transfer in more USDT or lower leverage
- Rate limit: roughly max 30 orders/cancels per second

## Installation

```bash
npx -y @sheerl/htx-cli skill install futures-trading
```

## Related docs

- HTX perpetual futures API: https://huobiapi.github.io/docs/usdt_swap/v1/cn/
