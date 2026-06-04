// Package auth implements HTX HMAC-SHA256 request signing.
// Mirrors cli_anything/htx/core/auth.py.
package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/url"
	"sort"
	"strings"
	"time"
)

// UTCTimestamp returns "YYYY-MM-DDTHH:MM:SS" in UTC. Matches Python's
// datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S").
func UTCTimestamp() string {
	return time.Now().UTC().Format("2006-01-02T15:04:05")
}

// RFC3986Encode percent-encodes per RFC 3986 unreserved-set:
// A-Z a-z 0-9 - . _ ~ are left alone; everything else becomes %XX.
// This differs from url.QueryEscape (uses '+' for space) and matches
// Python's urllib.parse.quote(s, safe="").
func RFC3986Encode(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if isUnreserved(c) {
			b.WriteByte(c)
		} else {
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
}

func isUnreserved(c byte) bool {
	switch {
	case c >= 'A' && c <= 'Z':
		return true
	case c >= 'a' && c <= 'z':
		return true
	case c >= '0' && c <= '9':
		return true
	case c == '-' || c == '.' || c == '_' || c == '~':
		return true
	}
	return false
}

// BuildSignedParams returns params (as a string->string map) with the HTX
// signing fields (AccessKeyId, SignatureMethod, SignatureVersion, Timestamp,
// Signature) added. The returned map is suitable for passing to URL query
// composition. nil values in the input are dropped.
//
// If timestamp is empty, UTCTimestamp() is used.
func BuildSignedParams(
	method, baseURL, path, accessKey, secretKey string,
	params map[string]string,
	timestamp string,
) (map[string]string, error) {
	if timestamp == "" {
		timestamp = UTCTimestamp()
	}

	signed := make(map[string]string, len(params)+5)
	for k, v := range params {
		// Python drops None values; Go uses "" as sentinel for nil.
		// Callers that want to send a literal empty string should pass " "
		// — but the Python CLI never does that, so this matches behavior.
		if v == "" {
			continue
		}
		signed[k] = v
	}
	signed["AccessKeyId"] = accessKey
	signed["SignatureMethod"] = "HmacSHA256"
	signed["SignatureVersion"] = "2"
	signed["Timestamp"] = timestamp

	u, err := url.Parse(baseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid baseURL %q: %w", baseURL, err)
	}
	host := u.Host

	keys := make([]string, 0, len(signed))
	for k := range signed {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var qs strings.Builder
	for i, k := range keys {
		if i > 0 {
			qs.WriteByte('&')
		}
		qs.WriteString(RFC3986Encode(k))
		qs.WriteByte('=')
		qs.WriteString(RFC3986Encode(signed[k]))
	}

	preSigned := strings.ToUpper(method) + "\n" + host + "\n" + path + "\n" + qs.String()

	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(preSigned))
	signed["Signature"] = base64.StdEncoding.EncodeToString(mac.Sum(nil))
	return signed, nil
}
