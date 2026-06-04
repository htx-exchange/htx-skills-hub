package cmdpkg

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/spf13/cobra"

	"htx-cli/internal/output"
)

func newFuturesCmd() *cobra.Command {
	f := &cobra.Command{Use: "futures", Short: "HTX USDT-M perpetual futures endpoints."}
	f.AddCommand(newFuturesMarket())
	f.AddCommand(newFuturesAccount())
	f.AddCommand(newFuturesOrder())
	f.AddCommand(newFuturesCall())
	return f
}

func newFuturesMarket() *cobra.Command {
	m := &cobra.Command{Use: "market", Short: "Public futures market data."}

	m.AddCommand(&cobra.Command{
		Use:   "funding-rate <contract_code>",
		Short: "Current funding rate for CONTRACT_CODE (e.g. BTC-USDT).",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.FuturesPublicGet(
				"/linear-swap-api/v1/swap_funding_rate",
				map[string]string{"contract_code": args[0]})
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	})

	var pageSize, pageIndex int
	hfr := &cobra.Command{
		Use:   "historical-funding-rate <contract_code>",
		Short: "Historical funding rate.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.FuturesPublicGet(
				"/linear-swap-api/v1/swap_historical_funding_rate",
				map[string]string{
					"contract_code": args[0],
					"page_size":     strconv.Itoa(pageSize),
					"page_index":    strconv.Itoa(pageIndex),
				})
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	hfr.Flags().IntVar(&pageSize, "page-size", 50, "")
	hfr.Flags().IntVar(&pageIndex, "page-index", 1, "")
	m.AddCommand(hfr)

	var tradeType, liqPageSize, liqPageIndex int
	liq := &cobra.Command{
		Use:   "liquidation-orders <contract_code>",
		Short: "Liquidation orders.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.FuturesPublicGet(
				"/linear-swap-api/v1/swap_liquidation_orders",
				map[string]string{
					"contract_code": args[0],
					"trade_type":    strconv.Itoa(tradeType),
					"page_size":     strconv.Itoa(liqPageSize),
					"page_index":    strconv.Itoa(liqPageIndex),
				})
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	liq.Flags().IntVar(&tradeType, "trade-type", 0, "")
	liq.Flags().IntVar(&liqPageSize, "page-size", 50, "")
	liq.Flags().IntVar(&liqPageIndex, "page-index", 1, "")
	m.AddCommand(liq)

	var contractCode string
	ci := &cobra.Command{
		Use:   "contract-info",
		Short: "Contract info.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			var params map[string]string
			if contractCode != "" {
				params = map[string]string{"contract_code": contractCode}
			}
			data, err := c.Client.FuturesPublicGet(
				"/linear-swap-api/v1/swap_contract_info", params)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	ci.Flags().StringVar(&contractCode, "contract-code", "", "")
	m.AddCommand(ci)

	m.AddCommand(simpleGet("tickers", "All tickers.",
		"/linear-swap-ex/market/detail/batch_merged", true))

	m.AddCommand(&cobra.Command{
		Use:   "system-status <contract_code>",
		Short: "System status.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.FuturesPublicGet(
				"/linear-swap-api/v1/swap_system_status",
				map[string]string{"contract_code": args[0]})
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	})
	return m
}

func newFuturesAccount() *cobra.Command {
	a := &cobra.Command{Use: "account", Short: "Futures account (auth)."}

	var infoCode string
	info := &cobra.Command{
		Use:   "info",
		Short: "Isolated account info.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			body := map[string]any{}
			if infoCode != "" {
				body["contract_code"] = infoCode
			}
			data, err := c.Client.FuturesPrivatePost(
				"/linear-swap-api/v1/swap_account_info", body, nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	info.Flags().StringVar(&infoCode, "contract-code", "", "")
	a.AddCommand(info)

	var posCode string
	pos := &cobra.Command{
		Use:   "position-info",
		Short: "Isolated position info.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			body := map[string]any{}
			if posCode != "" {
				body["contract_code"] = posCode
			}
			data, err := c.Client.FuturesPrivatePost(
				"/linear-swap-api/v1/swap_position_info", body, nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	pos.Flags().StringVar(&posCode, "contract-code", "", "")
	a.AddCommand(pos)

	a.AddCommand(&cobra.Command{
		Use:   "unified-type",
		Short: "Query unified account type.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			data, err := c.Client.FuturesPrivateGet(
				"/linear-swap-api/v3/swap_unified_account_type", nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	})
	return a
}

func newFuturesOrder() *cobra.Command {
	o := &cobra.Command{Use: "order", Short: "Futures orders (auth)."}

	validDir := map[string]bool{"buy": true, "sell": true}
	validOffset := map[string]bool{"open": true, "close": true, "both": true}
	validOPT := map[string]bool{
		"limit": true, "opponent": true, "post_only": true,
		"optimal_5": true, "optimal_10": true, "optimal_20": true,
		"ioc": true, "fok": true, "market": true,
	}

	var (
		pCode, pDir, pOffset, pPrice, pOPT string
		pVolume, pLever                    int
		pCross                             bool
	)
	place := &cobra.Command{
		Use:   "place",
		Short: "Place a futures order.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			if !validDir[pDir] {
				return fmt.Errorf("--direction must be buy or sell")
			}
			if !validOffset[pOffset] {
				return fmt.Errorf("--offset must be open, close, or both")
			}
			if !validOPT[pOPT] {
				return fmt.Errorf("invalid --order-price-type %q", pOPT)
			}
			body := map[string]any{
				"contract_code":    pCode,
				"direction":        pDir,
				"offset":           pOffset,
				"volume":           pVolume,
				"lever_rate":       pLever,
				"order_price_type": pOPT,
			}
			if pPrice != "" {
				body["price"] = pPrice
			}
			path := "/linear-swap-api/v1/swap_order"
			if pCross {
				path = "/linear-swap-api/v1/swap_cross_order"
			}
			data, err := c.Client.FuturesPrivatePost(path, body, nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	place.Flags().StringVar(&pCode, "contract-code", "", "")
	place.Flags().StringVar(&pDir, "direction", "", "buy|sell")
	place.Flags().StringVar(&pOffset, "offset", "", "open|close|both")
	place.Flags().IntVar(&pVolume, "volume", 0, "")
	place.Flags().IntVar(&pLever, "lever-rate", 0, "")
	place.Flags().StringVar(&pOPT, "order-price-type", "",
		"limit|opponent|post_only|optimal_5|optimal_10|optimal_20|ioc|fok|market")
	place.Flags().StringVar(&pPrice, "price", "", "")
	place.Flags().BoolVar(&pCross, "cross", false, "Use cross-margin endpoint.")
	for _, f := range []string{"contract-code", "direction", "offset", "volume", "lever-rate", "order-price-type"} {
		_ = place.MarkFlagRequired(f)
	}
	o.AddCommand(place)

	var cCode, cOrder, cClient string
	var cCross bool
	cancel := &cobra.Command{
		Use:   "cancel",
		Short: "Cancel a futures order.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			if cOrder == "" && cClient == "" {
				return fmt.Errorf("provide --order-id or --client-order-id")
			}
			body := map[string]any{"contract_code": cCode}
			if cOrder != "" {
				body["order_id"] = cOrder
			}
			if cClient != "" {
				body["client_order_id"] = cClient
			}
			path := "/linear-swap-api/v1/swap_cancel"
			if cCross {
				path = "/linear-swap-api/v1/swap_cross_cancel"
			}
			data, err := c.Client.FuturesPrivatePost(path, body, nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	cancel.Flags().StringVar(&cOrder, "order-id", "", "")
	cancel.Flags().StringVar(&cClient, "client-order-id", "", "")
	cancel.Flags().StringVar(&cCode, "contract-code", "", "")
	cancel.Flags().BoolVar(&cCross, "cross", false, "")
	_ = cancel.MarkFlagRequired("contract-code")
	o.AddCommand(cancel)

	var lCode string
	var lCross bool
	list := &cobra.Command{
		Use:   "list",
		Short: "List open orders.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			body := map[string]any{"contract_code": lCode}
			path := "/linear-swap-api/v1/swap_openorders"
			if lCross {
				path = "/linear-swap-api/v1/swap_cross_openorders"
			}
			data, err := c.Client.FuturesPrivatePost(path, body, nil)
			if err != nil {
				return err
			}
			output.Emit(data, c.JSON)
			return nil
		},
	}
	list.Flags().StringVar(&lCode, "contract-code", "", "")
	list.Flags().BoolVar(&lCross, "cross", false, "")
	_ = list.MarkFlagRequired("contract-code")
	o.AddCommand(list)

	return o
}

func newFuturesCall() *cobra.Command {
	var (
		method string
		auth   bool
		params []string
		body   string
	)
	cmd := &cobra.Command{
		Use:   "call <path>",
		Short: "Call an arbitrary futures endpoint.",
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
					data, err = c.Client.FuturesPrivateGet(args[0], qmap)
				} else {
					data, err = c.Client.FuturesPublicGet(args[0], qmap)
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
				data, err := c.Client.FuturesPrivatePost(args[0], b, q)
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
	cmd.Flags().StringVar(&method, "method", "GET", "")
	cmd.Flags().BoolVar(&auth, "auth", false, "Sign the request.")
	cmd.Flags().StringArrayVarP(&params, "param", "p", nil,
		"Query parameter KEY=VALUE (repeatable).")
	cmd.Flags().StringVar(&body, "body", "", "JSON body (POST).")
	return cmd
}
