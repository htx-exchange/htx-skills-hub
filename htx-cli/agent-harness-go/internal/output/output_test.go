package output

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
)

func TestEmitJSON(t *testing.T) {
	var buf bytes.Buffer
	EmitTo(&buf, map[string]any{"a": 1, "b": "x"}, true)
	var parsed map[string]any
	if err := json.Unmarshal(buf.Bytes(), &parsed); err != nil {
		t.Fatalf("not valid JSON: %q", buf.String())
	}
	if parsed["b"] != "x" {
		t.Errorf("value lost: %+v", parsed)
	}
}

func TestEmitHumanKV(t *testing.T) {
	var buf bytes.Buffer
	EmitTo(&buf, map[string]any{"foo": "bar", "baz": float64(1777267901226)}, false)
	s := buf.String()
	if !strings.Contains(s, "foo") || !strings.Contains(s, "bar") {
		t.Errorf("kv not printed: %q", s)
	}
	if !strings.Contains(s, "1777267901226") {
		t.Errorf("large int not formatted: %q", s)
	}
	if strings.Contains(s, "1.777") {
		t.Errorf("scientific notation leaked: %q", s)
	}
}

func TestEmitHumanTable(t *testing.T) {
	rows := []any{
		map[string]any{"id": float64(1), "name": "a"},
		map[string]any{"id": float64(2), "name": "b"},
	}
	var buf bytes.Buffer
	EmitTo(&buf, rows, false)
	s := buf.String()
	if !strings.Contains(s, "id") || !strings.Contains(s, "name") {
		t.Errorf("header missing: %q", s)
	}
	if !strings.Contains(s, "---") {
		t.Errorf("separator missing: %q", s)
	}
}

func TestEmitEnvelopeUnwrap(t *testing.T) {
	env := map[string]any{
		"status": "ok",
		"data":   float64(123),
	}
	var buf bytes.Buffer
	EmitTo(&buf, env, false)
	s := strings.TrimSpace(buf.String())
	if s != "123" {
		t.Errorf("envelope not unwrapped: %q", s)
	}
}

func TestEmitEmptyList(t *testing.T) {
	var buf bytes.Buffer
	EmitTo(&buf, []any{}, false)
	if !strings.Contains(buf.String(), "(empty)") {
		t.Errorf("empty list marker missing: %q", buf.String())
	}
}

func TestFormatNumberIntegral(t *testing.T) {
	if got := formatNumber(42); got != "42" {
		t.Errorf("got %q", got)
	}
	if got := formatNumber(1777267901226); got != "1777267901226" {
		t.Errorf("got %q", got)
	}
	if got := formatNumber(3.14); got != "3.14" {
		t.Errorf("got %q", got)
	}
}
