---
name: htx/ta-master
version: 1.0.0
description: HTX technical analysis master — three-pillar weighted scoring (price/volume 50% + derivatives 30% + BTC cycle 20%) yielding a 0-100 composite score with detailed interpretation.
auth: false
risk: low
---

# Technical Analysis Master

Layer 2 orchestration skill, **no API key required**. Composes 6 L1 skills into a three-pillar score and provides a 0-100 composite read.

> **Compliance disclaimer**: the score is a mechanical algorithmic output and **does not constitute investment advice**. Markets carry risk; all decisions are made by the user.

## Three-pillar scoring framework

| Pillar | Weight | Data source | Output |
|---|---|---|---|
| Price/Volume | **50%** | `htx/technical-analysis` (51 indicators + 12 patterns + divergences) | 0-100 sub-score |
| Derivatives | **30%** | `funding-rate` / `oi-tracker` / `liquidation-stream` / `elite-positioning` / `mark-price` | 0-100 sub-score |
| BTC cycle | **20%** | `htx/technical-analysis cycle.py` (BTC-USDT only) | 0-100 sub-score |

For non-BTC assets the weights are auto-redistributed to price/volume 62.5% + derivatives 37.5%.

## Composite score interpretation

| Composite score | Label |
|---|---|
| ≥ 70 | **STRONG BULLISH** |
| 55-70 | MILD BULLISH |
| 45-55 | NEUTRAL |
| 30-45 | MILD BEARISH |
| < 30 | **STRONG BEARISH** |

## Workflow

### Full version (BTC, three pillars)

```bash
# 1. Pull daily klines (cycle pillar needs 350+ daily klines)
htx-cli spot-market kline -p symbol=btcusdt -p period=1day -p size=400 | jq '.data' > /tmp/btc1d.json
htx-cli spot-market kline -p symbol=btcusdt -p period=4hour -p size=300 | jq '.data' > /tmp/btc4h.json

# 2. Compute price/volume features → pv.json
python -c "
import json
import indicators, patterns
df = indicators._df(json.load(open('/tmp/btc4h.json')))
out = {
    'rsi': indicators.rsi(df)['rsi'].iloc[-1],
    'macd_hist': indicators.macd(df)['macd'].iloc[-1],
    'ema_fast': indicators.ema(df, periods=(20,))['ema20'].iloc[-1],
    'ema_slow': indicators.ema(df, periods=(60,))['ema60'].iloc[-1],
    'adx': indicators.adx(df)['adx'].iloc[-1],
    'divergence': str(indicators.divergence(df)['divergence'].iloc[-1]),
    'patterns_bullish_count': sum(1 for p in patterns.scan(df) if p.startswith('bull') or p in ('three-soldiers','inverted-hammer')),
    'patterns_bearish_count': sum(1 for p in patterns.scan(df) if p.startswith('bear') or p in ('three-crows','shooting-star','hanging-man')),
}
json.dump(out, open('/tmp/pv.json', 'w'))
"

# 3. Pull derivatives → deriv.json
htx-cli funding-rate current -p contract_code=BTC-USDT --json > /tmp/fr.json
htx-cli oi-tracker history -p contract_code=BTC-USDT -p period=60min -p size=24 --json > /tmp/oi.json
htx-cli liquidation-stream recent -p contract=BTC-USDT --json > /tmp/liq.json
htx-cli elite-positioning ratio -p contract_code=BTC-USDT --json > /tmp/elite.json
htx-cli mark-price basis -p contract_code=BTC-USDT --json > /tmp/basis.json
# Then aggregate into deriv.json (see references/derivatives-features.md)

# 4. Compute cycle pillar → cycle.json (BTC only)
python scripts/cycle.py all --kline /tmp/btc1d.json > /tmp/cycle_raw.json
# Extract key fields into cycle.json: ahr999 / mayer / pi_cycle_signal / rainbow_band

# 5. Three-pillar combined score
python scripts/scoring.py --pricevol /tmp/pv.json --derivatives /tmp/deriv.json --cycle /tmp/cycle.json
```

### Simple version (non-BTC, two pillars)

```bash
python scripts/scoring.py --pricevol pv.json --derivatives deriv.json
```

Example output (BTC full three-pillar):

```json
{
  "composite": {
    "composite": 62.4,
    "label": "MILD BULLISH",
    "weights": {"pv": 0.5, "deriv": 0.3, "cycle": 0.2}
  },
  "pillars": {
    "price_volume": {
      "score": 65.0,
      "notes": ["RSI 58.3 bullish", "MACD hist > 0", "EMA fast > slow (uptrend)"]
    },
    "derivatives": {
      "score": 55.0,
      "notes": ["Funding 0.012% — bullish bias", "Elite L/S 1.18 — leaning long"]
    },
    "cycle": {
      "score": 70.0,
      "notes": ["AHR999 1.05 — DCA zone", "Mayer 1.32 — fair", "Rainbow: HODL!"]
    }
  }
}
```

## Scoring details

See `scripts/scoring.py` for the source. Each pillar lists its contributing items and notes.

### Price/volume pillar items

| Signal | Add / subtract |
|---|---|
| RSI > 70 (overbought) | -10 |
| RSI > 55 (bullish-leaning) | +5 |
| RSI < 30 (oversold) | +10 |
| RSI < 45 (bearish-leaning) | -5 |
| MACD hist > 0 / < 0 | ±7 |
| EMA fast above / below slow | ±8 |
| ADX > 25 | strong-trend amplifier (no direct score) |
| Bullish regular divergence (`bull_reg`) | +12 |
| Bearish regular divergence (`bear_reg`) | -12 |
| Bullish / bearish hidden divergence | ±6 |
| Each bullish pattern | +4 |
| Each bearish pattern | -4 |

### Derivatives pillar items

| Signal | Add / subtract |
|---|---|
| Funding > 0.05% | -12 (longs overheated) |
| Funding < -0.05% | +12 (shorts overheated) |
| OI 24h +15% | -8 (squeeze risk) |
| OI 24h -10% | -6 (capital exiting) |
| Elite L/S > 1.5 | +10 (smart money long) |
| Elite L/S < 0.7 | -10 (smart money short) |
| 1h long-liquidation share > 80% | +8 (bottom signal) |
| 1h short-liquidation share > 80% | -8 (top signal) |
| Basis deviation ±0.5% | ±4 |

### BTC cycle pillar items

| Signal | Add / subtract |
|---|---|
| AHR999 < 0.45 | +20 (bottom-fishing zone) |
| AHR999 > 1.6 | -20 (bubble warning) |
| Pi Cycle TOP triggered | -25 WARNING |
| Mayer < 1 | +8 |
| Mayer > 2.4 | -12 |
| Rainbow in Fire Sale / BUY / Accumulate | +10 |
| Rainbow in FOMO / Sell / Bubble | -10 |

## Data gaps (honest disclosure)

ta-master **does not cover** the following indicators (HTX provides no native endpoint; paid data sources are required):

| Gap | Source |
|---|---|
| MVRV / NUPL / SOPR | Glassnode (on-chain) |
| Hash Ribbon / miner hashrate | Mempool.space |
| LTH/STH supply | Glassnode |
| All-account long/short ratio (retail breakdown) | HTX only provides the elite breakdown |
| Taker active buy/sell volume | Not provided by HTX |
| Liquidation heatmap density | We aggregate from the local liquidation order stream; density is lower than Coinglass |

Future option: integrate via `--external-source glassnode` etc.

## Dependent skills

Before installing this skill, ensure the following are installed:
- `htx/spot-market` (kline source)
- `htx/futures-market` (kline source)
- `htx/technical-analysis` (indicator computation engine)
- `htx/funding-rate`
- `htx/oi-tracker`
- `htx/liquidation-stream`
- `htx/elite-positioning`
- `htx/mark-price`

## Installation

```bash
npx -y @sheerl/htx-cli skill install ta-master
```

## Typical questions

- "How does BTC look right now combining technicals + derivatives + cycle?"
- "ETH 4H composite score"
- "Market-wide scan, give me coins with ta-master score > 70"
- "Judge BTC right now using AHR999 + funding rate + RSI together"
