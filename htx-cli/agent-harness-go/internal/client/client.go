// Package client implements the HTTP layer for the HTX REST API.
// Mirrors cli_anything/htx/core/client.py.
package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"htx-cli/internal/auth"
	"htx-cli/internal/config"
	"htx-cli/internal/version"
)

// HtxError is returned on transport, HTTP or HTX-envelope errors.
type HtxError struct {
	Message string
	Status  int
	Payload any
}

func (e *HtxError) Error() string { return e.Message }

// Client wraps net/http.Client with HTX signing and envelope parsing.
type Client struct {
	cfg     *config.Config
	HTTP    *http.Client
	Timeout time.Duration
}

// New creates a Client with a 15-second timeout (matches Python).
func New(cfg *config.Config) *Client {
	t := 15 * time.Second
	return &Client{
		cfg:     cfg,
		Timeout: t,
		HTTP:    &http.Client{Timeout: t},
	}
}

// do executes the request, reads the body, and applies envelope checks.
func (c *Client) do(method, rawURL string, body []byte) (any, error) {
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequest(strings.ToUpper(method), rawURL, reader)
	if err != nil {
		return nil, &HtxError{Message: err.Error()}
	}
	req.Header.Set("User-Agent", version.UserAgent)
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, &HtxError{Message: "network error: " + err.Error()}
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var data any
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &data); err != nil {
			// Non-JSON response: surface as string
			data = string(raw)
		}
	}

	if resp.StatusCode >= 400 {
		return nil, &HtxError{
			Message: fmt.Sprintf("HTTP %d", resp.StatusCode),
			Status:  resp.StatusCode,
			Payload: data,
		}
	}

	// HTX-level error envelope (matches Python).
	if m, ok := data.(map[string]any); ok {
		if s, _ := m["status"].(string); s == "error" {
			msg, _ := m["err-msg"].(string)
			if msg == "" {
				msg, _ = m["err_msg"].(string)
			}
			if msg == "" {
				msg = "api error"
			}
			return nil, &HtxError{
				Message: "API error: " + msg,
				Status:  resp.StatusCode,
				Payload: data,
			}
		}
		if codeV, ok := m["code"]; ok {
			// JSON numbers unmarshal into float64.
			if code, ok := codeV.(float64); ok && int(code) != 200 {
				_, hasData := m["data"]
				_, hasStatus := m["status"]
				if !hasData && !hasStatus {
					msg, _ := m["msg"].(string)
					return nil, &HtxError{
						Message: fmt.Sprintf("API error: code=%d msg=%s", int(code), msg),
						Status:  resp.StatusCode,
						Payload: data,
					}
				}
			}
		}
	}
	return data, nil
}

// compose joins base + path, appending params as a standard URL query string.
func compose(base, path string, params map[string]string) string {
	u := strings.TrimRight(base, "/") + "/" + strings.TrimLeft(path, "/")
	if len(params) == 0 {
		return u
	}
	values := url.Values{}
	for k, v := range params {
		if v == "" {
			continue
		}
		values.Set(k, v)
	}
	sep := "?"
	if strings.Contains(u, "?") {
		sep = "&"
	}
	return u + sep + values.Encode()
}

// --- Spot ---

func (c *Client) SpotPublicGet(path string, params map[string]string) (any, error) {
	return c.do("GET", compose(c.cfg.SpotBaseURL, path, params), nil)
}

func (c *Client) SpotPrivateGet(path string, params map[string]string) (any, error) {
	if err := c.cfg.RequireAuth(); err != nil {
		return nil, err
	}
	signed, err := auth.BuildSignedParams("GET", c.cfg.SpotBaseURL, path,
		c.cfg.AccessKey, c.cfg.SecretKey, params, "")
	if err != nil {
		return nil, err
	}
	return c.do("GET", compose(c.cfg.SpotBaseURL, path, signed), nil)
}

func (c *Client) SpotPrivatePost(path string, body, query map[string]any) (any, error) {
	if err := c.cfg.RequireAuth(); err != nil {
		return nil, err
	}
	signed, err := auth.BuildSignedParams("POST", c.cfg.SpotBaseURL, path,
		c.cfg.AccessKey, c.cfg.SecretKey, stringifyMap(query), "")
	if err != nil {
		return nil, err
	}
	if body == nil {
		body = map[string]any{}
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	return c.do("POST", compose(c.cfg.SpotBaseURL, path, signed), payload)
}

// --- Futures ---

func (c *Client) FuturesPublicGet(path string, params map[string]string) (any, error) {
	return c.do("GET", compose(c.cfg.FuturesBaseURL, path, params), nil)
}

func (c *Client) FuturesPrivateGet(path string, params map[string]string) (any, error) {
	if err := c.cfg.RequireAuth(); err != nil {
		return nil, err
	}
	signed, err := auth.BuildSignedParams("GET", c.cfg.FuturesBaseURL, path,
		c.cfg.AccessKey, c.cfg.SecretKey, params, "")
	if err != nil {
		return nil, err
	}
	return c.do("GET", compose(c.cfg.FuturesBaseURL, path, signed), nil)
}

func (c *Client) FuturesPrivatePost(path string, body, query map[string]any) (any, error) {
	if err := c.cfg.RequireAuth(); err != nil {
		return nil, err
	}
	signed, err := auth.BuildSignedParams("POST", c.cfg.FuturesBaseURL, path,
		c.cfg.AccessKey, c.cfg.SecretKey, stringifyMap(query), "")
	if err != nil {
		return nil, err
	}
	if body == nil {
		body = map[string]any{}
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	return c.do("POST", compose(c.cfg.FuturesBaseURL, path, signed), payload)
}

// stringifyMap converts a map[string]any to map[string]string for signing.
// nil values are dropped; other values use %v.
func stringifyMap(m map[string]any) map[string]string {
	if len(m) == 0 {
		return nil
	}
	out := make(map[string]string, len(m))
	for k, v := range m {
		if v == nil {
			continue
		}
		out[k] = fmt.Sprintf("%v", v)
	}
	return out
}
