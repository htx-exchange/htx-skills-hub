---
name: htx-settlement
version: 1.0.0
description: Settlement and insurance fund data for HTX USDT-M perpetuals — estimated next-settlement price, historical settlement records, and insurance fund balance/history. Public, no API key.
auth_required: false
risk_level: none
---

# HTX Settlement & Insurance Fund

Reference data for HTX USDT-M perpetual **settlements** (the periodic mark-to-market events that net unrealized PnL into wallets) and the **insurance fund** (the contract platform's reserve for socialized loss prevention).

## When to use this skill

Load this skill when the user asks about:

- "When is the next settlement on BTC perpetual?"
- "Estimated settlement price right now"
- "Historical settlement records for ETH"
- "How big is HTX's insurance fund?"
- "Insurance fund balance trend"
- "Has the insurance fund been paid out recently?"

## Underlying tool

Drives `htx-cli`. Binary on `$PATH` or `$HTX_CLI_BIN`. Always pass `--json`.

## Endpoint catalog (4)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | `/linear-swap-api/v1/swap_estimated_settlement_price` | `htx-cli futures call GET /linear-swap-api/v1/swap_estimated_settlement_price [--query contract_code=<code>] --json` | Estimated price for the next settlement |
| 2 | GET | `/linear-swap-api/v1/swap_settlement_records` | `htx-cli futures call GET /linear-swap-api/v1/swap_settlement_records --query contract_code=<code>&start_time=<ms>&end_time=<ms> --json` | Historical settlement records (per-contract) |
| 3 | GET | `/v1/insurance_fund_info` | `htx-cli futures call GET /v1/insurance_fund_info --json` | Current insurance fund balance per asset |
| 4 | GET | `/v1/insurance_fund_history` | `htx-cli futures call GET /v1/insurance_fund_history --json` | Historical insurance fund balance time series |

## Concept reference

| Term | Meaning |
|------|---------|
| **Settlement** | Periodic netting event where unrealized PnL becomes realized. HTX USDT-M settles **continuously** via mark price PnL — the "settlement records" endpoint refers to delivery-style settlements for any quarterly contracts. |
| **Estimated settlement price** | Forward-looking price that would clear positions if settlement happened now. Useful for risk monitoring of margin levels. |
| **Insurance fund** | Reserve pool funded by liquidation surplus. When a liquidated position can't be auctioned at the bankruptcy price, the fund covers the gap. Drawdowns indicate platform stress. |

## Contract code format

USDT-M perpetual codes follow `<BASE>-USDT` (e.g. `BTC-USDT`).

## Typical queries → CLI

| User question | CLI command |
|---------------|-------------|
| "BTC estimated settlement price" | `htx-cli futures call GET /linear-swap-api/v1/swap_estimated_settlement_price --query contract_code=BTC-USDT --json` |
| "ETH settlement records last 30d" | `htx-cli futures call GET /linear-swap-api/v1/swap_settlement_records --query contract_code=ETH-USDT --json` |
| "HTX insurance fund right now" | `htx-cli futures call GET /v1/insurance_fund_info --json` |
| "Insurance fund last 90 days" | `htx-cli futures call GET /v1/insurance_fund_history --json` |

## Output guidance

For insurance fund queries:
- Show balance per asset (USDT main; ETH/BTC for COIN-M if relevant)
- Show 30d / 90d change
- Flag if fund has **decreased > 10%** in 7d (stress signal)

For settlement queries:
- Show next settlement time (UTC + local)
- Show estimated price + delta from current mark
- For historical records: aggregate by contract, count of settlements

## Related skills

- `@htx-skills/funding-rate` — settlements happen alongside funding events
- `@htx-skills/liquidation-stream` — liquidations feed the insurance fund
- `@htx-skills/derivatives-analyst` — *(planned Layer 2)* multi-signal pressure scoring
