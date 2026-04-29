// Package cmdpkg wires all htx-cli subcommands together.
package cmdpkg

import (
	"context"
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"htx-cli/internal/client"
	"htx-cli/internal/config"
	"htx-cli/internal/version"
)

// Context is the shared state attached to every cobra command.
type Context struct {
	Config     *config.Config
	ConfigPath string
	Client     *client.Client
	JSON       bool
}

type ctxKey struct{}

// CtxFrom extracts the Context from a cobra command (walks up to root if needed).
func CtxFrom(cmd *cobra.Command) *Context {
	for c := cmd; c != nil; c = c.Parent() {
		if ctx := c.Context(); ctx != nil {
			if v, ok := ctx.Value(ctxKey{}).(*Context); ok && v != nil {
				return v
			}
		}
	}
	panic("htx-cli: missing Context on cobra command")
}

// NewRoot builds the root command and wires all subcommands.
func NewRoot() *cobra.Command {
	var (
		asJSON     bool
		configFile string
	)

	root := &cobra.Command{
		Use:               "htx-cli",
		Short:             "htx-cli: HTX (Huobi) exchange REST API harness.",
		Version:           version.Version,
		CompletionOptions: cobra.CompletionOptions{DisableDefaultCmd: true},
		SilenceUsage:      true,
		PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load(configFile)
			if err != nil {
				return err
			}
			path := configFile
			if path == "" {
				path = config.Path()
			}
			hctx := &Context{
				Config:     cfg,
				ConfigPath: path,
				Client:     client.New(cfg),
				JSON:       asJSON,
			}
			parent := cmd.Context()
			if parent == nil {
				parent = context.Background()
			}
			cmd.SetContext(context.WithValue(parent, ctxKey{}, hctx))
			return nil
		},
	}

	root.PersistentFlags().BoolVar(&asJSON, "json", false, "Emit JSON to stdout.")
	root.PersistentFlags().StringVar(&configFile, "config", "", "Override config file path.")

	root.AddCommand(newConfigCmd())
	root.AddCommand(newSpotCmd())
	root.AddCommand(newFuturesCmd())
	root.AddCommand(newReplCmd(root))

	return root
}

// HandleError prints an error to stderr and returns the desired exit code.
func HandleError(err error) int {
	if err == nil {
		return 0
	}
	fmt.Fprintln(os.Stderr, "HTX error: "+err.Error())
	return 2
}
