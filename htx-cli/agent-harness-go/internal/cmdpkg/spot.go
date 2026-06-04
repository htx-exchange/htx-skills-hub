package cmdpkg

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/spf13/cobra"

	"htx-cli/internal/output"
)

func newSpotCmd() *cobra.Command {
	spot := &cobra.Command{Use: "spot", Short: "HTX spot trading endpoints."}
	spot.AddCommand(newSpotMarket())
	spot.AddCommand(newSpotAccount())
	spot.AddCommand(newSpotOrder())
	spot.AddCommand(newSpotCall())
	return spot
}

func newSpotMarket() *cobra.Command {
	market := &cobra.Command{Use: "market", Short: "Public market data."}

	market.AddCommand(simpleGet("timestamp", "Server time (ms).",
		"/v1/common/timestamp", false))
	market.AddCommand(simpleGet("status", "Market status.",
		"/v2/market-status", false))
	market.AddCommand(simpleGet("symbols", "All trading pairs.",
		"/v2/settings/common/symbols", false))
	market.AddCommand(simpleGet("currencies", "All currencies.",
		"/v2/settings/common/currencies", false))
	market.AddCommand(simpleGet("tickers", "All tickers.",
		"/market/tickers", false))

	market.AddCommand(&cobra.Command{
		Use:   "ticker <symbol>",
		Short: "Ticker for a single symbol (e.g. btcusdt).",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.SpotPublicGet("/market/detail",
				map[string]string{"symbol": args[0]})
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	})

	var size int
	klines := &cobra.Command{
		Use:   "klines <symbol> <period>",
		Short: "K-line data. Period: 1min,5min,15min,30min,60min,4hour,1day,1mon,1week,1year.",
		Args:  cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			params := map[string]string{
				"symbol": args[0], "period": args[1],
				"size": strconv.Itoa(size),
			}
			data, err := c.Client.SpotPublicGet("/market/history/kline", params)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	klines.Flags().IntVar(&size, "size", 150, "Number of klines.")
	market.AddCommand(klines)

	var depthType string
	depth := &cobra.Command{
		Use:   "depth <symbol>",
		Short: "Order book depth.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			params := map[string]string{"symbol": args[0], "type": depthType}
			data, err := c.Client.SpotPublicGet("/market/depth", params)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	depth.Flags().StringVar(&depthType, "type", "step0",
		"Aggregation step: step0..step5.")
	market.AddCommand(depth)

	var tradesSize int
	trades := &cobra.Command{
		Use:   "trades <symbol>",
		Short: "Recent trades.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			params := map[string]string{
				"symbol": args[0],
				"size":   strconv.Itoa(tradesSize),
			}
			data, err := c.Client.SpotPublicGet("/market/history/trade", params)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	trades.Flags().IntVar(&tradesSize, "size", 1, "Number of trades.")
	market.AddCommand(trades)

	return market
}

func newSpotAccount() *cobra.Command {
	acct := &cobra.Command{Use: "account", Short: "Spot account (auth)."}

	acct.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List all accounts.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.SpotPrivateGet("/v1/account/accounts", nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	})

	acct.AddCommand(&cobra.Command{
		Use:   "balance <account_id>",
		Short: "Balance for an account.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.SpotPrivateGet(
				"/v1/account/accounts/"+args[0]+"/balance", nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	})

	var currency string
	val := &cobra.Command{
		Use:   "valuation",
		Short: "Account valuation.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.SpotPrivateGet("/v2/account/valuation",
				map[string]string{"valuationCurrency": currency})
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	val.Flags().StringVar(&currency, "currency", "USD", "Valuation currency.")
	acct.AddCommand(val)

	return acct
}

func newSpotOrder() *cobra.Command {
	order := &cobra.Command{Use: "order", Short: "Spot orders (auth)."}

	validTypes := map[string]bool{}
	for _, t := range []string{
		"buy-limit", "sell-limit", "buy-market", "sell-market",
		"buy-ioc", "sell-ioc", "buy-limit-maker", "sell-limit-maker",
		"buy-stop-limit", "sell-stop-limit", "buy-limit-fok", "sell-limit-fok",
	} {
		validTypes[t] = true
	}

	var accountID, symbol, oType, amount, price, clientOrderID string
	place := &cobra.Command{
		Use:   "place",
		Short: "Place a new spot order.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			if !validTypes[oType] {
				return fmt.Errorf("invalid --type %q", oType)
			}
			body := map[string]any{
				"account-id": accountID,
				"symbol":     symbol,
				"type":       oType,
				"amount":     amount,
			}
			if price != "" {
				body["price"] = price
			}
			if clientOrderID != "" {
				body["client-order-id"] = clientOrderID
			}
			data, err := c.Client.SpotPrivatePost("/v1/order/orders/place", body, nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	place.Flags().StringVar(&accountID, "account-id", "", "")
	place.Flags().StringVar(&symbol, "symbol", "", "")
	place.Flags().StringVar(&oType, "type", "", "Order type.")
	place.Flags().StringVar(&amount, "amount", "", "")
	place.Flags().StringVar(&price, "price", "", "Limit price.")
	place.Flags().StringVar(&clientOrderID, "client-order-id", "", "")
	_ = place.MarkFlagRequired("account-id")
	_ = place.MarkFlagRequired("symbol")
	_ = place.MarkFlagRequired("type")
	_ = place.MarkFlagRequired("amount")
	order.AddCommand(place)

	order.AddCommand(&cobra.Command{
		Use:   "cancel <order_id>",
		Short: "Cancel an order by id.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.SpotPrivatePost(
				"/v1/order/orders/"+args[0]+"/cancel", nil, nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	})

	order.AddCommand(&cobra.Command{
		Use:   "query <order_id>",
		Short: "Query a specific order by id.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.SpotPrivateGet("/v1/order/orders/"+args[0], nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	})

	var listAcctID, listSymbol, listStates string
	var listSize int
	list := &cobra.Command{
		Use:   "list",
		Short: "List orders.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			params := map[string]string{
				"account-id": listAcctID,
				"states":     listStates,
				"size":       strconv.Itoa(listSize),
			}
			if listSymbol != "" {
				params["symbol"] = listSymbol
			}
			data, err := c.Client.SpotPrivateGet("/v1/order/orders", params)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	list.Flags().StringVar(&listAcctID, "account-id", "", "")
	list.Flags().StringVar(&listSymbol, "symbol", "", "")
	list.Flags().StringVar(&listStates, "states", "submitted,partial-filled",
		"Comma-separated states.")
	list.Flags().IntVar(&listSize, "size", 20, "")
	_ = list.MarkFlagRequired("account-id")
	order.AddCommand(list)

	return order
}

func newSpotCall() *cobra.Command {
	var (
		method string
		auth   bool
		params []string
		body   string
	)
	cmd := &cobra.Command{
		Use:   "call <path>",
		Short: "Call an arbitrary spot endpoint.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			qmap := parseKVParams(params)

			method = strings.ToUpper(method)
			switch method {
			case "GET":
				var (
					data any
					err  error
				)
				if auth {
					data, err = c.Client.SpotPrivateGet(args[0], qmap)
				} else {
					data, err = c.Client.SpotPublicGet(args[0], qmap)
				}
				if err != nil {
					return err
				}
				output.Emit(data, c.JSON)
				return nil
			case "POST":
				if !auth {
					return fmt.Errorf("POST without --auth is not supported by HTX.")
				}
				var b map[string]any
				if body != "" {
					if err := json.Unmarshal([]byte(body), &b); err != nil {
						return fmt.Errorf("invalid --body JSON: %w", err)
					}
				}
				q := map[string]any{}
				for k, v := range qmap {
					q[k] = v
				}
				data, err := c.Client.SpotPrivatePost(args[0], b, q)
				if err != nil {
					return err
				}
				output.Emit(data, c.JSON)
				return nil
			default:
				return fmt.Errorf("--method must be GET or POST")
			}
		},
	}
	cmd.Flags().StringVar(&method, "method", "GET", "HTTP method.")
	cmd.Flags().BoolVar(&auth, "auth", false, "Sign the request.")
	cmd.Flags().StringArrayVarP(&params, "param", "p", nil,
		"Query parameter KEY=VALUE (repeatable).")
	cmd.Flags().StringVar(&body, "body", "", "JSON body (POST).")
	return cmd
}

// simpleGet builds a cobra command that does a zero-arg public GET.
func simpleGet(use, short, path string, futures bool) *cobra.Command {
	return &cobra.Command{
		Use:   use,
		Short: short,
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			var (
				data any
				err  error
			)
			if futures {
				data, err = c.Client.FuturesPublicGet(path, nil)
			} else {
				data, err = c.Client.SpotPublicGet(path, nil)
			}
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
}

func parseKVParams(kvs []string) map[string]string {
	if len(kvs) == 0 {
		return nil
	}
	out := make(map[string]string, len(kvs))
	for _, kv := range kvs {
		if i := strings.IndexByte(kv, '='); i > 0 {
			out[kv[:i]] = kv[i+1:]
		}
	}
	return out
}
