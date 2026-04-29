package cmdpkg

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"htx-cli/internal/output"
)

func newConfigCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "config",
		Short: "Manage credentials and endpoints.",
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "show",
		Short: "Show current config (secrets redacted).",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			entries := c.Config.RedactedOrdered()
			kv := make([]output.KV, 0, len(entries)+1)
			for _, e := range entries {
				kv = append(kv, output.KV{Key: e.Key, Value: e.Value})
			}
			kv = append(kv, output.KV{Key: "_config_path", Value: c.ConfigPath})

			if c.JSON {
				m := map[string]any{}
				for _, e := range kv {
					m[e.Key] = e.Value
				}
				output.Emit(m, true)
				return nil
			}
			output.PrintKVOrdered(os.Stdout, kv)
			return nil
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "set-key <access_key>",
		Short: "Persist the AccessKeyId.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			c.Config.AccessKey = args[0]
			p, err := c.Config.Save(c.ConfigPath)
			if err != nil {
				return err
			}
			output.Emit(map[string]any{"ok": true, "saved_to": p}, c.JSON)
			return nil
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "set-secret <secret_key>",
		Short: "Persist the secret key.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			c.Config.SecretKey = args[0]
			p, err := c.Config.Save(c.ConfigPath)
			if err != nil {
				return err
			}
			output.Emit(map[string]any{"ok": true, "saved_to": p}, c.JSON)
			return nil
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "set-base-url <spot|futures> <url>",
		Short: "Override the base URL for a market.",
		Args:  cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			market, url := args[0], args[1]
			switch market {
			case "spot":
				c.Config.SpotBaseURL = url
			case "futures":
				c.Config.FuturesBaseURL = url
			default:
				return fmt.Errorf("market must be 'spot' or 'futures', got %q", market)
			}
			p, err := c.Config.Save(c.ConfigPath)
			if err != nil {
				return err
			}
			output.Emit(map[string]any{"ok": true, "saved_to": p}, c.JSON)
			return nil
		},
	})

	var yes bool
	clearCmd := &cobra.Command{
		Use:   "clear",
		Short: "Wipe credentials from the config file.",
		RunE: func(cmd *cobra.Command, args []string) error {
			c := CtxFrom(cmd)
			if !yes {
				fmt.Fprint(os.Stderr, "Delete credentials from disk? [y/N]: ")
				reader := bufio.NewReader(os.Stdin)
				line, _ := reader.ReadString('\n')
				if !strings.HasPrefix(strings.ToLower(strings.TrimSpace(line)), "y") {
					return fmt.Errorf("aborted")
				}
			}
			c.Config.AccessKey = ""
			c.Config.SecretKey = ""
			p, err := c.Config.Save(c.ConfigPath)
			if err != nil {
				return err
			}
			output.Emit(map[string]any{"ok": true, "cleared": true, "path": p}, c.JSON)
			return nil
		},
	}
	clearCmd.Flags().BoolVarP(&yes, "yes", "y", false, "Skip confirmation prompt.")
	cmd.AddCommand(clearCmd)

	return cmd
}
