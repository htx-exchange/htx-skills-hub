// Package config manages the htx-cli JSON config file and env-var overrides.
// Mirrors cli_anything/htx/core/config.py.
package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const (
	DefaultSpotBase    = "https://api.huobi.pro"
	DefaultFuturesBase = "https://api.hbdm.com"
)

// Config holds credentials and endpoint URLs. The JSON tags match the on-disk
// format written by the Python version so the two CLIs can share a config file.
type Config struct {
	AccessKey        string `json:"access_key"`
	SecretKey        string `json:"secret_key"`
	SpotBaseURL      string `json:"spot_base_url"`
	FuturesBaseURL   string `json:"futures_base_url"`
	DefaultAccountID string `json:"default_account_id"`
}

// Dir returns the directory that holds config.json.
// Honors XDG_CONFIG_HOME, falls back to ~/.config.
func Dir() string {
	base := os.Getenv("XDG_CONFIG_HOME")
	if base == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			home = "."
		}
		base = filepath.Join(home, ".config")
	}
	return filepath.Join(base, "htx-cli")
}

// Path returns the full path to config.json.
func Path() string {
	return filepath.Join(Dir(), "config.json")
}

// New returns a Config populated with defaults.
func New() *Config {
	return &Config{
		SpotBaseURL:    DefaultSpotBase,
		FuturesBaseURL: DefaultFuturesBase,
	}
}

// Load reads from `path` (or Path() if empty) and then applies env-var
// overrides. Missing files are not an error; defaults are returned.
func Load(path string) (*Config, error) {
	if path == "" {
		path = Path()
	}
	cfg := New()

	if raw, err := os.ReadFile(path); err == nil {
		// On-disk values override defaults; ignore JSON errors (match Python behavior).
		_ = json.Unmarshal(raw, cfg)
		// If the file was empty/corrupt and wiped SpotBaseURL/FuturesBaseURL, restore.
		if cfg.SpotBaseURL == "" {
			cfg.SpotBaseURL = DefaultSpotBase
		}
		if cfg.FuturesBaseURL == "" {
			cfg.FuturesBaseURL = DefaultFuturesBase
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		// Unexpected I/O error — surface it.
		return nil, err
	}

	// Env-var overrides (applied after file load, not persisted).
	if v := os.Getenv("HTX_API_KEY"); v != "" {
		cfg.AccessKey = v
	}
	if v := os.Getenv("HTX_SECRET_KEY"); v != "" {
		cfg.SecretKey = v
	}
	if v := os.Getenv("HTX_SPOT_BASE_URL"); v != "" {
		cfg.SpotBaseURL = v
	}
	if v := os.Getenv("HTX_FUTURES_BASE_URL"); v != "" {
		cfg.FuturesBaseURL = v
	}
	return cfg, nil
}

// Save writes the config as pretty-printed JSON with mode 0o600.
// Creates parent directories as needed.
func (c *Config) Save(path string) (string, error) {
	if path == "" {
		path = Path()
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return "", err
	}
	raw, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return "", err
	}
	raw = append(raw, '\n')
	if err := os.WriteFile(path, raw, 0o600); err != nil {
		return "", err
	}
	// WriteFile honors the mode only on create; explicit chmod for replacements.
	_ = os.Chmod(path, 0o600)
	return path, nil
}

// Redacted returns a display-safe map (access_key shortened, secret_key masked).
// Uses an ordered slice so that output remains deterministic in human mode.
type RedactedEntry struct {
	Key   string
	Value any
}

// RedactedOrdered returns key/value pairs in stable display order.
func (c *Config) RedactedOrdered() []RedactedEntry {
	ak := any(c.AccessKey)
	if s := c.AccessKey; s != "" {
		ak = redactAccessKey(s)
	}
	sk := any(c.SecretKey)
	if c.SecretKey != "" {
		sk = "***REDACTED***"
	}
	defAcct := any(c.DefaultAccountID)
	if c.DefaultAccountID == "" {
		defAcct = nil
	}
	if c.AccessKey == "" {
		ak = nil
	}
	if c.SecretKey == "" {
		sk = nil
	}
	return []RedactedEntry{
		{"access_key", ak},
		{"secret_key", sk},
		{"spot_base_url", c.SpotBaseURL},
		{"futures_base_url", c.FuturesBaseURL},
		{"default_account_id", defAcct},
	}
}

// Redacted returns a map form (for JSON output).
func (c *Config) Redacted() map[string]any {
	out := map[string]any{}
	for _, e := range c.RedactedOrdered() {
		out[e.Key] = e.Value
	}
	return out
}

func redactAccessKey(s string) string {
	// Match Python: first 4 chars + "…" + last 2 chars.
	if len(s) <= 6 {
		return s
	}
	return s[:4] + "…" + s[len(s)-2:]
}

// RequireAuth returns an error if access_key or secret_key is missing.
func (c *Config) RequireAuth() error {
	var missing []string
	if c.AccessKey == "" {
		missing = append(missing, "access_key")
	}
	if c.SecretKey == "" {
		missing = append(missing, "secret_key")
	}
	if len(missing) == 0 {
		return nil
	}
	return fmt.Errorf(
		"Missing credentials: %s. Set via `htx-cli config set-key/set-secret` or env vars HTX_API_KEY/HTX_SECRET_KEY.",
		strings.Join(missing, ", "),
	)
}
