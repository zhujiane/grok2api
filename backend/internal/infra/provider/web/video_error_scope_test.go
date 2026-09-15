package web

import (
	"net/http"
	"testing"

	"github.com/chenyme/grok2api/backend/internal/infra/provider"
)

// TestWebMediaUpstreamErrorRequestScopedClassification 锁定视频 403 的归因：
// 签名失效（code=7）与内容审核属于请求级拒绝，换号/换出口都无解；Cloudflare
// 挑战、账号封禁与额度问题仍交给账号、出口或额度逻辑处理。
func TestWebMediaUpstreamErrorRequestScopedClassification(t *testing.T) {
	tests := []struct {
		name string
		body string
		want bool
	}{
		{
			name: "statsig code 7 reload",
			body: `{"code":7,"message":"This page is out of date. Reload to continue.","details":[]}`,
			want: true,
		},
		{
			name: "anti-bot message",
			body: `{"code":7,"message":"anti-bot rejection"}`,
			want: true,
		},
		{
			name: "content moderation",
			body: `{"error":{"code":"content-moderated","message":"rejected"}}`,
			want: true,
		},
		{
			name: "safety rejection",
			body: `{"message":"Content violates usage guidelines"}`,
			want: true,
		},
		{
			name: "definitive account block stays account scoped",
			body: `{"code":7,"message":"User is blocked [WKE=unauthorized:blocked-user]","details":[]}`,
			want: false,
		},
		{
			name: "cloudflare challenge stays egress scoped",
			body: `<html><title>Just a moment...</title><div id="challenge-platform"></div></html>`,
			want: false,
		},
		{
			name: "empty body stays egress scoped",
			body: ``,
			want: false,
		},
		{
			name: "unknown json rejection stays unclassified",
			body: `{"message":"temporary rejection"}`,
			want: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			upstreamErr := newWebMediaUpstreamError(http.StatusForbidden, []byte(test.body), false)
			if got := provider.IsRequestScopedError(upstreamErr); got != test.want {
				t.Fatalf("IsRequestScopedError() = %v, want %v (body=%q)", got, test.want, test.body)
			}
		})
	}
}

func TestWebMediaUpstreamErrorNonForbiddenIsNotRequestScoped(t *testing.T) {
	upstreamErr := newWebMediaUpstreamError(http.StatusTooManyRequests, []byte(`{"code":7,"message":"page is out of date"}`), false)
	if provider.IsRequestScopedError(upstreamErr) {
		t.Fatalf("non-403 status was classified request-scoped: %v", upstreamErr)
	}
}
