# HTX Skills

HTX skills for AI coding assistants. Provides spot trading, USDT-M futures trading, market data queries, account management, and order execution on HTX exchange.

## Available Skills

| Skill | Description |
|-------|-------------|
| `htx-spot` | Spot trading including market data, account balance, order placement, conditional orders, and margin trading |
| `htx-usdt-m-futures` | USDT-M perpetual futures trading including positions, leverage management, trigger orders, and TP/SL strategies |

## Features

### Spot Trading (`htx-spot`)
- **Reference Data**: Market status, symbol configuration, currency information, blockchain chains
- **Market Data**: Real-time prices, K-line charts, order book depth, trade history, 24h market overview
- **Account Management**: Account details, balance queries, asset valuation, transfers between accounts
- **Trading**: Place/cancel orders (limit, market, IOC, FOK, stop-limit), batch order operations, order history
- **Conditional Orders**: Stop orders with customizable trigger conditions and trailing rates
- **Margin Trading**: Cross and isolated margin loan management, margin account queries

### USDT-M Futures (`htx-usdt-m-futures`)
- **Reference Data**: Contract info, funding rates, liquidation orders, settlement records, system status
- **Market Data**: Real-time prices, depth, K-line data, mark price, premium index, basis data
- **Account Management**: Asset valuation, position info (isolated/cross), sub-account management, leverage control
- **Trading**: Order placement (isolated/cross margin), batch orders, position mode switching, lightning close
- **Strategy Orders**: Trigger orders, take-profit/stop-loss orders, trailing stop orders
- **Risk Management**: Tiered margin info, adjustment factors, position limits, transfer limits

## Supported Markets

HTX supports a wide range of cryptocurrency trading pairs including:
- **Spot**: BTC, ETH, and hundreds of altcoins paired with USDT, BTC, ETH
- **USDT-M Futures**: BTC-USDT, ETH-USDT, and other major perpetual contracts

## Prerequisites

All skills require HTX API credentials. Create API keys at [HTX API Management](https://www.htx.com/apikey/).

**Required Permissions**:
- Read permission for market data and account queries
- Trade permission for order placement and cancellation
- Transfer permission (if using transfer features)

Recommended: create a `.env` file or use account configuration:

```bash
HTX_API_KEY="your-api-key"
HTX_SECRET_KEY="your-secret-key"
```

**Security warning**: Never commit API credentials to git (add `.env` to `.gitignore`) and never expose credentials in logs, screenshots, or chat messages.

## Installation

### Recommended

```bash
npx skills add https://github.com/htx-exchange/htx-skills-hub/skills
```

Works with Claude Code, Cursor, Codex CLI, and OpenCode. Auto-detects your environment and installs accordingly.

## API Key Security Notice

**Production Usage** For stable and reliable production usage, you must provide your own API credentials by setting the following environment variables:

* `HTX_API_KEY`
* `HTX_SECRET_KEY`

You are solely responsible for the security, confidentiality, and proper management of your own API keys. We shall not be liable for any unauthorized access, asset loss, or damages resulting from improper key management on your part.

**Mainnet Trading Confirmation** When performing transactions on mainnet, the AI assistant will always ask for confirmation before executing orders. This is a safety feature to prevent accidental trades.

**Important Security Practices**:
- Use API keys with minimal required permissions
- Set IP whitelist restrictions when possible
- Never share your secret key
- Regularly rotate API keys
- Monitor account activity

## Contributing
## Third-Party Integrations

### FarmDash
Complete autonomous DeFi execution layer.
- Trail Intelligence (research + Trail Heat)
- Signal Architect (zero-custody swaps + referrals)

**Install:** `npx skills add https://github.com/Parmasanandgarlic/htx-skills-hub/skills/farmdash`
Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

HTX Skills is an informational tool only. HTX Skills and its outputs are provided to you on an "as is" and "as available" basis, without representation or warranty of any kind. It does not constitute investment, financial, trading or any other form of advice; represent a recommendation to buy, sell or hold any assets; guarantee the accuracy, timeliness or completeness of the data or analysis presented.

Your use of HTX Skills and any information provided in connection with this feature is at your own risk, and you are solely responsible for evaluating the information provided and for all trading decisions made by you. We do not endorse or guarantee any AI-generated information. Any AI-generated information or summary should not be solely relied on for decision making. AI-generated content may include or reflect information, views and opinions of third parties, and may also include errors, biases or outdated information.

We are not responsible for any losses or damages incurred as a result of your use of or reliance on the HTX Skills feature. We may modify or discontinue the HTX Skills feature at our discretion, and functionality may vary by region or user profile.

Digital asset prices are subject to high market risk and price volatility. The value of your investment may go down or up, and you may not get back the amount invested. You are solely responsible for your investment decisions and we are not liable for any losses you may incur. Past performance is not a reliable predictor of future performance. You should only invest in products you are familiar with and where you understand the risks. You should carefully consider your investment experience, financial situation, investment objectives and risk tolerance and consult an independent financial adviser prior to making any investment. This material should not be construed as advice.

## License

MIT
