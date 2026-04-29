package cmdpkg

import (
	"bytes"
	"strings"
	"testing"
)

func TestShellsplit(t *testing.T) {
	cases := []struct {
		in   string
		want []string
	}{
		{`spot market timestamp`, []string{"spot", "market", "timestamp"}},
		{`--json spot market ticker btcusdt`, []string{"--json", "spot", "market", "ticker", "btcusdt"}},
		{`config set-key "some key with spaces"`, []string{"config", "set-key", "some key with spaces"}},
		{`call --body '{"a":1}'`, []string{"call", "--body", `{"a":1}`}},
	}
	for _, c := range cases {
		got, err := shellsplit(c.in)
		if err != nil {
			t.Errorf("shellsplit(%q) error: %v", c.in, err)
			continue
		}
		if len(got) != len(c.want) {
			t.Errorf("shellsplit(%q)=%v, want %v", c.in, got, c.want)
			continue
		}
		for i := range got {
			if got[i] != c.want[i] {
				t.Errorf("shellsplit(%q)[%d]=%q, want %q", c.in, i, got[i], c.want[i])
			}
		}
	}
	if _, err := shellsplit(`unclosed "quote`); err == nil {
		t.Error("expected unclosed-quote error")
	}
}

func TestRootHelpNoError(t *testing.T) {
	r := NewRoot()
	r.SetArgs([]string{"--help"})
	var out bytes.Buffer
	r.SetOut(&out)
	r.SetErr(&out)
	if err := r.Execute(); err != nil {
		t.Fatalf("help returned error: %v", err)
	}
	s := out.String()
	for _, want := range []string{"htx-cli", "spot", "futures", "config", "repl"} {
		if !strings.Contains(s, want) {
			t.Errorf("help missing %q: %s", want, s)
		}
	}
}
