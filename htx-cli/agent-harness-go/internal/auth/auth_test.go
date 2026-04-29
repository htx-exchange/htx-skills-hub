package auth

import "testing"

func TestRFC3986Encode(t *testing.T) {
	cases := map[string]string{
		"":            "",
		"abc":         "abc",
		"a b":         "a%20b",
		"!":           "%21",
		"~":           "~", // unreserved
		"-._~":        "-._~",
		"/":           "%2F",
		"BTC-USDT":    "BTC-USDT",
		"btc+usd":     "btc%2Busd",
		"foo=bar&baz": "foo%3Dbar%26baz",
	}
	for in, want := range cases {
		if got := RFC3986Encode(in); got != want {
			t.Errorf("encode(%q)=%q, want %q", in, got, want)
		}
	}
}

func TestBuildSignedParamsDeterministic(t *testing.T) {
	p1, err := BuildSignedParams("GET", "https://api.huobi.pro", "/v1/x",
		"AK", "SK", map[string]string{"foo": "bar"}, "2024-01-01T00:00:00")
	if err != nil {
		t.Fatal(err)
	}
	p2, _ := BuildSignedParams("GET", "https://api.huobi.pro", "/v1/x",
		"AK", "SK", map[string]string{"foo": "bar"}, "2024-01-01T00:00:00")
	if p1["Signature"] != p2["Signature"] {
		t.Errorf("signature not deterministic: %s vs %s",
			p1["Signature"], p2["Signature"])
	}
	for _, k := range []string{"AccessKeyId", "SignatureMethod", "SignatureVersion", "Timestamp", "Signature"} {
		if _, ok := p1[k]; !ok {
			t.Errorf("missing required signed field %q", k)
		}
	}
	if p1["SignatureMethod"] != "HmacSHA256" {
		t.Errorf("SignatureMethod=%q", p1["SignatureMethod"])
	}
}

func TestSignatureChangesWithSecret(t *testing.T) {
	a, _ := BuildSignedParams("GET", "https://api.huobi.pro", "/v1/x",
		"AK", "secret1", nil, "2024-01-01T00:00:00")
	b, _ := BuildSignedParams("GET", "https://api.huobi.pro", "/v1/x",
		"AK", "secret2", nil, "2024-01-01T00:00:00")
	if a["Signature"] == b["Signature"] {
		t.Error("signature should differ with different secret")
	}
}

func TestSignatureChangesWithMethod(t *testing.T) {
	a, _ := BuildSignedParams("GET", "https://api.huobi.pro", "/v1/x",
		"AK", "SK", nil, "2024-01-01T00:00:00")
	b, _ := BuildSignedParams("POST", "https://api.huobi.pro", "/v1/x",
		"AK", "SK", nil, "2024-01-01T00:00:00")
	if a["Signature"] == b["Signature"] {
		t.Error("signature should differ between GET and POST")
	}
}

func TestEmptyValueDropped(t *testing.T) {
	p, _ := BuildSignedParams("GET", "https://api.huobi.pro", "/v1/x",
		"AK", "SK", map[string]string{"empty": "", "foo": "bar"},
		"2024-01-01T00:00:00")
	if _, ok := p["empty"]; ok {
		t.Error("empty-string param should be dropped")
	}
	if p["foo"] != "bar" {
		t.Error("non-empty param should survive")
	}
}

func TestUTCTimestampFormat(t *testing.T) {
	ts := UTCTimestamp()
	// Must be "YYYY-MM-DDTHH:MM:SS" — 19 chars, no fractional, no tz.
	if len(ts) != 19 {
		t.Fatalf("timestamp length=%d, want 19 (%q)", len(ts), ts)
	}
	if ts[4] != '-' || ts[7] != '-' || ts[10] != 'T' || ts[13] != ':' || ts[16] != ':' {
		t.Errorf("malformed timestamp %q", ts)
	}
}
