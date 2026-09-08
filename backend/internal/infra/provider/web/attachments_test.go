package web

import (
	"bytes"
	"context"
	"encoding/base64"
	"net/netip"
	"strings"
	"testing"

	"github.com/chenyme/grok2api/backend/internal/infra/provider"
)

type rebindingImageResolver struct {
	calls int
}

func (r *rebindingImageResolver) LookupNetIP(context.Context, string, string) ([]netip.Addr, error) {
	r.calls++
	if r.calls == 1 {
		return []netip.Addr{netip.MustParseAddr("93.184.216.34")}, nil
	}
	return []netip.Addr{netip.MustParseAddr("127.0.0.1")}, nil
}

func TestRemoteImageTargetPinsFirstValidatedResolution(t *testing.T) {
	resolver := &rebindingImageResolver{}
	target, err := validateRemoteImageURLWithResolver(context.Background(), "https://images.example.test/photo.png?size=large", resolver)
	if err != nil {
		t.Fatal(err)
	}
	if resolver.calls != 1 {
		t.Fatalf("resolver calls = %d, want 1", resolver.calls)
	}
	if target.originalURL.Host != "images.example.test" || target.fetchURL.Host != "93.184.216.34:443" {
		t.Fatalf("target = %#v", target)
	}
	if target.hostHeader != "images.example.test" || target.serverName != "images.example.test" {
		t.Fatalf("host=%q serverName=%q", target.hostHeader, target.serverName)
	}
	if target.fetchURL.Path != "/photo.png" || target.fetchURL.RawQuery != "size=large" {
		t.Fatalf("fetch URL = %s", target.fetchURL)
	}
}

func TestRemoteImageTargetRejectsAnyPrivateResolution(t *testing.T) {
	resolver := staticImageResolver{addresses: []netip.Addr{
		netip.MustParseAddr("93.184.216.34"),
		netip.MustParseAddr("10.0.0.8"),
	}}
	if _, err := validateRemoteImageURLWithResolver(context.Background(), "https://images.example.test/photo.png", resolver); err == nil {
		t.Fatal("mixed public and private DNS result was accepted")
	}
}

type staticImageResolver struct {
	addresses []netip.Addr
}

func (r staticImageResolver) LookupNetIP(context.Context, string, string) ([]netip.Addr, error) {
	return append([]netip.Addr(nil), r.addresses...), nil
}

func TestValidatedChatFileMIMEAcceptsVideoContainers(t *testing.T) {
	mp4 := append([]byte{0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm'}, bytes.Repeat([]byte{0x01}, 64)...)
	quicktime := append([]byte{0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p', 'q', 't', ' ', ' '}, bytes.Repeat([]byte{0x01}, 64)...)
	webm := append([]byte{0x1A, 0x45, 0xDF, 0xA3}, bytes.Repeat([]byte{0x02}, 64)...)
	for _, testCase := range []struct {
		name     string
		data     []byte
		declared string
		filename string
		want     string
	}{
		{name: "mp4", data: mp4, declared: "video/mp4", filename: "clip.mp4", want: "video/mp4"},
		{name: "mp4_octet", data: mp4, declared: "application/octet-stream", filename: "clip.mp4", want: "video/mp4"},
		{name: "mov", data: quicktime, declared: "video/quicktime", filename: "clip.mov", want: "video/quicktime"},
		{name: "webm", data: webm, declared: "video/webm", filename: "clip.webm", want: "video/webm"},
	} {
		got, err := validatedChatFileMIME(testCase.data, testCase.declared, testCase.filename)
		if err != nil || got != testCase.want {
			t.Errorf("%s: got=%q err=%v want=%q", testCase.name, got, err, testCase.want)
		}
	}
	if _, err := validatedChatFileMIME([]byte("not a video"), "video/mp4", "clip.mp4"); err == nil || !strings.Contains(err.Error(), "不是有效视频内容") {
		t.Fatalf("invalid video content error=%v", err)
	}
}

func TestParseChatFileDataURIAcceptsVideo(t *testing.T) {
	payload := append([]byte{0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm'}, bytes.Repeat([]byte{0x01}, 64)...)
	value := "data:video/mp4;base64," + base64.StdEncoding.EncodeToString(payload)
	file, err := parseChatFileDataURI(value, "clip.mp4", 1<<20)
	if err != nil || file.MIMEType != "video/mp4" || file.Filename != "clip.mp4" || !bytes.Equal(file.Data, payload) {
		t.Fatalf("file=%#v err=%v", file, err)
	}
	limited, err := limitChatFileByType(file, 32, maxChatVideoBytes)
	if err != nil || limited.MIMEType != "video/mp4" {
		t.Fatalf("video should use the video size cap: %#v err=%v", limited, err)
	}
	if _, err := limitChatFileByType(provider.ImageInput{MIMEType: "application/pdf", Data: bytes.Repeat([]byte("a"), 64)}, 32, maxChatVideoBytes); err == nil {
		t.Fatal("oversized document was accepted under the video cap")
	}
}
