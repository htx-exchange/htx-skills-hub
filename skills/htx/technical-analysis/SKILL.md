---
name: htx/technical-analysis
version: 3.0.0
description: HTX technical indicator analysis engine — 51 indicators + 12 candlestick patterns + 5 BTC cycle indicators + automatic divergence detection, all computed locally in Python.
auth: false
risk: low
---

# Technical Analysis — Indicator Engine v3

Local computation engine, **no API key required**. Pulls data from HTX kline endpoints and computes indicators / patterns / cycles locally with numpy/pandas.

> **Compliance disclaimer**: this skill provides raw indicator values and does not embed any strategy recommendations or trading advice. All decisions are made by the user based on their own risk tolerance.

## Capability overview

| Category | Count | File |
|---|---|---|
| Moving averages | 8 (ma, ema, wma, dema, tema, hma, kama, zlema) | `scripts/indicators.py` |
| Trend | 8 (macd, adx, aroon, cci, supertrend, sar, dpo, envelope) | same |
| Momentum | 10 (rsi, stoch-rsi, stoch, kdj, roc, mom, ppo, trix, wr, uo) | same |
| Volatility | 8 (bb, bbwidth, bbpct, atr, keltner, donchian, hv, stddev) | same |
| Volume | 6 (obv, vwap, mvwap, cmf, mfi, ad) | same |
| Statistics | 5 (lr, slope, angle, variance, sigma) | same |
| Other | 5 (fisher, tr, tp, mp, cho) + divergence | same |
| **Candlestick patterns** | 12 (doji / engulfing / harami / 3-soldiers / 3-crows ...) | `scripts/patterns.py` |
| **BTC cycle** | 5 (ahr999 / ahr999x / rainbow / pi-cycle / mayer) | `scripts/cycle.py` |
| **Indicator total** | **51 indicators + 12 patterns + 5 cycles = 68** | |

## Quick start

### Pull klines + compute indicators

```bash
# 1. Pull BTC/USDT 4-hour klines
htx-cli spot-market kline -p symbol=btcusdt -p period=4hour -p size=300 \
  | jq '.data' > /tmp/btc4h.json

# 2. Compute RSI
python scripts/indicators.py rsi --kline /tmp/btc4h.json --params 14
# → {"rsi": 62.4, "ts": 1779000000000}

# 3. Compute MACD (default 12,26,9)
python scripts/indicators.py macd --kline /tmp/btc4h.json
# → {"dif": 320.1, "dea": 245.3, "macd": 149.6, "ts": ...}

# 4. Scan all candlestick patterns
python scripts/patterns.py scan --kline /tmp/btc4h.json
# → {"patterns": ["doji", "bull-engulf"], "ts": ...}

# 5. BTC cycle one-shot full run
python scripts/cycle.py all --kline /tmp/btc1d.json
```

### List all indicators

```bash
python scripts/indicators.py list
# → ["ma", "ema", "rsi", "macd", "supertrend", ...]
```

## Command reference

See `references/`:
- `references/indicators.md` — parameters / return fields / formulas for the 51 technical indicators
- `references/patterns.md` — judgment rules and typical scenarios for the 12 candlestick patterns
- `references/cycle.md` — formulas and interpretation ranges for the 5 BTC cycle indicators
- `references/divergence.md` — automatic divergence detection algorithm and usage notes

## Automatic divergence detection

```bash
python scripts/indicators.py divergence --kline /tmp/btc4h.json --params 14
# → {"divergence": "bull_reg", ...}
```

Return values:
- `bull_reg` — price makes a new low, indicator does not (**bottom reversal signal**)
- `bear_reg` — price makes a new high, indicator does not (**top reversal signal**)
- `bull_hid` — price makes a higher low, indicator a lower low (**pullback within uptrend**)
- `bear_hid` — price makes a lower high, indicator a higher high (**bounce within downtrend**)

## BTC cycle indicators (BTC-USDT only)

All 5 indicators are based on price + time formulas; no on-chain data required:

| Indicator | Use | Interpretation |
|---|---|---|
| `ahr999` | DCA timing | <0.45 bottom-fish / 0.45-1.2 DCA / >1.2 top warning |
| `ahr999x` | Pure cycle signal | Ratio vs fitted curve |
| `rainbow` | 9-band rainbow valuation | "Fire Sale" → "Maximum Bubble" |
| `pi-cycle` | Cycle-top warning | 111d MA crosses above 350d MA × 2 = historical top |
| `mayer` | Long-term valuation | <1 undervalued / >2.4 historical bubble |

## Data requirements

| Indicator type | Min klines |
|---|---|
| Short-period (RSI 14, MACD 26, ATR 14) | 50 bars |
| Long-period (MA200, KAMA) | 200+ bars |
| BTC cycle (Pi Cycle 350d, Mayer 200d) | 350+ daily klines |
| Divergence detection | 50+ bars |

## Typical scenarios

**"How does BTC 4H look technically?"**
```bash
htx-cli spot-market kline -p symbol=btcusdt -p period=4hour -p size=200 | jq '.data' > btc.json
python scripts/indicators.py rsi --kline btc.json
python scripts/indicators.py macd --kline btc.json
python scripts/indicators.py supertrend --kline btc.json
python scripts/patterns.py scan --kline btc.json
python scripts/indicators.py divergence --kline btc.json
# AI synthesizes all outputs to make a judgment
```

**"Is ETH overbought?"**
```bash
python scripts/indicators.py rsi --kline eth4h.json
# rsi > 70 means overbought
```

**"BTC long-term valuation right now"**
```bash
htx-cli spot-market kline -p symbol=btcusdt -p period=1day -p size=400 | jq '.data' > btc1d.json
python scripts/cycle.py all --kline btc1d.json
```

## Relationship with other skills

- **Data source**: depends on `htx/spot-market` or `htx/futures-market` for klines
- **Upper-layer orchestration**: invoked by `htx/ta-master` as the "price/volume" pillar

## Installation

```bash
npx -y @sheerl/htx-cli skill install technical-analysis
```
