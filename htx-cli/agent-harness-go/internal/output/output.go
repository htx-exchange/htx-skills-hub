// Package output handles pretty-printing and JSON emission.
// Mirrors cli_anything/htx/utils/output.py.
package output

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sort"
	"strconv"
	"strings"
)

// Emit writes data to stdout in JSON (indented) or human form.
func Emit(data any, asJSON bool) {
	EmitTo(os.Stdout, data, asJSON)
}

// EmitTo allows directing output to an io.Writer (useful for tests).
func EmitTo(w io.Writer, data any, asJSON bool) {
	if asJSON {
		enc := json.NewEncoder(w)
		enc.SetIndent("", "  ")
		enc.SetEscapeHTML(false)
		_ = enc.Encode(data)
		return
	}
	humanTo(w, data)
}

// Err prints to stderr (no-op helper for consistency).
func Err(msg string) { fmt.Fprintln(os.Stderr, msg) }

func humanTo(w io.Writer, data any) {
	switch v := data.(type) {
	case nil:
		return
	case string:
		fmt.Fprintln(w, v)
	case bool:
		fmt.Fprintln(w, v)
	case float64:
		fmt.Fprintln(w, formatNumber(v))
	case int, int64:
		fmt.Fprintln(w, v)
	case map[string]any:
		// Envelope unwrapping: if dict has data/tick/ticks and <=6 keys,
		// recurse into the inner payload.
		if len(v) <= 6 {
			for _, k := range []string{"tick", "ticks", "data"} {
				if inner, ok := v[k]; ok {
					humanTo(w, inner)
					return
				}
			}
		}
		printKVTo(w, v)
	case []any:
		if len(v) == 0 {
			fmt.Fprintln(w, "(empty)")
			return
		}
		// If first is a dict, print a table.
		if _, ok := v[0].(map[string]any); ok {
			rows := make([]map[string]any, 0, len(v))
			for _, x := range v {
				if m, ok := x.(map[string]any); ok {
					rows = append(rows, m)
				} else {
					fmt.Fprintln(w, x)
				}
			}
			printTableTo(w, rows)
			return
		}
		for _, x := range v {
			fmt.Fprintln(w, x)
		}
	default:
		fmt.Fprintf(w, "%v\n", v)
	}
}

// PrintKVOrdered prints key/value pairs preserving caller order.
func PrintKVOrdered(w io.Writer, entries []KV) {
	maxLen := 0
	for _, e := range entries {
		if l := len(e.Key); l > maxLen {
			maxLen = l
		}
	}
	for _, e := range entries {
		printKVRow(w, e.Key, e.Value, maxLen)
	}
}

// KV is an ordered key/value pair.
type KV struct {
	Key   string
	Value any
}

func printKVTo(w io.Writer, m map[string]any) {
	// Python preserves insertion order; Go maps don't, so sort by key for stable output.
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	maxLen := 0
	for _, k := range keys {
		if l := len(k); l > maxLen {
			maxLen = l
		}
	}
	for _, k := range keys {
		printKVRow(w, k, m[k], maxLen)
	}
}

func printKVRow(w io.Writer, k string, v any, width int) {
	var s string
	switch x := v.(type) {
	case map[string]any, []any:
		raw, _ := json.Marshal(v)
		s = string(raw)
	case nil:
		s = "None"
	case float64:
		s = formatNumber(x)
	default:
		s = fmt.Sprintf("%v", v)
	}
	fmt.Fprintf(w, "%s  %s\n", padRight(k, width), s)
}

func printTableTo(w io.Writer, rows []map[string]any) {
	// Collect columns in first-seen order.
	var cols []string
	seen := map[string]bool{}
	for _, r := range rows {
		// Sort keys inside each row for determinism.
		rk := make([]string, 0, len(r))
		for k := range r {
			rk = append(rk, k)
		}
		sort.Strings(rk)
		for _, k := range rk {
			if !seen[k] {
				seen[k] = true
				cols = append(cols, k)
			}
		}
	}
	if len(cols) > 8 {
		cols = append(cols[:8], "...")
	}

	cell := func(r map[string]any, key string) string {
		if key == "..." {
			return "…"
		}
		v, ok := r[key]
		if !ok || v == nil {
			return ""
		}
		var s string
		switch x := v.(type) {
		case map[string]any, []any:
			raw, _ := json.Marshal(v)
			s = string(raw)
		case float64:
			s = formatNumber(x)
		default:
			s = fmt.Sprintf("%v", v)
		}
		if len(s) > 40 {
			s = s[:37] + "..."
		}
		return s
	}

	widths := make(map[string]int, len(cols))
	for _, c := range cols {
		widths[c] = len(c)
	}
	for _, r := range rows {
		for _, c := range cols {
			if l := len(cell(r, c)); l > widths[c] {
				widths[c] = l
			}
		}
	}

	parts := make([]string, 0, len(cols))
	for _, c := range cols {
		parts = append(parts, padRight(c, widths[c]))
	}
	fmt.Fprintln(w, strings.Join(parts, "  "))

	parts = parts[:0]
	for _, c := range cols {
		parts = append(parts, strings.Repeat("-", widths[c]))
	}
	fmt.Fprintln(w, strings.Join(parts, "  "))

	for _, r := range rows {
		parts = parts[:0]
		for _, c := range cols {
			parts = append(parts, padRight(cell(r, c), widths[c]))
		}
		fmt.Fprintln(w, strings.Join(parts, "  "))
	}
}

func padRight(s string, width int) string {
	if len(s) >= width {
		return s
	}
	return s + strings.Repeat(" ", width-len(s))
}

// formatNumber renders a float64 without scientific notation. Integral values
// are printed as integers so "1777267901226" doesn't come out as "1.77e+12".
func formatNumber(f float64) string {
	if f == float64(int64(f)) && f < 1e18 && f > -1e18 {
		return strconv.FormatInt(int64(f), 10)
	}
	return strconv.FormatFloat(f, 'f', -1, 64)
}
