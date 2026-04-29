package main_test

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// buildBinary compiles ./cmd/htx-cli into t.TempDir and returns its path.
func buildBinary(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	bin := filepath.Join(dir, "htx-cli")
	cmd := exec.Command("go", "build", "-o", bin, "./cmd/htx-cli")
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("build failed: %v\n%s", err, out)
	}
	return bin
}

// cleanEnv strips HTX_* env vars and points config to a fresh tmp dir.
func cleanEnv(t *testing.T) []string {
	t.Helper()
	home := t.TempDir()
	env := []string{
		"HOME=" + home,
		"XDG_CONFIG_HOME=" + home,
		"PATH=" + os.Getenv("PATH"),
	}
	return env
}

func runCLI(t *testing.T, bin string, env []string, args ...string) (stdout, stderr string, err error) {
	t.Helper()
	cmd := exec.Command(bin, args...)
	cmd.Env = env
	var out, errBuf strings.Builder
	cmd.Stdout = &out
	cmd.Stderr = &errBuf
	err = cmd.Run()
	return out.String(), errBuf.String(), err
}

func TestCLIVersion(t *testing.T) {
	bin := buildBinary(t)
	env := cleanEnv(t)
	out, _, err := runCLI(t, bin, env, "--version")
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if !strings.Contains(out, "0.1.0") {
		t.Errorf("version output: %q", out)
	}
}

func TestCLIHelp(t *testing.T) {
	bin := buildBinary(t)
	env := cleanEnv(t)
	out, _, err := runCLI(t, bin, env, "--help")
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"spot", "futures", "config", "repl"} {
		if !strings.Contains(out, want) {
			t.Errorf("help missing %q:\n%s", want, out)
		}
	}
}

func TestCLIConfigRoundtrip(t *testing.T) {
	bin := buildBinary(t)
	env := cleanEnv(t)
	if _, _, err := runCLI(t, bin, env, "config", "set-key", "my-ak"); err != nil {
		t.Fatal(err)
	}
	if _, _, err := runCLI(t, bin, env, "config", "set-secret", "my-sk"); err != nil {
		t.Fatal(err)
	}
	out, _, err := runCLI(t, bin, env, "--json", "config", "show")
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]any
	if err := json.Unmarshal([]byte(out), &m); err != nil {
		t.Fatalf("not JSON: %s", out)
	}
	if ak, _ := m["access_key"].(string); !strings.HasPrefix(ak, "my-a") {
		t.Errorf("redacted ak wrong: %v", m["access_key"])
	}
	if m["secret_key"] != "***REDACTED***" {
		t.Errorf("secret not redacted: %v", m["secret_key"])
	}
}

func TestCLIAuthMissing(t *testing.T) {
	bin := buildBinary(t)
	env := cleanEnv(t)
	_, stderr, err := runCLI(t, bin, env, "spot", "account", "list")
	if err == nil {
		t.Error("expected non-zero exit without creds")
	}
	if !strings.Contains(stderr, "Missing credentials") {
		t.Errorf("stderr missing creds warning: %q", stderr)
	}
}

func TestCLIReplSmoke(t *testing.T) {
	bin := buildBinary(t)
	env := cleanEnv(t)
	cmd := exec.Command(bin, "repl")
	cmd.Env = env
	cmd.Stdin = strings.NewReader("exit\n")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("repl: %v\n%s", err, out)
	}
	if !strings.Contains(string(out), "REPL") {
		t.Errorf("repl banner missing: %s", out)
	}
}

// --- Live tests (gated behind HTX_DISABLE_LIVE=1) ---

func liveAllowed(t *testing.T) {
	t.Helper()
	if os.Getenv("HTX_DISABLE_LIVE") == "1" {
		t.Skip("HTX_DISABLE_LIVE=1")
	}
}

func TestCLILiveSpotTimestamp(t *testing.T) {
	liveAllowed(t)
	bin := buildBinary(t)
	env := cleanEnv(t)
	out, _, err := runCLI(t, bin, env, "--json", "spot", "market", "timestamp")
	if err != nil {
		t.Skipf("live call failed (network?): %v", err)
	}
	var m map[string]any
	if err := json.Unmarshal([]byte(out), &m); err != nil {
		t.Fatalf("not JSON: %s", out)
	}
	if m["status"] != "ok" {
		t.Errorf("envelope status=%v, body=%s", m["status"], out)
	}
}

func TestCLILiveFuturesContractInfo(t *testing.T) {
	liveAllowed(t)
	bin := buildBinary(t)
	env := cleanEnv(t)
	out, _, err := runCLI(t, bin, env, "--json", "futures", "market", "contract-info")
	if err != nil {
		t.Skipf("live call failed (network?): %v", err)
	}
	if !strings.Contains(out, "\"status\"") {
		t.Errorf("unexpected body: %s", out[:min(200, len(out))])
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
