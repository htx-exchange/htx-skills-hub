"""Candlestick pattern detection — 12 patterns, pure pandas.

CLI:
    python patterns.py <pattern> --kline kline.json [--list]
    python patterns.py scan --kline kline.json   # scan all patterns at last bar
"""
import argparse, json, sys
import numpy as np, pandas as pd


def _df(kline):
    df = pd.DataFrame(kline).sort_values("id").reset_index(drop=True)
    for c in ("open", "high", "low", "close"): df[c] = df[c].astype(float)
    df["body"] = (df["close"] - df["open"]).abs()
    df["range"] = df["high"] - df["low"]
    df["upper_shadow"] = df["high"] - df[["open", "close"]].max(axis=1)
    df["lower_shadow"] = df[["open", "close"]].min(axis=1) - df["low"]
    df["bullish"] = df["close"] > df["open"]
    return df


def doji(df, threshold=0.1):
    """Body is < threshold of range."""
    return (df["body"] / df["range"]) < threshold


def hanging_man(df):
    """Small body at top, long lower shadow, in uptrend."""
    return (
        (df["body"] / df["range"] < 0.3) &
        (df["lower_shadow"] > 2 * df["body"]) &
        (df["upper_shadow"] < df["body"]) &
        (df["close"].rolling(5).mean() > df["close"].rolling(20).mean())
    )


def inverted_hammer(df):
    """Small body at bottom, long upper shadow, in downtrend."""
    return (
        (df["body"] / df["range"] < 0.3) &
        (df["upper_shadow"] > 2 * df["body"]) &
        (df["lower_shadow"] < df["body"]) &
        (df["close"].rolling(5).mean() < df["close"].rolling(20).mean())
    )


def shooting_star(df):
    """Like inverted hammer but in uptrend."""
    return (
        (df["body"] / df["range"] < 0.3) &
        (df["upper_shadow"] > 2 * df["body"]) &
        (df["lower_shadow"] < df["body"]) &
        (df["close"].rolling(5).mean() > df["close"].rolling(20).mean())
    )


def bull_engulf(df):
    """Bullish candle engulfs prior bearish candle."""
    prev_bearish = df["close"].shift() < df["open"].shift()
    curr_bullish = df["close"] > df["open"]
    engulf = (df["open"] < df["close"].shift()) & (df["close"] > df["open"].shift())
    return prev_bearish & curr_bullish & engulf


def bear_engulf(df):
    """Bearish candle engulfs prior bullish candle."""
    prev_bullish = df["close"].shift() > df["open"].shift()
    curr_bearish = df["close"] < df["open"]
    engulf = (df["open"] > df["close"].shift()) & (df["close"] < df["open"].shift())
    return prev_bullish & curr_bearish & engulf


def bull_harami(df):
    """Small bullish body inside prior large bearish body."""
    prev_bearish = df["close"].shift() < df["open"].shift()
    prev_large = df["body"].shift() > df["body"].shift().rolling(20).mean()
    curr_bullish = df["close"] > df["open"]
    inside = (df["open"] > df["close"].shift()) & (df["close"] < df["open"].shift())
    return prev_bearish & prev_large & curr_bullish & inside


def bear_harami(df):
    """Small bearish body inside prior large bullish body."""
    prev_bullish = df["close"].shift() > df["open"].shift()
    prev_large = df["body"].shift() > df["body"].shift().rolling(20).mean()
    curr_bearish = df["close"] < df["open"]
    inside = (df["open"] < df["close"].shift()) & (df["close"] > df["open"].shift())
    return prev_bullish & prev_large & curr_bearish & inside


def bull_harami_cross(df):
    """Bull harami where the inner candle is a doji."""
    return bull_harami(df) & doji(df)


def bear_harami_cross(df):
    """Bear harami where the inner candle is a doji."""
    return bear_harami(df) & doji(df)


def three_soldiers(df):
    """Three consecutive bullish candles, each closing higher, with small upper shadows."""
    bull3 = df["bullish"] & df["bullish"].shift() & df["bullish"].shift(2)
    higher_close = (df["close"] > df["close"].shift()) & (df["close"].shift() > df["close"].shift(2))
    open_within = (df["open"] > df["open"].shift()) & (df["open"] < df["close"].shift())
    open_within_2 = (df["open"].shift() > df["open"].shift(2)) & (df["open"].shift() < df["close"].shift(2))
    small_shadow = df["upper_shadow"] < df["body"] * 0.5
    return bull3 & higher_close & open_within & open_within_2 & small_shadow


def three_crows(df):
    """Three consecutive bearish candles, each closing lower."""
    bear3 = (~df["bullish"]) & (~df["bullish"].shift()) & (~df["bullish"].shift(2))
    lower_close = (df["close"] < df["close"].shift()) & (df["close"].shift() < df["close"].shift(2))
    open_within = (df["open"] < df["open"].shift()) & (df["open"] > df["close"].shift())
    open_within_2 = (df["open"].shift() < df["open"].shift(2)) & (df["open"].shift() > df["close"].shift(2))
    return bear3 & lower_close & open_within & open_within_2


PATTERNS = {
    "doji": doji,
    "hanging-man": hanging_man,
    "inverted-hammer": inverted_hammer,
    "shooting-star": shooting_star,
    "bull-engulf": bull_engulf,
    "bear-engulf": bear_engulf,
    "bull-harami": bull_harami,
    "bear-harami": bear_harami,
    "bull-harami-cross": bull_harami_cross,
    "bear-harami-cross": bear_harami_cross,
    "three-soldiers": three_soldiers,
    "three-crows": three_crows,
}


def scan(df):
    """Run all patterns and return which ones matched at the latest bar."""
    matches = []
    for name, fn in PATTERNS.items():
        s = fn(df)
        if bool(s.iloc[-1]):
            matches.append(name)
    return matches


def main():
    p = argparse.ArgumentParser()
    p.add_argument("pattern")
    p.add_argument("--kline", required=True)
    p.add_argument("--list", action="store_true")
    p.add_argument("--limit", type=int, default=10)
    args = p.parse_args()

    df = _df(json.load(open(args.kline)))

    if args.pattern == "scan":
        out = {"ts": int(df["id"].iloc[-1]), "patterns": scan(df)}
        print(json.dumps(out, indent=2)); return

    fn = PATTERNS.get(args.pattern)
    if fn is None:
        print(json.dumps({"error": f"Unknown: {args.pattern}", "available": sorted(PATTERNS.keys())}))
        sys.exit(1)

    s = fn(df)
    if args.list:
        rows = []
        n = min(args.limit, len(df))
        for i in range(len(df) - n, len(df)):
            rows.append({"ts": int(df["id"].iloc[i]), "match": bool(s.iloc[i])})
        print(json.dumps(rows, indent=2))
    else:
        print(json.dumps({"ts": int(df["id"].iloc[-1]), "match": bool(s.iloc[-1])}, indent=2))


if __name__ == "__main__":
    main()
