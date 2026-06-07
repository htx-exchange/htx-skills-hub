"""HTX Skill Hub — technical indicators (pure Python, numpy/pandas only).

50+ indicators across 7 categories. CLI:
    python indicators.py <name> --kline kline.json [--params 14] [--list]
"""
import argparse, json, math, sys
import numpy as np, pandas as pd


def _df(kline):
    df = pd.DataFrame(kline).sort_values("id").reset_index(drop=True)
    for c in ("open", "high", "low", "close", "vol", "amount"):
        if c in df: df[c] = df[c].astype(float)
    return df


def _last(d):
    out = {}
    for k, v in d.items():
        val = v.iloc[-1] if hasattr(v, "iloc") else v
        if isinstance(val, (np.floating, np.integer)): val = float(val)
        out[k] = None if (isinstance(val, float) and math.isnan(val)) else val
    return out


def _series(d, ts, limit=10):
    rows = []
    n = min(limit, len(ts))
    for i in range(len(ts) - n, len(ts)):
        row = {"ts": int(ts.iloc[i])}
        for k, v in d.items():
            val = v.iloc[i] if hasattr(v, "iloc") else v
            if isinstance(val, (np.floating, np.integer)): val = float(val)
            row[k] = None if (isinstance(val, float) and math.isnan(val)) else val
        rows.append(row)
    return rows


# ============ Moving averages (8) ============
def ma(df, periods=(5, 20, 60)):
    return {f"ma{p}": df["close"].rolling(p).mean() for p in periods}

def ema(df, periods=(5, 20)):
    return {f"ema{p}": df["close"].ewm(span=p, adjust=False).mean() for p in periods}

def wma(df, period=20):
    w = np.arange(1, period + 1)
    return {"wma": df["close"].rolling(period).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)}

def dema(df, period=20):
    e1 = df["close"].ewm(span=period, adjust=False).mean()
    return {"dema": 2 * e1 - e1.ewm(span=period, adjust=False).mean()}

def tema(df, period=20):
    e1 = df["close"].ewm(span=period, adjust=False).mean()
    e2 = e1.ewm(span=period, adjust=False).mean()
    e3 = e2.ewm(span=period, adjust=False).mean()
    return {"tema": 3 * e1 - 3 * e2 + e3}

def hma(df, period=20):
    half, sp = period // 2, int(np.sqrt(period))
    def _wma(s, n):
        w = np.arange(1, n + 1)
        return s.rolling(n).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)
    diff = 2 * _wma(df["close"], half) - _wma(df["close"], period)
    return {"hma": _wma(diff, sp)}

def kama(df, period=10, fast=2, slow=30):
    chg = (df["close"] - df["close"].shift(period)).abs()
    vol = df["close"].diff().abs().rolling(period).sum()
    er = chg / vol
    sc = (er * (2/(fast+1) - 2/(slow+1)) + 2/(slow+1)) ** 2
    out = df["close"].copy()
    for i in range(period, len(df)):
        if pd.isna(out.iloc[i-1]): out.iloc[i] = df["close"].iloc[i]
        else: out.iloc[i] = out.iloc[i-1] + sc.iloc[i] * (df["close"].iloc[i] - out.iloc[i-1])
    return {"kama": out}

def zlema(df, period=20):
    lag = (period - 1) // 2
    return {"zlema": (2*df["close"] - df["close"].shift(lag)).ewm(span=period, adjust=False).mean()}


# ============ Trend (8) ============
def macd(df, fast=12, slow=26, signal=9):
    ef = df["close"].ewm(span=fast, adjust=False).mean()
    es = df["close"].ewm(span=slow, adjust=False).mean()
    dif = ef - es
    dea = dif.ewm(span=signal, adjust=False).mean()
    return {"dif": dif, "dea": dea, "macd": (dif - dea) * 2}

def adx(df, period=14):
    h, l, c = df["high"], df["low"], df["close"]
    pdm, mdm = h.diff(), -l.diff()
    pdm = pdm.where((pdm > mdm) & (pdm > 0), 0)
    mdm = mdm.where((mdm > pdm.where(pdm == 0, 0)) & (mdm > 0), 0)
    tr = pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    atr_ = tr.ewm(span=period, adjust=False).mean()
    pdi = 100 * pdm.ewm(span=period, adjust=False).mean() / atr_
    mdi = 100 * mdm.ewm(span=period, adjust=False).mean() / atr_
    dx = 100 * (pdi - mdi).abs() / (pdi + mdi)
    return {"adx": dx.ewm(span=period, adjust=False).mean(), "plus_di": pdi, "minus_di": mdi}

def aroon(df, period=14):
    hi = df["high"].rolling(period+1).apply(lambda x: x.argmax(), raw=True)
    lo = df["low"].rolling(period+1).apply(lambda x: x.argmin(), raw=True)
    up, dn = 100*hi/period, 100*lo/period
    return {"aroon_up": up, "aroon_down": dn, "aroon_osc": up - dn}

def cci(df, period=20):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    sma = tp.rolling(period).mean()
    mad = tp.rolling(period).apply(lambda x: np.fabs(x - x.mean()).mean(), raw=True)
    return {"cci": (tp - sma) / (0.015 * mad)}

def supertrend(df, period=10, multiplier=3.0):
    h, l, c = df["high"], df["low"], df["close"]
    hl2 = (h + l) / 2
    tr = pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    atr_ = tr.ewm(span=period, adjust=False).mean()
    up, dn = hl2 + multiplier*atr_, hl2 - multiplier*atr_
    st = c.copy()
    direction = pd.Series([1]*len(df), index=df.index)
    for i in range(1, len(df)):
        if c.iloc[i] > up.iloc[i-1]: direction.iloc[i] = 1
        elif c.iloc[i] < dn.iloc[i-1]: direction.iloc[i] = -1
        else: direction.iloc[i] = direction.iloc[i-1]
        st.iloc[i] = dn.iloc[i] if direction.iloc[i] == 1 else up.iloc[i]
    return {"supertrend": st, "direction": direction.map({1: "buy", -1: "sell"})}

def sar(df, af_step=0.02, af_max=0.2):
    h, l = df["high"], df["low"]
    sar_ = pd.Series(np.nan, index=df.index)
    trend, af, ep = 1, af_step, h.iloc[0]
    sar_.iloc[0] = l.iloc[0]
    for i in range(1, len(df)):
        sar_.iloc[i] = sar_.iloc[i-1] + af * (ep - sar_.iloc[i-1])
        if trend == 1:
            if l.iloc[i] < sar_.iloc[i]:
                trend, sar_.iloc[i], ep, af = -1, ep, l.iloc[i], af_step
            elif h.iloc[i] > ep: ep, af = h.iloc[i], min(af + af_step, af_max)
        else:
            if h.iloc[i] > sar_.iloc[i]:
                trend, sar_.iloc[i], ep, af = 1, ep, h.iloc[i], af_step
            elif l.iloc[i] < ep: ep, af = l.iloc[i], min(af + af_step, af_max)
    return {"sar": sar_}

def dpo(df, period=20):
    return {"dpo": df["close"] - df["close"].rolling(period).mean().shift((period//2) + 1)}

def envelope(df, period=20, dev=0.1):
    sma = df["close"].rolling(period).mean()
    return {"upper": sma * (1+dev), "middle": sma, "lower": sma * (1-dev)}


# ============ Momentum (10) ============
def rsi(df, period=14):
    d = df["close"].diff()
    g = d.where(d > 0, 0).ewm(span=period, adjust=False).mean()
    l = (-d.where(d < 0, 0)).ewm(span=period, adjust=False).mean()
    return {"rsi": 100 - 100 / (1 + g / l)}

def stoch_rsi(df, period=14, k_period=3, d_period=3):
    r = rsi(df, period)["rsi"]
    rmin, rmax = r.rolling(period).min(), r.rolling(period).max()
    fk = 100 * (r - rmin) / (rmax - rmin)
    k = fk.rolling(k_period).mean()
    return {"k": k, "d": k.rolling(d_period).mean()}

def stoch(df, k_period=14, d_period=3, smooth=3):
    lo, hi = df["low"].rolling(k_period).min(), df["high"].rolling(k_period).max()
    fk = 100 * (df["close"] - lo) / (hi - lo)
    k = fk.rolling(smooth).mean()
    return {"k": k, "d": k.rolling(d_period).mean()}

def kdj(df, period=9, signal_k=3, signal_d=3):
    lo, hi = df["low"].rolling(period).min(), df["high"].rolling(period).max()
    rsv = 100 * (df["close"] - lo) / (hi - lo)
    k = rsv.ewm(com=signal_k - 1, adjust=False).mean()
    d = k.ewm(com=signal_d - 1, adjust=False).mean()
    return {"k": k, "d": d, "j": 3*k - 2*d}

def roc(df, period=12):
    return {"roc": 100 * (df["close"] - df["close"].shift(period)) / df["close"].shift(period)}

def mom(df, period=10):
    return {"mom": df["close"] - df["close"].shift(period)}

def ppo(df, fast=12, slow=26, signal=9):
    ef = df["close"].ewm(span=fast, adjust=False).mean()
    es = df["close"].ewm(span=slow, adjust=False).mean()
    line = 100 * (ef - es) / es
    sig = line.ewm(span=signal, adjust=False).mean()
    return {"ppo": line, "signal": sig, "hist": line - sig}

def trix(df, period=15):
    e1 = df["close"].ewm(span=period, adjust=False).mean()
    e2 = e1.ewm(span=period, adjust=False).mean()
    e3 = e2.ewm(span=period, adjust=False).mean()
    return {"trix": 100 * e3.diff() / e3}

def wr(df, period=14):
    hi, lo = df["high"].rolling(period).max(), df["low"].rolling(period).min()
    return {"wr": -100 * (hi - df["close"]) / (hi - lo)}

def uo(df, p1=7, p2=14, p3=28):
    bp = df["close"] - pd.concat([df["low"], df["close"].shift()], axis=1).min(axis=1)
    tr_ = pd.concat([df["high"]-df["low"], (df["high"]-df["close"].shift()).abs(),
                     (df["low"]-df["close"].shift()).abs()], axis=1).max(axis=1)
    a1 = bp.rolling(p1).sum() / tr_.rolling(p1).sum()
    a2 = bp.rolling(p2).sum() / tr_.rolling(p2).sum()
    a3 = bp.rolling(p3).sum() / tr_.rolling(p3).sum()
    return {"uo": 100 * (4*a1 + 2*a2 + a3) / 7}


# ============ Volatility (8) ============
def bb(df, period=20, dev=2.0):
    m = df["close"].rolling(period).mean()
    s = df["close"].rolling(period).std()
    return {"upper": m + dev*s, "middle": m, "lower": m - dev*s}

def bbwidth(df, period=20, dev=2.0):
    b = bb(df, period, dev)
    return {"bbwidth": (b["upper"] - b["lower"]) / b["middle"]}

def bbpct(df, period=20, dev=2.0):
    b = bb(df, period, dev)
    return {"bbpct": (df["close"] - b["lower"]) / (b["upper"] - b["lower"])}

def atr(df, period=14):
    h, l, c = df["high"], df["low"], df["close"]
    tr_ = pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    return {"atr": tr_.ewm(span=period, adjust=False).mean()}

def keltner(df, period=20, mult=2.0):
    m = df["close"].ewm(span=period, adjust=False).mean()
    a = atr(df, period)["atr"]
    return {"upper": m + mult*a, "middle": m, "lower": m - mult*a}

def donchian(df, period=20):
    hi, lo = df["high"].rolling(period).max(), df["low"].rolling(period).min()
    return {"upper": hi, "lower": lo, "middle": (hi + lo) / 2}

def hv(df, period=20, ann=365):
    lr = np.log(df["close"] / df["close"].shift())
    return {"hv": lr.rolling(period).std() * np.sqrt(ann) * 100}

def stddev(df, period=20):
    return {"stddev": df["close"].rolling(period).std()}


# ============ Volume (6) ============
def obv(df):
    return {"obv": (np.sign(df["close"].diff()).fillna(0) * df["vol"]).cumsum()}

def vwap(df):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    return {"vwap": (tp * df["vol"]).cumsum() / df["vol"].cumsum()}

def mvwap(df, period=20):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    return {"mvwap": (tp * df["vol"]).rolling(period).sum() / df["vol"].rolling(period).sum()}

def cmf(df, period=20):
    mfm = ((df["close"] - df["low"]) - (df["high"] - df["close"])) / (df["high"] - df["low"])
    mfv = mfm * df["vol"]
    return {"cmf": mfv.rolling(period).sum() / df["vol"].rolling(period).sum()}

def mfi(df, period=14):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    mf = tp * df["vol"]
    pos = mf.where(tp > tp.shift(), 0).rolling(period).sum()
    neg = mf.where(tp < tp.shift(), 0).rolling(period).sum()
    return {"mfi": 100 - 100 / (1 + pos / neg)}

def ad(df):
    clv = ((df["close"] - df["low"]) - (df["high"] - df["close"])) / (df["high"] - df["low"])
    return {"ad": (clv.fillna(0) * df["vol"]).cumsum()}


# ============ Statistical (5) ============
def lr(df, period=20):
    def _f(x):
        n = len(x); idx = np.arange(n)
        s, i = np.polyfit(idx, x, 1)
        return i + s * (n - 1)
    return {"lr": df["close"].rolling(period).apply(_f, raw=True)}

def slope(df, period=20):
    return {"slope": df["close"].rolling(period).apply(
        lambda x: np.polyfit(np.arange(len(x)), x, 1)[0], raw=True)}

def angle(df, period=20):
    return {"angle_deg": np.degrees(np.arctan(slope(df, period)["slope"]))}

def variance(df, period=20):
    return {"variance": df["close"].rolling(period).var()}

def sigma(df, period=20):
    m = df["close"].rolling(period).mean()
    s = df["close"].rolling(period).std()
    return {"sigma": (df["close"] - m) / s}


# ============ Other (5) ============
def fisher(df, period=10):
    hi, lo = df["high"].rolling(period).max(), df["low"].rolling(period).min()
    norm = 2 * ((df["close"] - lo) / (hi - lo) - 0.5)
    norm = norm.clip(-0.999, 0.999)
    f = 0.5 * np.log((1 + norm) / (1 - norm))
    return {"fisher": f, "trigger": f.shift()}

def tr(df):
    h, l, c = df["high"], df["low"], df["close"]
    return {"tr": pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)}

def tp(df):
    return {"tp": (df["high"] + df["low"] + df["close"]) / 3}

def mp(df):
    return {"mp": (df["high"] + df["low"]) / 2}

def cho(df, fast=3, slow=10):
    a = ad(df)["ad"]
    return {"cho": a.ewm(span=fast, adjust=False).mean() - a.ewm(span=slow, adjust=False).mean()}


# ============ Divergence detection ============
def divergence(df, indicator="rsi", period=14, lookback=20):
    """Detect bullish/bearish regular & hidden divergences."""
    fn = INDICATORS.get(indicator)
    if fn is None: raise ValueError(f"Unknown: {indicator}")
    ind = list(fn(df, period=period).values())[0]
    out = pd.Series([None]*len(df), index=df.index, dtype=object)

    def _piv(s, kind="low", w=2):
        out_ = []
        for i in range(w, len(s) - w):
            window = s.iloc[i-w:i+w+1]
            if kind == "low" and s.iloc[i] == window.min(): out_.append(i)
            elif kind == "high" and s.iloc[i] == window.max(): out_.append(i)
        return out_

    lows, highs = _piv(df["close"], "low"), _piv(df["close"], "high")

    for j in range(1, len(lows)):
        ip, ic = lows[j-1], lows[j]
        if ic - ip > lookback: continue
        pp, pc = df["close"].iloc[ip], df["close"].iloc[ic]
        np_, nc = ind.iloc[ip], ind.iloc[ic]
        if pd.isna(np_) or pd.isna(nc): continue
        if pc < pp and nc > np_: out.iloc[ic] = "bull_reg"
        elif pc > pp and nc < np_: out.iloc[ic] = "bull_hid"

    for j in range(1, len(highs)):
        ip, ic = highs[j-1], highs[j]
        if ic - ip > lookback: continue
        pp, pc = df["close"].iloc[ip], df["close"].iloc[ic]
        np_, nc = ind.iloc[ip], ind.iloc[ic]
        if pd.isna(np_) or pd.isna(nc): continue
        if pc > pp and nc < np_: out.iloc[ic] = "bear_reg"
        elif pc < pp and nc > np_: out.iloc[ic] = "bear_hid"

    return {"divergence": out}


INDICATORS = {
    "ma": ma, "ema": ema, "wma": wma, "dema": dema, "tema": tema, "hma": hma, "kama": kama, "zlema": zlema,
    "macd": macd, "adx": adx, "aroon": aroon, "cci": cci, "supertrend": supertrend, "sar": sar, "dpo": dpo, "envelope": envelope,
    "rsi": rsi, "stoch-rsi": stoch_rsi, "stoch": stoch, "kdj": kdj, "roc": roc, "mom": mom,
    "ppo": ppo, "trix": trix, "wr": wr, "uo": uo,
    "bb": bb, "boll": bb, "bbwidth": bbwidth, "bbpct": bbpct, "atr": atr,
    "keltner": keltner, "donchian": donchian, "hv": hv, "stddev": stddev,
    "obv": obv, "vwap": vwap, "mvwap": mvwap, "cmf": cmf, "mfi": mfi, "ad": ad,
    "lr": lr, "slope": slope, "angle": angle, "variance": variance, "sigma": sigma,
    "fisher": fisher, "tr": tr, "tp": tp, "mp": mp, "cho": cho,
    "divergence": divergence,
}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("indicator")
    p.add_argument("--kline", required=False)
    p.add_argument("--params", default="")
    p.add_argument("--list", action="store_true")
    p.add_argument("--limit", type=int, default=10)
    args = p.parse_args()

    if args.indicator == "list":
        print(json.dumps(sorted(INDICATORS.keys()), indent=2)); return

    fn = INDICATORS.get(args.indicator)
    if fn is None:
        print(json.dumps({"error": f"Unknown: {args.indicator}",
                          "available": sorted(INDICATORS.keys())})); sys.exit(1)
    if not args.kline:
        print(json.dumps({"error": "--kline required"})); sys.exit(1)

    df = _df(json.load(open(args.kline)))
    kw = {}
    if args.params:
        nums = [int(x) if x.isdigit() else float(x) for x in args.params.split(",")]
        if args.indicator in ("ma", "ema"): kw["periods"] = tuple(nums)
        elif args.indicator in ("macd", "ppo"):
            kw.update({"fast": nums[0], "slow": nums[1], "signal": nums[2]} if len(nums) >= 3 else {})
        elif args.indicator == "supertrend" and len(nums) >= 2:
            kw.update({"period": nums[0], "multiplier": nums[1]})
        elif args.indicator in ("bb", "envelope") and len(nums) >= 2:
            kw.update({"period": nums[0], "dev": nums[1]})
        elif args.indicator == "kdj" and len(nums) >= 3:
            kw.update({"period": nums[0], "signal_k": nums[1], "signal_d": nums[2]})
        else: kw["period"] = nums[0]

    res = fn(df, **kw)
    if args.list:
        print(json.dumps(_series(res, df["id"], args.limit), indent=2))
    else:
        out = _last(res); out["ts"] = int(df["id"].iloc[-1])
        print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
