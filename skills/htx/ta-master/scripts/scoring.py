"""ta-master — three-pillar weighted scoring (0-100 composite).

Pillars:
  1. Price & Volume (50% weight): RSI / MACD / trend / divergence / patterns
  2. Derivatives (30% weight): funding rate / OI delta / liquidation / elite L/S / basis
  3. Macro Cycle (20% weight, BTC only): AHR999 / Mayer / Pi Cycle / Rainbow band

Each pillar produces a 0-100 sub-score, composite = weighted sum.
> 70 = bullish strong  | 30-70 = neutral  | < 30 = bearish strong

Usage:
    python scoring.py --pricevol pv.json --derivatives deriv.json [--cycle cycle.json]

Each input is a JSON file produced by the corresponding L1 skill.
"""
import argparse, json, sys


# ============ Pillar 1: Price & Volume scoring ============
def score_pricevol(data: dict) -> dict:
    """Score 0-100. Higher = bullish.
    Expects: rsi, macd_hist, ema_fast, ema_slow, adx, divergence, patterns_bullish_count, patterns_bearish_count
    """
    score = 50.0  # neutral baseline
    notes = []

    rsi = data.get("rsi")
    if rsi is not None:
        if rsi > 70:    score -= 10; notes.append(f"RSI {rsi:.1f} overbought")
        elif rsi > 55:  score += 5;  notes.append(f"RSI {rsi:.1f} bullish")
        elif rsi < 30:  score += 10; notes.append(f"RSI {rsi:.1f} oversold")
        elif rsi < 45:  score -= 5;  notes.append(f"RSI {rsi:.1f} bearish")

    macd_hist = data.get("macd_hist")
    if macd_hist is not None:
        if macd_hist > 0: score += 7;  notes.append("MACD hist > 0")
        else:             score -= 7;  notes.append("MACD hist < 0")

    fast, slow = data.get("ema_fast"), data.get("ema_slow")
    if fast and slow:
        if fast > slow: score += 8;  notes.append("EMA fast > slow (uptrend)")
        else:           score -= 8;  notes.append("EMA fast < slow (downtrend)")

    adx = data.get("adx")
    if adx is not None and adx > 25:
        notes.append(f"ADX {adx:.1f} strong trend (amplifies signal)")
        # ADX is a strength multiplier, not direction — already captured by EMA

    div = data.get("divergence")
    if div == "bull_reg":  score += 12; notes.append("Bullish regular divergence")
    elif div == "bear_reg": score -= 12; notes.append("Bearish regular divergence")
    elif div == "bull_hid": score += 6;  notes.append("Bullish hidden divergence")
    elif div == "bear_hid": score -= 6;  notes.append("Bearish hidden divergence")

    bull_p = data.get("patterns_bullish_count", 0)
    bear_p = data.get("patterns_bearish_count", 0)
    score += 4 * bull_p
    score -= 4 * bear_p
    if bull_p: notes.append(f"{bull_p} bullish pattern(s)")
    if bear_p: notes.append(f"{bear_p} bearish pattern(s)")

    score = max(0, min(100, score))
    return {"score": round(score, 1), "notes": notes}


# ============ Pillar 2: Derivatives scoring ============
def score_derivatives(data: dict) -> dict:
    score = 50.0
    notes = []

    funding = data.get("funding_rate")
    if funding is not None:
        if funding > 0.0005:    score -= 12; notes.append(f"Funding {funding*100:.3f}% — longs overpaying")
        elif funding > 0.0002:  score -= 5;  notes.append(f"Funding {funding*100:.3f}% — bullish bias")
        elif funding < -0.0005: score += 12; notes.append(f"Funding {funding*100:.3f}% — shorts overpaying")
        elif funding < -0.0002: score += 5;  notes.append(f"Funding {funding*100:.3f}% — bearish bias")

    oi_delta_24h = data.get("oi_delta_pct_24h")
    if oi_delta_24h is not None:
        if oi_delta_24h > 15:  score -= 8;  notes.append(f"OI surged +{oi_delta_24h:.1f}% — squeeze risk")
        elif oi_delta_24h > 5: score += 4;  notes.append(f"OI rising +{oi_delta_24h:.1f}%")
        elif oi_delta_24h < -10: score -= 6; notes.append(f"OI dropped {oi_delta_24h:.1f}% — capitulation/exit")

    elite_ls = data.get("elite_long_short_ratio")
    if elite_ls is not None:
        if elite_ls > 1.5:    score += 10; notes.append(f"Elite L/S {elite_ls:.2f} — smart money long")
        elif elite_ls > 1.1:  score += 4;  notes.append(f"Elite L/S {elite_ls:.2f} — leaning long")
        elif elite_ls < 0.7:  score -= 10; notes.append(f"Elite L/S {elite_ls:.2f} — smart money short")
        elif elite_ls < 0.9:  score -= 4;  notes.append(f"Elite L/S {elite_ls:.2f} — leaning short")

    liq_long_1h = data.get("liq_long_usd_1h", 0)
    liq_short_1h = data.get("liq_short_usd_1h", 0)
    if liq_long_1h + liq_short_1h > 0:
        ratio = liq_long_1h / (liq_long_1h + liq_short_1h)
        if ratio > 0.8:    score += 8;  notes.append(f"Long liq {ratio*100:.0f}% — bottom signal")
        elif ratio < 0.2:  score -= 8;  notes.append(f"Short liq {(1-ratio)*100:.0f}% — top signal")

    basis = data.get("basis_pct")
    if basis is not None:
        if abs(basis) > 1.0:  notes.append(f"Basis {basis:+.2f}% — extreme")
        if basis > 0.5:       score -= 4; notes.append("Premium too high")
        elif basis < -0.5:    score += 4; notes.append("Discount — accumulation hint")

    score = max(0, min(100, score))
    return {"score": round(score, 1), "notes": notes}


# ============ Pillar 3: Macro Cycle (BTC only) ============
def score_cycle(data: dict) -> dict:
    score = 50.0
    notes = []

    ahr = data.get("ahr999")
    if ahr is not None:
        if ahr < 0.45:    score += 20; notes.append(f"AHR999 {ahr:.3f} — accumulate zone")
        elif ahr < 1.2:   score += 5;  notes.append(f"AHR999 {ahr:.3f} — DCA zone")
        elif ahr < 1.6:   score -= 10; notes.append(f"AHR999 {ahr:.3f} — elevated")
        else:             score -= 20; notes.append(f"AHR999 {ahr:.3f} — bubble warning")

    mayer = data.get("mayer")
    if mayer is not None:
        if mayer < 1.0:    score += 8;  notes.append(f"Mayer {mayer:.2f} — undervalued")
        elif mayer < 1.5:  pass
        elif mayer < 2.0:  score -= 5;  notes.append(f"Mayer {mayer:.2f} — elevated")
        else:              score -= 12; notes.append(f"Mayer {mayer:.2f} — overheated")

    pi_signal = data.get("pi_cycle_signal")
    if pi_signal == "TOP_SIGNAL":  score -= 25; notes.append("Pi Cycle TOP signal triggered ⚠️")
    elif pi_signal == "near_top":  score -= 8;  notes.append("Pi Cycle near top")

    band = data.get("rainbow_band")
    if band:
        bull_bands = ("Fire Sale", "BUY!", "Accumulate")
        bear_bands = ("FOMO Intensifies", "Sell. Seriously.", "Maximum Bubble")
        if band in bull_bands:    score += 10; notes.append(f"Rainbow: {band}")
        elif band in bear_bands:  score -= 10; notes.append(f"Rainbow: {band}")

    score = max(0, min(100, score))
    return {"score": round(score, 1), "notes": notes}


# ============ Composite ============
def compose(pv_score, deriv_score, cycle_score=None, weights=None):
    if cycle_score is None:
        # Without cycle, redistribute its 20% to 50/50 split between pv and deriv
        weights = weights or {"pv": 0.625, "deriv": 0.375}
        composite = pv_score * weights["pv"] + deriv_score * weights["deriv"]
    else:
        weights = weights or {"pv": 0.5, "deriv": 0.3, "cycle": 0.2}
        composite = (pv_score * weights["pv"]
                     + deriv_score * weights["deriv"]
                     + cycle_score * weights["cycle"])
    if composite >= 70:    label = "STRONG BULLISH"
    elif composite >= 55:  label = "MILD BULLISH"
    elif composite > 45:   label = "NEUTRAL"
    elif composite > 30:   label = "MILD BEARISH"
    else:                  label = "STRONG BEARISH"
    return {"composite": round(composite, 1), "label": label, "weights": weights}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--pricevol", required=True, help="JSON file with price-volume features")
    p.add_argument("--derivatives", required=True, help="JSON file with derivatives features")
    p.add_argument("--cycle", help="JSON file with cycle features (BTC only, optional)")
    args = p.parse_args()

    pv = json.load(open(args.pricevol))
    deriv = json.load(open(args.derivatives))
    cycle = json.load(open(args.cycle)) if args.cycle else None

    pv_res = score_pricevol(pv)
    deriv_res = score_derivatives(deriv)
    cycle_res = score_cycle(cycle) if cycle else None

    composite = compose(
        pv_res["score"],
        deriv_res["score"],
        cycle_res["score"] if cycle_res else None,
    )

    out = {
        "composite": composite,
        "pillars": {
            "price_volume": pv_res,
            "derivatives": deriv_res,
        },
    }
    if cycle_res:
        out["pillars"]["cycle"] = cycle_res

    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
