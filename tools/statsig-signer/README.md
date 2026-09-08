# grok2api Statsig signer

Local replacement for `https://grok.wodf.de/sign`. grok2api already fetches
`grok-site-verification` itself; this service only returns `x-statsig-id`.

Playwright keeps a grok.com tab alive (through WARP + FlareSolverr) and harvests
the live Statsig fingerprint. Signing itself is local and must stay under the
gateway's 12s signer timeout.

## Compose

```bash
docker compose up -d --build statsig-signer
```

Then in the grok2api admin UI: **Settings → Grok Web**

- x-statsig source: `URL`
- Signer URL: `http://statsig-signer:8788/sign`

Host mapping is `127.0.0.1:8788` so the SSO API is not public.

## SSO

```bash
curl -sS http://127.0.0.1:8788/v1/sso \
  -X PUT -H 'Content-Type: application/json' \
  -d '{"sso":"YOUR_SSO_TOKEN"}'
```

A full cookie header also works:

```bash
curl -sS http://127.0.0.1:8788/v1/sso \
  -X PUT -H 'Content-Type: application/json' \
  -d '{"cookies":"sso=...; sso-rw=...; cf_clearance=..."}'
```

If `STATSIG_SIGNER_TOKEN` is set, send `Authorization: Bearer <token>` on
`/v1/sso` and `/v1/refresh`. `/sign` stays unauthenticated for grok2api.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/sign` | grok2api contract: `{method,path,environment.metaContent}` → `{x-statsig-id}` |
| `PUT`/`POST` | `/v1/sso` | Create or replace login cookies |
| `GET` | `/v1/sso` | Redacted SSO status |
| `DELETE` | `/v1/sso` | Clear stored SSO |
| `POST` | `/v1/refresh` | Reload grok.com and recapture HEX |
| `GET` | `/v1/status` | Browser / HEX / proxy health |
| `GET` | `/healthz` | Liveness |
| `GET` | `/readyz` | Ready once HEX has been captured |

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `LISTEN` | `0.0.0.0:8788` | Bind address |
| `GROK_BASE_URL` | `https://grok.com` | Page used to harvest HEX |
| `PROXY_URL` | `socks5://warp:1080` | Playwright + FlareSolverr egress |
| `FLARESOLVERR_URL` | `http://flaresolverr:8191` | Cloudflare clearance |
| `STATSIG_SIGNER_TOKEN` | empty | Bearer token for SSO/refresh |
| `DATA_DIR` | `/data` | Persisted SSO JSON |
| `REFRESH_INTERVAL` | `10m` | Periodic page reload |
| `HEADLESS` | `true` | Playwright headless mode |
