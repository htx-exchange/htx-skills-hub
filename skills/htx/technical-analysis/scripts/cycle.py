"""BTC macro cycle indicators that only need price history (no on-chain data).

Implements: AHR999, AHR999X, BTC Rainbow Chart, Pi Cycle Top, Mayer Multiple.
All formulas are public.

CLI:
    python cycle.py <indicator> --kline btc_kline.json
    python cycle.py all --kline btc_kline.json
"""
import argparse, json, math, sys
from datetime import datetime, timezone

import numpy as np
import pandas as pd


# Bitcoin genesis block: 2009-01-03 UTC
GENESIS_TS_MS = int(datetime(2009, 1, 3, tzinfo=timezone.utc).timestamp() * 1000)


def _df(kline):
    df = pd.DataFrame(kline).sort_values("id").reset_index(drop=True)
    df["close"] = df["close"].astype(float)
    df["high"] = df["high"].astype(float)
    df["low"] = df["low"].astype(float)
    return df


def _days_since_genesis(ts_ms: int) -> float:
    return max((ts_ms - GENESIS_TS_MS) / (1000 * 86400), 1)


# ============ AHR999 ============
# AHR999 = (price / 200d_avg) * (price / fitted_price)
# fitted_price = 10 ** (5.84 * log10(days) - 17.01)
# Source: ahr999, public formula on Bilibili / weibo
def ahr999(df):
    if len(df) < 200:
        return {"ahr999": None, "zone": "insufficient data (need 200+ bars)"}
    price = df["close"].iloc[-1]
    ma200 = df["close"].rolling(200).mean().iloc[-1]
    days = _days_since_genesis(int(df["id"].iloc[-1]))
    fitted = 10 ** (5.84 * math.log10(days) - 17.01)
    val = (price / ma200) * (price / fitted)
    if val < 0.45:
        zone = "accumulate"
    elif val < 1.2:
        zone = "DCA"
    else:
        zone = "bubble warning"
    return {"ahr999": round(val, 4), "zone": zone, "price": price, "ma200": round(ma200, 2), "fitted": round(fitted, 2)}


# ============ AHR999X (variant focusing only on the cycle factor) ============
def ahr999x(df):
    """AHR999X = price / fitted_price (drop the MA200 ratio for purer cycle signal)."""
    if len(df) < 1:
        return {"ahr999x": None}
    price = df["close"].iloc[-1]
    days = _days_since_genesis(int(df["id"].iloc[-1]))
    fitted = 10 ** (5.84 * math.log10(days) - 17.01)
    val = price / fitted
    return {"ahr999x": round(val, 4), "fitted": round(fitted, 2), "price": price}


# ============ BTC Rainbow Chart ============
# 9 logarithmic bands derived from the long-term BTC price growth curve.
# Each band is a multiplier applied to a base log-fit:
#   base = 10 ** (a * ln(days) + b)  with a ≈ 2.66, b ≈ -17.9
# Bands (multipliers, low to high): see below.
def rainbow(df):
    if len(df) < 1:
        return {"band": None}
    price = df["close"].iloc[-1]
    days = _days_since_genesis(int(df["id"].iloc[-1]))
    base = 10 ** (2.66 * math.log10(days) - 17.9)
    multipliers = [
        ("Fire Sale",         0.4, "#3b66f0"),
        ("BUY!",              0.55, "#42c0f5"),
        ("Accumulate",        0.75, "#3ab94e"),
        ("Still Cheap",       1.0, "#a3e842"),
        ("HODL!",             1.4, "#ffe200"),
        ("Hot",               1.85, "#ff9900"),
        ("FOMO Intensifies",  2.4, "#ff5b00"),
        ("Sell. Seriously.",  3.1, "#e83a3a"),
        ("Maximum Bubble",    4.0, "#a0118f"),
    ]
    band = "Fire Sale"
    for name, mult, _ in multipliers:
        if price <= base * mult:
            band = name
            break
    else:
        band = "Maximum Bubble"
    return {"band": band, "ratio_to_base": round(price / base, 3), "fitted_base": round(base, 2)}


# ============ Pi Cycle Top ============
# Buy/sell signal: 111-day MA crosses 350-day MA × 2
def pi_cycle(df):
    if len(df) < 350:
        return {"pi_cycle": None, "note": "need 350+ days"}
    ma111 = df["close"].rolling(111).mean()
    ma350x2 = df["close"].rolling(350).mean() * 2
    last_111 = ma111.iloc[-1]
    last_350x2 = ma350x2.iloc[-1]
    prev_111 = ma111.iloc[-2]
    prev_350x2 = ma350x2.iloc[-2]
    cross_up = prev_111 < prev_350x2 and last_111 >= last_350x2
    cross_down = prev_111 > prev_350x2 and last_111 <= last_350x2
    if cross_up:
        signal = "TOP_SIGNAL"  # historically very reliable major-top warning
    elif cross_down:
        signal = "DOWN_CROSS"
    else:
        ratio = last_111 / last_350x2
        signal = "near_top" if ratio > 0.95 else "neutral"
    return {
        "ma111": round(last_111, 2),
        "ma350x2": round(last_350x2, 2),
        "ratio": round(last_111 / last_350x2, 4),
        "signal": signal,
    }


# ============ Mayer Multiple ============
# Mayer = price / 200d MA. <1 = undervalued, >2.4 historically = overvalued
def mayer(df):
    if len(df) < 200:
        return {"mayer": None, "note": "need 200+ days"}
    price = df["close"].iloc[-1]
    ma200 = df["close"].rolling(200).mean().iloc[-1]
    val = price / ma200
    if val < 1.0:
        zone = "undervalued"
    elif val < 1.5:
        zone = "fair"
    elif val < 2.0:
        zone = "elevated"
    elif val < 2.4:
        zone = "overheated"
    else:
        zone = "bubble"
    return {"mayer": round(val, 3), "ma200": round(ma200, 2), "price": price, "zone": zone}


CYCLE_INDICATORS = {
    "ahr999": ahr999,
    "ahr999x": ahr999x,
    "rainbow": rainbow,
    "pi-cycle": pi_cycle,
    "mayer": mayer,
}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("indicator", help="ahr999 / ahr999x / rainbow / pi-cycle / mayer / all")
    p.add_argument("--kline", required=True)
    args = p.parse_args()

    df = _df(json.load(open(args.kline)))

    if args.indicator == "all":
        out = {"ts": int(df["id"].iloc[-1])}
        for name, fn in CYCLE_INDICATORS.items():
            try:
                out[name] = fn(df)
            except Exception as e:
                out[name] = {"error": str(e)}
        print(json.dumps(out, indent=2)); return

    fn = CYCLE_INDICATORS.get(args.indicator)
    if fn is None:
        print(json.dumps({"error": f"Unknown: {args.indicator}",
                          "available": sorted(CYCLE_INDICATORS.keys())})); sys.exit(1)
    out = fn(df)
    out["ts"] = int(df["id"].iloc[-1])
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
