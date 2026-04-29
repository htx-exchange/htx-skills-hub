package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// withClean sets HOME + XDG_CONFIG_HOME to a tmp dir and clears HTX_* envs.
func withClean(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", dir)
	t.Setenv("HOME", dir)
	for _, k := range []string{"HTX_API_KEY", "HTX_SECRET_KEY", "HTX_SPOT_BASE_URL", "HTX_FUTURES_BASE_URL"} {
		t.Setenv(k, "")
	}
	return dir
}

func TestLoadMissingReturnsDefaults(t *testing.T) {
	withClean(t)
	cfg, err := Load("")
	if err != nil {
		t.Fatal(err)
	}
	if cfg.SpotBaseURL != DefaultSpotBase {
		t.Errorf("SpotBaseURL=%q", cfg.SpotBaseURL)
	}
	if cfg.FuturesBaseURL != DefaultFuturesBase {
		t.Errorf("FuturesBaseURL=%q", cfg.FuturesBaseURL)
	}
	if cfg.AccessKey != "" || cfg.SecretKey != "" {
		t.Errorf("creds should be empty: %+v", cfg)
	}
}

func TestSaveRoundtrip(t *testing.T) {
	withClean(t)
	c := &Config{
		AccessKey:      "AK",
		SecretKey:      "SK",
		SpotBaseURL:    "https://custom.example/spot",
		FuturesBaseURL: "https://custom.example/futures",
	}
	p, err := c.Save("")
	if err != nil {
		t.Fatal(err)
	}
	// Verify file permissions (0o600 lower 9 bits only).
	fi, err := os.Stat(p)
	if err != nil {
		t.Fatal(err)
	}
	if perm := fi.Mode().Perm(); perm != 0o600 {
		t.Errorf("mode=%o, want 0600", perm)
	}
	// Reload
	got, err := Load("")
	if err != nil {
		t.Fatal(err)
	}
	if got.AccessKey != "AK" || got.SecretKey != "SK" {
		t.Errorf("creds not round-tripped: %+v", got)
	}
	if got.SpotBaseURL != "https://custom.example/spot" {
		t.Errorf("spot url not round-tripped: %q", got.SpotBaseURL)
	}
}

func TestEnvOverridesFile(t *testing.T) {
	withClean(t)
	c := &Config{AccessKey: "file-ak", SecretKey: "file-sk",
		SpotBaseURL: DefaultSpotBase, FuturesBaseURL: DefaultFuturesBase}
	if _, err := c.Save(""); err != nil {
		t.Fatal(err)
	}
	t.Setenv("HTX_API_KEY", "env-ak")
	t.Setenv("HTX_SECRET_KEY", "env-sk")
	got, _ := Load("")
	if got.AccessKey != "env-ak" || got.SecretKey != "env-sk" {
		t.Errorf("env should override: %+v", got)
	}
}

func TestRedactedFormat(t *testing.T) {
	c := &Config{
		AccessKey:      "abcdef1234567890",
		SecretKey:      "verysecret",
		SpotBaseURL:    DefaultSpotBase,
		FuturesBaseURL: DefaultFuturesBase,
	}
	m := c.Redacted()
	ak, _ := m["access_key"].(string)
	if !strings.HasPrefix(ak, "abcd") || !strings.HasSuffix(ak, "90") {
		t.Errorf("access_key redaction wrong: %q", ak)
	}
	if m["secret_key"] != "***REDACTED***" {
		t.Errorf("secret_key not redacted: %v", m["secret_key"])
	}
}

func TestRequireAuth(t *testing.T) {
	empty := &Config{}
	if err := empty.RequireAuth(); err == nil {
		t.Error("empty config should fail RequireAuth")
	}
	ok := &Config{AccessKey: "a", SecretKey: "b"}
	if err := ok.RequireAuth(); err != nil {
		t.Errorf("filled config should pass: %v", err)
	}
	if missing := (&Config{AccessKey: "a"}).RequireAuth(); missing == nil ||
		!strings.Contains(missing.Error(), "secret_key") {
		t.Errorf("expected secret_key in error: %v", missing)
	}
}

func TestDirUsesXDG(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	want := filepath.Join(tmp, "htx-cli")
	if got := Dir(); got != want {
		t.Errorf("Dir()=%q, want %q", got, want)
	}
}
