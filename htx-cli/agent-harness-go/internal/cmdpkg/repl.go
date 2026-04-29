package cmdpkg

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

func newReplCmd(root *cobra.Command) *cobra.Command {
	return &cobra.Command{
		Use:   "repl",
		Short: "Interactive REPL.",
		Long: `Interactive REPL.

Type commands without the ` + "`htx-cli`" + ` prefix. Type 'exit' or Ctrl-D to quit.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runREPL(root, os.Stdin, os.Stdout, os.Stderr)
		},
	}
}

func runREPL(root *cobra.Command, in io.Reader, out, errW io.Writer) error {
	fmt.Fprintln(errW, "htx-cli REPL. Type 'help' or 'exit'.")
	reader := bufio.NewReader(in)
	for {
		fmt.Fprint(errW, "htx> ")
		line, err := reader.ReadString('\n')
		if err == io.EOF {
			fmt.Fprintln(errW)
			return nil
		}
		if err != nil {
			return err
		}
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if line == "exit" || line == "quit" {
			return nil
		}
		if line == "help" {
			line = "--help"
		}
		tokens, err := shellsplit(line)
		if err != nil {
			fmt.Fprintln(errW, "parse error:", err)
			continue
		}
		root.SetArgs(tokens)
		// Don't let sub-command errors terminate the REPL.
		if err := root.Execute(); err != nil {
			fmt.Fprintln(errW, "error:", err)
		}
	}
}

// shellsplit is a minimal POSIX-ish tokenizer: handles single and double
// quotes and backslash-escaped chars. Good enough for REPL input.
func shellsplit(s string) ([]string, error) {
	var out []string
	var cur strings.Builder
	inSingle, inDouble := false, false
	escape := false
	hasToken := false
	for i := 0; i < len(s); i++ {
		c := s[i]
		if escape {
			cur.WriteByte(c)
			escape = false
			hasToken = true
			continue
		}
		switch {
		case c == '\\' && !inSingle:
			escape = true
		case c == '\'' && !inDouble:
			inSingle = !inSingle
			hasToken = true
		case c == '"' && !inSingle:
			inDouble = !inDouble
			hasToken = true
		case (c == ' ' || c == '\t') && !inSingle && !inDouble:
			if hasToken {
				out = append(out, cur.String())
				cur.Reset()
				hasToken = false
			}
		default:
			cur.WriteByte(c)
			hasToken = true
		}
	}
	if inSingle || inDouble {
		return nil, fmt.Errorf("unclosed quote")
	}
	if hasToken {
		out = append(out, cur.String())
	}
	return out, nil
}
