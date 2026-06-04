---
name: htx-futures-market
version: 1.0.0
description: Query HTX USDT-M perpetual futures market data — contract info, funding rates, OI, klines, depth, liquidations, sentiment. Mostly public; 6 endpoints require read-permission API key.
auth_required: partial
risk_level: none
---

# HTX USDT-M Futures Market

USDT-margined perpetual futures market data. Mostly public — a handful of reference endpoints require a read-permission API key. Agent may call all of these freely without user confirmation.

## When to use this skill

- "BTC perpetual funding rate?"
- "ETH futures OI?"
- "Long/short ratio from top traders"
- "BTC-USDT 4h kline on futures"
- "How much liquidation volume today?"
- "What are the tier margin requirements for BTC-USDT?"

## Underlying tool

Drives `htx-cli`. Binary on `$PATH` or `$HTX_CLI_BIN`. Always `--json`.

For the 6 authenticated reference endpoints, configure credentials once (read permission is enough):

```bash
htx-cli config set-key    <AccessKeyId>
htx-cli config set-secret <SecretKey>
```

## Endpoint catalog (36)

### Contract & system info — public (14)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | `/linear-swap-api/v1/swap_contract_info` | `htx-cli futures market contract-info [--contract-code <code>] --json` | Contract metadata |
| 2 | GET | `/linear-swap-api/v1/swap_index` | `htx-cli futures call GET /linear-swap-api/v1/swap_index --json` | Index price |
| 3 | GET | `/linear-swap-api/v1/swap_price_limit` | `htx-cli futures call GET /linear-swap-api/v1/swap_price_limit --json` | Price limit (circuit) |
| 4 | GET | `/linear-swap-api/v1/swap_open_interest` | `htx-cli futures call GET /linear-swap-api/v1/swap_open_interest --json` | Open interest (OI) |
| 5 | GET | `/linear-swap-api/v1/swap_query_elements` | `htx-cli futures call GET /linear-swap-api/v1/swap_query_elements --json` | Contract elements |
| 6 | GET | `/linear-swap-api/v1/swap_estimated_settlement_price` | `htx-cli futures call GET /linear-swap-api/v1/swap_estimated_settlement_price --json` | Estimated settlement price |
| 7 | GET | `/linear-swap-api/v1/swap_system_status` | `htx-cli futures market system-status --json` | System status (isolated) |
| 8 | GET | `/v1/insurance_fund_info` | `htx-cli futures call GET /v1/insurance_fund_info --json` | Insurance fund balance |
| 9 | GET | `/v1/insurance_fund_history` | `htx-cli futures call GET /v1/insurance_fund_history --json` | Insurance fund history |
| 10 | GET | `/linear-swap-api/v1/swap_timestamp` | `htx-cli futures call GET /linear-swap-api/v1/swap_timestamp --json` | Server timestamp |
| 11 | GET | `/heartbeat/` | `htx-cli futures call GET /heartbeat/ --json` | Heartbeat |
| 12 | GET | `/linear-swap-ex/market/swap_contract_constituents` | `htx-cli futures call GET /linear-swap-ex/market/swap_contract_constituents --json` | Index constituents |
| 13 | GET | `/linear-swap-api/v1/swap_liquidation_orders` | `htx-cli futures market liquidation-orders --contract-code <code> --json` | Liquidation orders |
| 14 | GET | `/linear-swap-api/v1/swap_settlement_records` | `htx-cli futures call GET /linear-swap-api/v1/swap_settlement_records --json` | Settlement history |

### Funding rate & sentiment — public (5)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | `/linear-swap-api/v1/swap_funding_rate` | `htx-cli futures market funding-rate <contract-code> --json` | Current funding rate |
| 2 | GET | `/linear-swap-api/v1/swap_batch_funding_rate` | `htx-cli futures call GET /linear-swap-api/v1/swap_batch_funding_rate --json` | Batch funding rates |
| 3 | GET | `/linear-swap-api/v1/swap_historical_funding_rate` | `htx-cli futures market historical-funding-rate --contract-code <code> --json` | Historical funding rate |
| 4 | GET | `/linear-swap-api/v1/swap_elite_account_ratio` | `htx-cli futures call GET /linear-swap-api/v1/swap_elite_account_ratio --json` | Top-account long/short ratio |
| 5 | GET | `/linear-swap-api/v1/swap_elite_position_ratio` | `htx-cli futures call GET /linear-swap-api/v1/swap_elite_position_ratio --json` | Top-position long/short ratio |

### Market data — public (11)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | `/linear-swap-ex/market/depth` | `htx-cli futures call GET /linear-swap-ex/market/depth --json` | Order book depth |
| 2 | GET | `/linear-swap-ex/market/bbo` | `htx-cli futures call GET /linear-swap-ex/market/bbo --json` | Best bid / offer |
| 3 | GET | `/linear-swap-ex/market/history/kline` | `htx-cli futures call GET /linear-swap-ex/market/history/kline --json` | K-line |
| 4 | GET | `/linear-swap-ex/market/history/mark_price_kline` | `htx-cli futures call GET /linear-swap-ex/market/history/mark_price_kline --json` | Mark-price kline |
| 5 | GET | `/linear-swap-ex/market/detail/merged` | `htx-cli futures call GET /linear-swap-ex/market/detail/merged --json` | Single-contract overview |
| 6 | GET | `/linear-swap-ex/market/detail/batch_merged` | `htx-cli futures market tickers --json` | All-contracts overview |
| 7 | GET | `/linear-swap-ex/market/trade` | `htx-cli futures call GET /linear-swap-ex/market/trade --json` | Latest trade |
| 8 | GET | `/linear-swap-ex/market/history/trade` | `htx-cli futures call GET /linear-swap-ex/market/history/trade --json` | Recent trades |
| 9 | GET | `/linear-swap-ex/market/his_open_interest` | `htx-cli futures call GET /linear-swap-ex/market/his_open_interest --json` | Historical OI |
| 10 | GET | `/linear-swap-ex/market/history/premium_index_kline` | `htx-cli futures call GET /linear-swap-ex/market/history/premium_index_kline --json` | Premium index kline |
| 11 | GET | `/linear-swap-ex/market/history/estimated_rate_kline` | `htx-cli futures call GET /linear-swap-ex/market/history/estimated_rate_kline --json` | Estimated funding rate kline |

### Reference data — requires read permission (6)

| # | Method | Endpoint | CLI invocation | Description |
|---|--------|----------|----------------|-------------|
| 1 | GET | `/linear-swap-api/v3/swap_unified_account_type` | `htx-cli futures account unified-type --json` | Unified account type |
| 2 | POST | `/linear-swap-api/v1/swap_cross_tiered_margin_info` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_tiered_margin_info --json` | Cross tier margin |
| 3 | POST | `/linear-swap-api/v1/swap_tiered_margin_info` | `htx-cli futures call POST /linear-swap-api/v1/swap_tiered_margin_info --json` | Isolated tier margin |
| 4 | POST | `/linear-swap-api/v1/swap_adjustment_factor` | `htx-cli futures call POST /linear-swap-api/v1/swap_adjustment_factor --json` | Isolated adjustment factor |
| 5 | POST | `/linear-swap-api/v1/swap_cross_adjustment_factor` | `htx-cli futures call POST /linear-swap-api/v1/swap_cross_adjustment_factor --json` | Cross adjustment factor |
| 6 | POST | `/linear-swap-api/v3/swap_switch_account_type` | `htx-cli futures call POST /linear-swap-api/v3/swap_switch_account_type --body '{"account_type":1}' --json` | Switch account type (**write**, keep in market skill per plan) |

Endpoint #6 is a write but the HTX plan groups it with reference-data configuration. Agent should still display the target account type to the user before calling it.

## Contract code format

USDT-M perpetual codes are `<BASE>-USDT`:

```
BTC-USDT, ETH-USDT, SOL-USDT, ...
```

Not all endpoints accept a `contract_code` filter — some return the whole universe.

## Typical queries

- "BTC funding rate?" → `htx-cli futures market funding-rate BTC-USDT --json`
- "ETH 1-hour futures klines" → `htx-cli futures call GET /linear-swap-ex/market/history/kline --query contract_code=ETH-USDT&period=60min&size=200 --json`
- "Total liquidations today for BTC" → `htx-cli futures market liquidation-orders --contract-code BTC-USDT --json`
- "Top traders long/short ratio" → `htx-cli futures call GET /linear-swap-api/v1/swap_elite_position_ratio --query contract_code=BTC-USDT --json`

## References

- `references/contract-info.md` — contract code & tier margin quick reference
- `references/funding-rate.md` — funding mechanics
