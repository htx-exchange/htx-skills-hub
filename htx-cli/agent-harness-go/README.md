# htx-cli (Go)

Stateful CLI harness for the HTX (Huobi) exchange REST API.

Built against the OpenAPI specs in `../openapi/` covering:

- Spot trading API (reference, market, account, trading)
- USDT-M perpetual futures API

## Requirements

- Go 1.23 or newer
- macOS / Linux

## Build & install

```bash
cd htx-cli/agent-harness-go

# build a local binary at ./bin/htx-cli
make build
./bin/htx-cli --help

# install into $GOBIN / $GOPATH/bin
make install
which htx-cli
htx-cli --version
```

The only third-party dependency is [`spf13/cobra`](https://github.com/spf13/cobra);
everything else (HTTP, HMAC signing, JSON) comes from the Go standard library.

## Configure

Credentials for authenticated endpoints:

```bash
htx-cli config set-key <ACCESS_KEY>
htx-cli config set-secret <SECRET_KEY>
htx-cli config show
```

Or use environment variables, which override the config file:

```bash
export HTX_API_KEY=...
export HTX_SECRET_KEY=...
export HTX_SPOT_BASE_URL=https://api.huobi.pro
export HTX_FUTURES_BASE_URL=https://api.hbdm.com
```

Config is stored at `~/.config/htx-cli/config.json` with file mode `0600`.
A custom location can be passed via `--config /path/to/config.json`.

## Usage

### One-shot commands

```bash
# Public spot data (no auth)
htx-cli spot market timestamp
htx-cli spot market ticker btcusdt
htx-cli spot market klines btcusdt 1min --size 10
htx-cli spot market depth btcusdt --type step0

# Authenticated spot
htx-cli spot account list
htx-cli spot order place --account-id 123 --symbol btcusdt \
    --type buy-limit --amount 0.01 --price 50000

# Public futures
htx-cli futures market funding-rate BTC-USDT
htx-cli futures market contract-info

# Authenticated futures
htx-cli futures account info --contract-code BTC-USDT
htx-cli futures order place --contract-code BTC-USDT \
    --direction buy --offset open --volume 1 --lever-rate 10 \
    --order-price-type limit --price 50000

# JSON output
htx-cli --json spot market tickers | jq '.data[0]'
```

### Generic escape hatch

For endpoints not exposed as first-class subcommands:

```bash
htx-cli spot call /v1/common/timestamp
htx-cli futures call /linear-swap-api/v1/swap_batch_funding_rate \
    -p contract_code=BTC-USDT
htx-cli futures call /linear-swap-api/v1/swap_order --method POST --auth \
    --body '{"contract_code":"BTC-USDT","direction":"buy","offset":"open"}'
```

### REPL

```bash
htx-cli repl
htx> spot market timestamp
htx> --json spot market ticker btcusdt
htx> exit
```

## Testing

```bash
# unit + e2e tests (binary is built on demand)
make test

# skip live network tests
make test-no-live
```

Live tests can also be disabled by exporting `HTX_DISABLE_LIVE=1`.

## Project layout

```
agent-harness-go/
├── cmd/htx-cli/          # main entry point
├── internal/auth/        # HMAC-SHA256 signing + RFC3986 encoding
├── internal/client/      # HTTP transport, HtxError, envelope parsing
├── internal/config/      # config file + env var overrides
├── internal/cmdpkg/      # cobra commands (root, config, spot, futures, repl)
├── internal/output/      # human-readable + JSON formatting
├── internal/version/     # version / user-agent constants
├── e2e_test.go           # end-to-end tests via compiled binary
├── go.mod / go.sum
└── Makefile
```

## Design notes

- Command tree: `config` / `spot` / `futures` / `repl`
- Config file path `~/.config/htx-cli/config.json`, mode `0600`
- Env var overrides: `HTX_API_KEY`, `HTX_SECRET_KEY`,
  `HTX_SPOT_BASE_URL`, `HTX_FUTURES_BASE_URL` (precedence: file → env)
- HMAC-SHA256 signing: sorted params, RFC3986 encoding,
  `METHOD\nhost\npath\nquery` pre-sign string, base64 signature
- Timestamp format: `YYYY-MM-DDTHH:MM:SS` in UTC
- HTX envelope error handling: `status: "error"` or non-200 `code`
- Output: JSON (`--json`) or human-readable tables, with envelope unwrapping
