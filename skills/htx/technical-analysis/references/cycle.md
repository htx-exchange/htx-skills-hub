# BTC Cycle Indicator Reference

All 5 indicators are based purely on BTC historical price + time formulas (genesis date 2009-01-03), with no on-chain data required. **Applicable to BTC-USDT only**.

```bash
python scripts/cycle.py <name> --kline btc1d.json
python scripts/cycle.py all --kline btc1d.json   # run all at once
```

## AHR999

```
AHR999 = (price / MA200) × (price / fitted_price)
fitted_price = 10 ^ (5.84 × log10(days_since_genesis) - 17.01)
```

| Range | Meaning |
|---|---|
| < 0.45 | **Bottom-fishing zone** (accumulate) |
| 0.45 - 1.2 | DCA zone |
| > 1.2 | Top warning / bubble |

## AHR999X

Uses only the cycle factor: `price / fitted_price`, dropping the MA200 ratio for a purer reflection of cycle position.

## BTC Rainbow Chart

9 logarithmic valuation bands:

| Color | Name | Meaning |
|---|---|---|
| Blue | Fire Sale | Extreme undervaluation, once every 4 years |
| Light Blue | BUY! | Undervalued — buy |
| Green | Accumulate | Accumulation zone |
| Light Green | Still Cheap | Still on the cheap side |
| Yellow | HODL! | Fair value |
| Orange | Hot | Running hot |
| Red-orange | FOMO Intensifies | FOMO heating up |
| Red | Sell. Seriously. | Seriously consider trimming |
| Purple | Maximum Bubble | Extreme bubble |

## Pi Cycle Top

```
Signal: 111-day MA crosses ABOVE 350-day MA × 2
```

Historically all three BTC tops (2013 / 2017 / 2021) were reached within 3 days of this signal triggering. Extremely rare; once triggered it is a strong signal to reduce exposure.

## Mayer Multiple

```
Mayer = price / 200d_MA
```

| Range | Meaning |
|---|---|
| < 1.0 | Undervalued |
| 1.0 - 1.5 | Fair value |
| 1.5 - 2.0 | Elevated |
| 2.0 - 2.4 | Overheated |
| > 2.4 | Historical bubble zone |

## Data Requirements

- AHR999 / AHR999X / Mayer: >= 200 daily candles
- Pi Cycle: >= 350 daily candles
- Rainbow: any number
- Pre-genesis prices do not exist; HTX klines are complete from 2017 onward. Earlier prices can be supplemented with a CoinMarketCap CSV
