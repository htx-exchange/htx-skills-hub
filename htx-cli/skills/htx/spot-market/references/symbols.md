# Spot symbols & currencies — quick reference

HTX spot symbol format is `<base><quote>` in lowercase, no separator.

## Common symbols

| Display | HTX symbol |
|---------|------------|
| BTC/USDT | `btcusdt` |
| ETH/USDT | `ethusdt` |
| SOL/USDT | `solusdt` |
| BTC/USDC | `btcusdc` |
| ETH/BTC | `ethbtc` |

Fetch the live list with:

```bash
htx-cli spot market symbols --json
```

## K-line periods

Valid values for `--period`:

```
1min, 5min, 15min, 30min, 60min, 4hour, 1day, 1mon, 1week, 1year
```

## Depth aggregation levels

`--type` for `spot market depth`:

```
step0, step1, step2, step3, step4, step5
```

`step0` = no aggregation (finest). Higher step = coarser price buckets.

## Currency & chain info

```bash
htx-cli spot call GET /v2/reference/currencies --json
```

Returns each currency's supported chains, deposit / withdraw status, and minimum amounts.
