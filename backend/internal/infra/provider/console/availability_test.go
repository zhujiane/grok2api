package console

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/chenyme/grok2api/backend/internal/domain/account"
	"github.com/chenyme/grok2api/backend/internal/infra/provider"
)

func TestUsageFailureChecksInferenceIndependently(t *testing.T) {
	for _, status := range []int{http.StatusOK, http.StatusUnauthorized, http.StatusForbidden, http.StatusServiceUnavailable} {
		t.Run(http.StatusText(status), func(t *testing.T) {
			var ttsCalls int
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if serveTestDPoPToken(t, w, r) {
					return
				}
				switch r.URL.Path {
				case workosLoginPath:
					http.Redirect(w, r, "https://authenticator.cursor.sh/?authorization_session_id=x", http.StatusFound)
				case "/api/auth/session":
					w.Header().Set("Content-Type", "application/json")
					io.WriteString(w, `{"session":{"cursorMerged":false}}`)
				case "/v1/tts":
					ttsCalls++
					verifyTestDPoPProof(t, r)
					if status == http.StatusOK {
						w.Header().Set("Content-Type", "audio/mpeg")
						io.WriteString(w, "ID3test-audio")
					} else {
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(status)
						io.WriteString(w, `{"error":"test rejection"}`)
					}
				default:
					http.NotFound(w, r)
				}
			}))
			defer server.Close()
			adapter, credential := newConsoleTestAdapter(t, server.URL)
			adapter.UpdateConfig(Config{BaseURL: server.URL, SessionBaseURL: server.URL, TimeoutSeconds: 5})
			snapshot, err := adapter.SyncQuota(context.Background(), credential)
			if ttsCalls == 0 {
				t.Fatal("no actual TTS request")
			}
			if status != http.StatusOK {
				if err == nil {
					t.Fatal("failed probe reported available")
				}
				if errors.Is(err, provider.ErrUnauthorized) != (status == http.StatusUnauthorized) {
					t.Fatalf("incorrect credential classification: %v", err)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if len(snapshot.Windows) != 3 {
				t.Fatalf("windows=%v", snapshot.Windows)
			}
			for _, window := range snapshot.Windows {
				if window.Source != account.QuotaSourceAvailability || window.Total != 0 || window.Remaining != 0 || window.ResetAt != nil || window.SyncedAt == nil {
					t.Fatalf("fabricated quota: %+v", window)
				}
			}
		})
	}
}
