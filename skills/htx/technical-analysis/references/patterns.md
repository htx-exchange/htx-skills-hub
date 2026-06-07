# Candlestick Pattern Recognition (12 patterns)

```bash
python scripts/patterns.py <name> --kline kline.json [--list]
python scripts/patterns.py scan --kline kline.json   # scan all, return latest matches
```

Returns `{"match": true|false, "ts": ...}` or in scan mode `{"patterns": ["doji", "bull-engulf"], "ts": ...}`.

## 12 Patterns

### Reversal

| Name | Signal | Criteria |
|---|---|---|
| `doji` | Neutral / reversal hint | Body < 10% of shadow |
| `hanging-man` | Top reversal | End of uptrend, small body + long lower shadow |
| `inverted-hammer` | Bottom reversal | End of downtrend, small body + long upper shadow |
| `shooting-star` | Top reversal | End of uptrend, small body + long upper shadow |
| `bull-engulf` | Bullish engulfing | Long bullish candle fully engulfs prior bearish candle |
| `bear-engulf` | Bearish engulfing | Long bearish candle fully engulfs prior bullish candle |

### Harami

| Name | Signal | Criteria |
|---|---|---|
| `bull-harami` | Bullish harami | Small bullish candle fully contained within prior large bearish candle |
| `bear-harami` | Bearish harami | Small bearish candle fully contained within prior large bullish candle |
| `bull-harami-cross` | Strengthened bullish | bull-harami where the small bullish candle is a doji |
| `bear-harami-cross` | Strengthened bearish | bear-harami where the small bearish candle is a doji |

### Continuation

| Name | Signal | Criteria |
|---|---|---|
| `three-soldiers` | Strong bullish | 3 consecutive bullish candles, each closing above the previous, small upper shadows |
| `three-crows` | Strong bearish | 3 consecutive bearish candles, each closing below the previous, small lower shadows |

## Usage Tips

- **Pattern != Signal**: A standalone pattern is not a tradable signal; it must be combined with context (trend / key levels / volume)
- **Multi-timeframe confirmation**: If bull-engulf appears on 1H, first check whether the 4H trend agrees
- **Location matters**: bull-engulf at support / historical bottom > bull-engulf in the middle of a range
- **Combine with divergence**: Pattern + RSI bullish divergence = high-probability reversal

## Integration with ta-master

ta-master accumulates pattern matches in the "Price-Volume Score Pillar":
- Bullish pattern match: +4 points each
- Bearish pattern match: -4 points each
