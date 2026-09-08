import http from "node:http";

import { log } from "./log.js";
import { parseSsoInput, publicSsoView } from "./store.js";
import { generateStatsigID, validStatsigID } from "./statsig.js";

const MAX_BODY_BYTES = 64 * 1024;

export function createServer(config, store, session) {
  const server = http.createServer((request, response) => {
    handle(request, response).catch((error) => {
      log.error("request_failed", { path: request.url, error: error.message });
      send(response, 500, { error: { message: "internal_error" } });
    });
  });

  async function handle(request, response) {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const path = url.pathname.replace(/\/+$/u, "") || "/";
    if (request.method === "GET" && (path === "/healthz" || path === "/")) {
      send(response, 200, { ok: true });
      return;
    }
    if (request.method === "GET" && path === "/readyz") {
      const hex = session.currentHex();
      send(response, hex ? 200 : 503, { ready: Boolean(hex) });
      return;
    }
    if (request.method === "GET" && path === "/v1/status") {
      send(response, 200, await session.status());
      return;
    }
    if (request.method === "POST" && path === "/sign") {
      await sign(request, response);
      return;
    }
    if (path === "/v1/sso") {
      if (!authorize(request, response)) {
        return;
      }
      if (request.method === "GET") {
        send(response, 200, publicSsoView(await store.load()));
        return;
      }
      if (request.method === "PUT" || request.method === "POST") {
        await updateSso(request, response);
        return;
      }
      if (request.method === "DELETE") {
        await store.clear();
        await session.enqueueRefresh("sso_cleared");
        send(response, 200, { cleared: true });
        return;
      }
    }
    if (request.method === "POST" && path === "/v1/refresh") {
      if (!authorize(request, response)) {
        return;
      }
      await session.enqueueRefresh("api");
      send(response, 200, await session.status());
      return;
    }
    send(response, 404, { error: { message: "not_found" } });
  }

  async function sign(request, response) {
    const body = await readJSON(request);
    const method = String(body?.method || "").trim();
    const path = String(body?.path || "").trim();
    const metaContent = String(body?.environment?.metaContent || body?.metaContent || "").trim();
    if (!method || !path || !metaContent) {
      send(response, 400, { error: { message: "method、path、environment.metaContent 均为必填" } });
      return;
    }
    const hex = session.currentHex();
    if (!hex) {
      send(response, 503, { error: { message: "Statsig HEX 尚未就绪，请先配置 SSO 或等待刷新" } });
      return;
    }
    try {
      const statsigID = generateStatsigID({ method, path, metaContent, hex });
      if (!validStatsigID(statsigID)) {
        send(response, 502, { error: { message: "签名结果无效" } });
        return;
      }
      send(response, 200, { "x-statsig-id": statsigID });
    } catch (error) {
      send(response, 400, { error: { message: error.message } });
    }
  }

  async function updateSso(request, response) {
    const body = await readJSON(request);
    let parsed;
    try {
      parsed = parseSsoInput(body);
    } catch (error) {
      send(response, 400, { error: { message: error.message } });
      return;
    }
    const saved = await store.save(parsed);
    await session.enqueueRefresh("sso_updated");
    send(response, 200, publicSsoView(saved));
  }

  function authorize(request, response) {
    if (!config.token) {
      return true;
    }
    const header = String(request.headers.authorization || "");
    const expected = `Bearer ${config.token}`;
    if (header !== expected) {
      send(response, 401, { error: { message: "unauthorized" } });
      return false;
    }
    return true;
  }

  return server;
}

async function readJSON(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error("请求体过大");
    }
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    return {};
  }
  return JSON.parse(raw);
}

function send(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(payload);
}
