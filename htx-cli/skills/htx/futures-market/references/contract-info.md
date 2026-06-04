# USDT-M futures contract reference

## Contract code format

```
<BASE>-USDT      e.g. BTC-USDT, ETH-USDT, SOL-USDT
```

Fetch the full list:

```bash
htx-cli futures market contract-info --json
```

## Account modes

| Mode | CLI | Description |
|------|-----|-------------|
| Isolated (`逐仓`) | endpoints ending in plain `/v1/swap_*` | Margin scoped to single contract |
| Cross (`全仓`) | endpoints with `_cross_` | Shared margin across contracts |

Many endpoints exist in both variants — choose based on the user's account configuration.

## Tier margin

Margin requirement rises in tiers as position size grows. Query via:

```bash
htx-cli futures call POST /linear-swap-api/v1/swap_tiered_margin_info --json
htx-cli futures call POST /linear-swap-api/v1/swap_cross_tiered_margin_info --json
```

Returned `adjust_factor` × position value gives the maintenance margin ratio for that tier.

## Index / mark / last price

| Price | Endpoint | Use |
|-------|----------|-----|
| Last traded | `market/detail/merged` | Reference / fills |
| Mark | `market/history/mark_price_kline` | Used for PnL and liquidation |
| Index | `swap_index` | External spot-reference price |
| Estimated funding rate | `market/history/estimated_rate_kline` | Pre-settlement estimate |

For liquidation-price computations, use **mark price**, not last.

## K-line periods

```
1min, 5min, 15min, 30min, 60min, 4hour, 1day, 1mon
```
