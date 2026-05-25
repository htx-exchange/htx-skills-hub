# Technical Indicator Reference (51 indicators)

Common invocation:
```bash
python scripts/indicators.py <name> --kline <kline.json> [--params <p1,p2,...>] [--list] [--limit 10]
```

`--list` returns the historical series (last 10 bars by default); without it, returns only the latest value.

## Moving Averages (8)

| Name | Default params | Returned fields | Use |
|---|---|---|---|
| `ma` | `5,20,60` | `ma5, ma20, ma60` | Simple MA, multi-period overlay for trend |
| `ema` | `5,20` | `ema5, ema20` | Exponential MA, weighted toward recent data |
| `wma` | `20` | `wma` | Linear weighted MA |
| `dema` | `20` | `dema` | Double EMA, reduced lag |
| `tema` | `20` | `tema` | Triple EMA, more aggressive |
| `hma` | `20` | `hma` | Hull MA, smooth and responsive |
| `kama` | `10` | `kama` | Adaptive MA: tracks trends, calm in chop |
| `zlema` | `20` | `zlema` | Zero-lag EMA |

## Trend (8)

| Name | Params | Returns | Use |
|---|---|---|---|
| `macd` | `12,26,9` | `dif, dea, macd` | Classic trend + momentum, golden/death cross |
| `adx` | `14` | `adx, plus_di, minus_di` | Trend strength, >25 = strong trend |
| `aroon` | `14` | `aroon_up, aroon_down, aroon_osc` | Identifies start/end of trends |
| `cci` | `20` | `cci` | Commodity Channel Index, +/-100 typical thresholds |
| `supertrend` | `10,3` | `supertrend, direction` | Trend-following + buy/sell signals |
| `sar` | — | `sar` | Parabolic SAR |
| `dpo` | `20` | `dpo` | Detrended Price Oscillator |
| `envelope` | `20,0.1` | `upper, middle, lower` | Simple envelope |

## Momentum (10)

| Name | Params | Returns | Use |
|---|---|---|---|
| `rsi` | `14` | `rsi` | Relative Strength, >70 overbought / <30 oversold |
| `stoch-rsi` | `14` | `k, d` | Stochastic of RSI |
| `stoch` | `14,3,3` | `k, d` | Stochastic |
| `kdj` | `9,3,3` | `k, d, j` | Most common in Chinese markets |
| `roc` | `12` | `roc` | Rate of change |
| `mom` | `10` | `mom` | Momentum (difference) |
| `ppo` | `12,26,9` | `ppo, signal, hist` | Percentage Price Oscillator |
| `trix` | `15` | `trix` | Triple-smoothed momentum |
| `wr` | `14` | `wr` | Williams %R |
| `uo` | `7,14,28` | `uo` | Ultimate Oscillator |

## Volatility (8)

| Name | Params | Returns | Use |
|---|---|---|---|
| `bb` (alias `boll`) | `20,2` | `upper, middle, lower` | Bollinger Bands |
| `bbwidth` | `20,2` | `bbwidth` | Bollinger Band Width, squeeze detection |
| `bbpct` | `20,2` | `bbpct` | Bollinger %B (position) |
| `atr` | `14` | `atr` | Average True Range, used for stops |
| `keltner` | `20,2` | `upper, middle, lower` | Keltner Channel |
| `donchian` | `20` | `upper, middle, lower` | Donchian Channel |
| `hv` | `20` | `hv` | Historical Volatility (annualized) |
| `stddev` | `20` | `stddev` | Standard deviation |

## Volume (6)

| Name | Returns | Use |
|---|---|---|
| `obv` | `obv` | Volume accumulation |
| `vwap` | `vwap` | Volume-Weighted Average Price |
| `mvwap` | `mvwap` | Rolling VWAP |
| `cmf` | `cmf` | Chaikin Money Flow |
| `mfi` | `mfi` | Money Flow Index |
| `ad` | `ad` | Accumulation/Distribution Line |

## Statistics (5)

| Name | Returns |
|---|---|
| `lr` | `lr` (Linear Regression endpoint) |
| `slope` | `slope` |
| `angle` | `angle_deg` |
| `variance` | `variance` |
| `sigma` | `sigma` (z-score) |

## Other (5)

| Name | Returns |
|---|---|
| `fisher` | `fisher, trigger` |
| `tr` | True Range |
| `tp` | Typical Price |
| `mp` | Median Price |
| `cho` | Chaikin Oscillator |

## Parameter Notes

- Most indicators take a single period via `--params 14`
- `macd` / `ppo` / `kdj` take 3 values: `--params 12,26,9`
- `supertrend` takes `--params 10,3` (period, multiplier)
- `bb` / `envelope` take `--params 20,2` (period, dev)
