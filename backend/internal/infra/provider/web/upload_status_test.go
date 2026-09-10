package web

import (
	"context"
	"errors"
	"io"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	fhttp "github.com/bogdanfinn/fhttp"
	fhttptest "github.com/bogdanfinn/fhttp/httptest"
	domainegress "github.com/chenyme/grok2api/backend/internal/domain/egress"
	"github.com/chenyme/grok2api/backend/internal/infra/provider"
)

func TestDirectUploadWaitsForFileMetadata(t *testing.T) {
	for _, outcome := range []string{"SUCCESS", "ERROR", "ABORTED", "EXPIRED", "timeout", "http_error", "invalid_json"} {
		t.Run(outcome, func(t *testing.T) {
			var polls atomic.Int32
			server := fhttptest.NewServer(fhttp.HandlerFunc(func(w fhttp.ResponseWriter, r *fhttp.Request) {
				if r.URL.Path == "/http/upload-file-v2/direct" {
					_, _ = io.WriteString(w, `{"uploadId":"job-1"}`)
					return
				}
				if r.URL.Path != "/rest/app-chat/upload-file-v2/status" || r.URL.Query().Get("uploadId") != "job-1" {
					t.Errorf("unexpected request: %s", r.URL)
					w.WriteHeader(404)
					return
				}
				if !strings.Contains(r.Header.Get("Cookie"), "sso=test-sso") {
					t.Error("missing upload status authentication")
				}
				count := polls.Add(1)
				if outcome == "http_error" {
					w.WriteHeader(503)
					return
				}
				if outcome == "invalid_json" {
					_, _ = io.WriteString(w, `{`)
					return
				}
				if count == 1 || outcome == "timeout" {
					_, _ = io.WriteString(w, `{"status":"PROCESSING"}`)
					return
				}
				if outcome == "SUCCESS" {
					_, _ = io.WriteString(w, `{"status":"SUCCESS","fileMetadata":{"fileMetadataId":"final-file-1","fileUri":"users/test/content"}}`)
				} else {
					_, _ = io.WriteString(w, `{"status":"`+outcome+`"}`)
				}
			}))
			defer server.Close()
			adapter, credential := testMediaAdapter(t, server.URL)
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if outcome == "timeout" {
				var timeoutCancel context.CancelFunc
				ctx, timeoutCancel = context.WithTimeout(ctx, 80*time.Millisecond)
				defer timeoutCancel()
			}
			lease, err := adapter.egress.AcquireCredential(ctx, domainegress.ScopeWeb, credential)
			if err != nil {
				t.Fatal(err)
			}
			defer lease.Release()
			uploaded, err := adapter.uploadFileV2Direct(ctx, adapter.config(), lease, "test-sso", provider.ImageInput{Filename: "image.png", MIMEType: "image/png", Data: []byte("fixture")}, server.URL+"/", "", "chat_attachment_upload")
			if outcome == "SUCCESS" {
				if err != nil || uploaded.ID != "final-file-1" || uploaded.MetadataID != "final-file-1" || polls.Load() != 2 {
					t.Fatalf("uploaded=%#v polls=%d err=%v", uploaded, polls.Load(), err)
				}
			} else {
				if err == nil || uploaded.ID != "" {
					t.Fatalf("failed upload accepted: %#v err=%v", uploaded, err)
				}
				if outcome == "timeout" && !errors.Is(err, context.DeadlineExceeded) {
					t.Fatalf("timeout error=%v", err)
				}
			}
		})
	}
}
