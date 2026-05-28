# HTX AI Skills

> HTX's open trading protocol for the AI Agent ecosystem — install with a single command and let your AI Agent query markets, manage assets, and execute spot and futures trades through natural language.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-16-blue.svg)](htx-cli/skills/htx)
[![Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://htx-skills-hub.vercel.app)

## Overview

HTX AI Skills is HTX's open marketplace of AI trading Skills. Developers can browse and install modular Skills to extend their AI trading assistant's capabilities, covering market data queries, trade execution, derivatives analysis, risk monitoring, and more.

- One-line installation into any AI Agent
- Runs locally — your API Key never leaves your machine
- Mandatory manual confirmation for all write operations
- MIT-licensed, fully auditable and customizable

## Skills Catalog

### Spot
- [`spot-market`](htx-cli/skills/htx/spot-market) — Spot market data
- [`spot-account`](htx-cli/skills/htx/spot-account) — Spot account
- [`spot-trading`](htx-cli/skills/htx/spot-trading) — Spot trading

### Futures
- [`futures-market`](htx-cli/skills/htx/futures-market) — Futures market data
- [`funding-rate`](htx-cli/skills/htx/funding-rate) — Funding Rate
- [`oi-tracker`](htx-cli/skills/htx/oi-tracker) — Open Interest tracking
- [`elite-positioning`](htx-cli/skills/htx/elite-positioning) — Elite Long/Short Ratio
- [`liquidation-stream`](htx-cli/skills/htx/liquidation-stream) — Liquidation stream
- [`mark-price`](htx-cli/skills/htx/mark-price) — Mark Price / Premium / Basis
- [`settlement`](htx-cli/skills/htx/settlement) — Settlement and Insurance Fund
- [`futures-account`](htx-cli/skills/htx/futures-account) — Futures account
- [`futures-trading`](htx-cli/skills/htx/futures-trading) — Futures trading

### Analysis
- [`technical-analysis`](htx-cli/skills/htx/technical-analysis) — Technical indicator analysis
- [`derivatives-analyst`](htx-cli/skills/htx/derivatives-analyst) — Derivatives pressure analysis
- [`sentiment-analyst`](htx-cli/skills/htx/sentiment-analyst) — Market sentiment
- [`market-overview`](htx-cli/skills/htx/market-overview) — Market overview

## Quick Start

```bash
npx skills add https://github.com/htx-exchange/htx-skills-hub/skills
```

After installation, ask your AI Agent in plain natural language:

> "What's the current price of BTC?"
> "Show me the 4H candlestick chart for ETH/USDT"
> "Scan funding rates across the whole market"

## Development



```bash
git clone https://github.com/htx-exchange/htx-skills-hub.git
cd htx-skills-hub/website
python3 -m http.server 8000
# Open http://localhost:8000
```

## License

MIT — see [LICENSE](LICENSE).
