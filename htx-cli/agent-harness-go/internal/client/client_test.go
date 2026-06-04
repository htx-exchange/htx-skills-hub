package client

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"htx-cli/internal/config"
)

func newTestClient(baseSpot, baseFutures, ak, sk string) *Client {
	cfg := &config.Config{
		AccessKey:      ak,
		SecretKey:      sk,
		SpotBaseURL:    baseSpot,
		FuturesBaseURL: baseFutures,
	}
	return New(cfg)
}

func TestPublicGetParsesJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			t.Errorf("method=%s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"status":"ok","data":42}`)
	}))
	defer srv.Close()
	c := newTestClient(srv.URL, srv.URL, "", "")
	got, err := c.SpotPublicGet("/x", nil)
	if err != nil {
		t.Fatal(err)
	}
	m := got.(map[string]any)
	if m["status"] != "ok" {
		t.Errorf("envelope not parsed: %+v", m)
	}
}

func TestPrivateGetSignsRequest(t *testing.T) {
	var gotURL string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotURL = r.URL.String()
		_, _ = io.WriteString(w, `{"status":"ok"}`)
	}))
	defer srv.Close()
	c := newTestClient(srv.URL, srv.URL, "AK", "SK")
	if _, err := c.SpotPrivateGet("/v1/account/accounts", nil); err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"AccessKeyId=AK", "SignatureMethod=HmacSHA256",
		"SignatureVersion=2", "Signature=", "Timestamp="} {
		if !strings.Contains(gotURL, want) {
			t.Errorf("URL missing %q: %s", want, gotURL)
		}
	}
}

func TestHTTPErrorRaises(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "nope", http.StatusNotFound)
	}))
	defer srv.Close()
	c := newTestClient(srv.URL, srv.URL, "", "")
	_, err := c.SpotPublicGet("/x", nil)
	if err == nil {
		t.Fatal("expected error")
	}
	var he *HtxError
	if !errors.As(err, &he) || he.Status != 404 {
		t.Errorf("want 404 HtxError, got %v", err)
	}
}

func TestEnvelopeErrorRaises(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, `{"status":"error","err-msg":"boom"}`)
	}))
	defer srv.Close()
	c := newTestClient(srv.URL, srv.URL, "", "")
	_, err := c.SpotPublicGet("/x", nil)
	if err == nil || !strings.Contains(err.Error(), "boom") {
		t.Errorf("want boom, got %v", err)
	}
}

func TestPrivatePostSendsJSONBody(t *testing.T) {
	var bodyBytes []byte
	var gotURL string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		bodyBytes, _ = io.ReadAll(r.Body)
		gotURL = r.URL.String()
		_, _ = io.WriteString(w, `{"status":"ok"}`)
	}))
	defer srv.Close()
	c := newTestClient(srv.URL, srv.URL, "AK", "SK")
	if _, err := c.SpotPrivatePost("/v1/order/orders/place",
		map[string]any{"symbol": "btcusdt"}, nil); err != nil {
		t.Fatal(err)
	}
	var b map[string]any
	if err := json.Unmarshal(bodyBytes, &b); err != nil {
		t.Fatalf("body not JSON: %s", bodyBytes)
	}
	if b["symbol"] != "btcusdt" {
		t.Errorf("body missing symbol: %v", b)
	}
	if !strings.Contains(gotURL, "Signature=") {
		t.Errorf("URL not signed: %s", gotURL)
	}
}

func TestRequireAuthBeforePrivate(t *testing.T) {
	c := newTestClient("http://unused", "http://unused", "", "")
	_, err := c.SpotPrivateGet("/x", nil)
	if err == nil || !strings.Contains(err.Error(), "Missing credentials") {
		t.Errorf("want Missing credentials, got %v", err)
	}
}

func TestFuturesEnvelopeCodeError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, `{"code":1001,"msg":"signature invalid"}`)
	}))
	defer srv.Close()
	c := newTestClient(srv.URL, srv.URL, "", "")
	_, err := c.FuturesPublicGet("/x", nil)
	if err == nil || !strings.Contains(err.Error(), "1001") {
		t.Errorf("want code=1001 error, got %v", err)
	}
}
