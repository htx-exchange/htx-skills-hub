# Funding rate — HTX USDT-M perpetuals

Perpetual contracts have no expiry; funding payments periodically re-align the contract price to the underlying spot index.

## Settlement schedule

- Every **8 hours**: 00:00, 08:00, 16:00 UTC.
- A funding payment is exchanged between longs and shorts at each settlement.

## Direction

| Funding rate | Who pays whom |
|--------------|----------------|
| Positive | Longs pay shorts |
| Negative | Shorts pay longs |

## Formula (simplified)

```
funding_payment = position_notional × funding_rate
```

`position_notional` = `quantity × mark_price`. The rate you see is applied as a fraction over one settlement period (not annualized).

## Endpoints

| Endpoint | Use |
|----------|-----|
| `GET /linear-swap-api/v1/swap_funding_rate` | Current rate for one contract |
| `GET /linear-swap-api/v1/swap_batch_funding_rate` | Current rates for all contracts |
| `GET /linear-swap-api/v1/swap_historical_funding_rate` | History |
| `GET /linear-swap-ex/market/history/estimated_rate_kline` | Pre-settlement estimate |

## CLI examples

```bash
htx-cli futures market funding-rate BTC-USDT --json
htx-cli futures market historical-funding-rate --contract-code BTC-USDT --json
```

## Reading the response

```json
{
  "contract_code": "BTC-USDT",
  "funding_rate": "0.0001",           // 0.01% per 8h
  "estimated_rate": "0.00012",        // prediction for next period
  "funding_time": "1714032000000",    // settlement timestamp (ms)
  "next_funding_time": "1714060800000"
}
```

Annualize with: `rate × 3 × 365` ≈ APR.
