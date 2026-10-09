package web

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/chenyme/grok2api/backend/internal/domain/account"
	infraegress "github.com/chenyme/grok2api/backend/internal/infra/egress"
	"github.com/chenyme/grok2api/backend/internal/infra/provider"
	"github.com/chenyme/grok2api/backend/internal/infra/security"
)

func TestGenerateVideoUploadsReferencesWithoutFirstFrame(t *testing.T) {
	const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
	for _, count := range []int{1, 2} {
		t.Run(fmt.Sprintf("%d references", count), func(t *testing.T) {
			uploads := 0
			var payload map[string]any
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				switch r.URL.Path {
				case "/http/upload-file-v2/direct":
					uploads++
					if err := r.ParseMultipartForm(1 << 20); err != nil {
						t.Errorf("parse uploaded reference: %v", err)
						w.WriteHeader(http.StatusBadRequest)
						return
					}
					defer r.MultipartForm.RemoveAll()
					if r.FormValue("file_source") != imagineSelfUploadSource || len(r.MultipartForm.File["file"]) != 1 {
						t.Errorf("invalid reference upload: %#v", r.MultipartForm)
					}
					w.Header().Set("Content-Type", "application/json")
					fmt.Fprintf(w, `{"fileMetadata":{"fileMetadataId":"ref-%d"}}`, uploads)
				case "/rest/app-chat/conversations/new":
					if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
						t.Errorf("decode generation: %v", err)
					}
					w.Header().Set("Content-Type", "text/event-stream")
					io.WriteString(w, "data: {\"result\":{\"response\":{\"streamingVideoGenerationResponse\":{\"progress\":100,\"mode\":\"reference\",\"videoUrl\":\"/videos/ref.mp4\"}}}}\n\n")
				default:
					http.NotFound(w, r)
				}
			}))
			defer server.Close()
			cipher, err := security.NewCipher(base64.StdEncoding.EncodeToString(make([]byte, 32)))
			if err != nil {
				t.Fatal(err)
			}
			accessToken, err := cipher.Encrypt("test-sso")
			if err != nil {
				t.Fatal(err)
			}
			adapter := NewAdapter(Config{BaseURL: server.URL, StatsigMode: "manual", StatsigManualValue: "test", VideoTimeoutSeconds: 5, FreeVideoDurationCap: 6}, infraegress.NewManager(egressRepositoryStub{}, cipher), cipher, nil, nil)
			refs := make([]string, count)
			for i := range refs {
				refs[i] = png
			}
			result, err := adapter.GenerateVideo(context.Background(), provider.VideoRequest{
				Credential: account.Credential{ID: 1, Provider: account.ProviderWeb, WebTier: account.WebTierBasic, EncryptedAccessToken: accessToken},
				Prompt:     "follow the storyboard", Duration: 10, AspectRatio: "16:9", Resolution: "480p", ReferenceURLs: refs,
			})
			if err != nil || result.URL != "https://assets.grok.com/videos/ref.mp4" {
				t.Fatalf("result=%#v err=%v", result, err)
			}
			media, _ := payload["mediaGenInput"].(map[string]any)
			ref, _ := media["referenceToVideo"].(map[string]any)
			assets, _ := ref["inputAssets"].([]any)
			if uploads != count || len(assets) != count || len(media) != 1 || ref["prompt"] != "follow the storyboard" || ref["duration"] != float64(6) || ref["resolutionName"] != "480p" || ref["aspectRatio"] != "16:9" {
				t.Fatalf("uploads=%d payload=%#v", uploads, payload)
			}
			for i, asset := range assets {
				if asset != fmt.Sprintf("ref-%d", i+1) {
					t.Fatalf("reference order: %#v", assets)
				}
			}
			for _, field := range []string{"firstFrameAsset", "lastFrameAsset", "useFirstFrame"} {
				if _, exists := ref[field]; exists {
					t.Fatalf("reference video unexpectedly pins a frame: %#v", ref)
				}
			}
		})
	}
}

func TestGenerateVideoRejectsInvalidReferenceInputsBeforeUpstream(t *testing.T) {
	for _, request := range []provider.VideoRequest{
		{ReferenceURLs: []string{"test"}, Prompt: "test", ImageURL: "test"},
		{ReferenceURLs: []string{"test"}, Prompt: " "},
		{ReferenceURLs: []string{"test"}, Prompt: "test", Resolution: "1080p"},
		{ReferenceAudios: []string{"voice"}, Prompt: "test"},
	} {
		adapter := NewAdapter(Config{}, nil, nil, nil, nil)
		_, err := adapter.GenerateVideo(context.Background(), request)
		if stage, ok := provider.VideoErrorStage(err); !ok || stage != provider.VideoStagePrepare {
			t.Fatalf("request=%#v error=%v stage=%s", request, err, stage)
		}
	}
}
