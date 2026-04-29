// htx-cli: HTX (Huobi) exchange REST API harness. Go port of the Python
// reference implementation in agent-harness/cli_anything/htx/.
package main

import (
	"os"

	"htx-cli/internal/cmdpkg"
)

func main() {
	root := cmdpkg.NewRoot()
	if err := root.Execute(); err != nil {
		os.Exit(cmdpkg.HandleError(err))
	}
}
