#!/usr/bin/env python3
"""Fast reusable smoke tests for selected /v1 media and responses endpoints."""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import sys
import time
from dataclasses import dataclass
from typing import Any

import aiohttp


DEFAULT_BASE_URL = "http://127.0.0.1:8000/"
DEFAULT_API_KEY = "grok2api"
DEFAULT_ENDPOINTS = (
    "images/generations",
    "images/edits",
    "videos",
    "responses",
    "videos/{id}",
)

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
)


@dataclass(slots=True)
class CaseResult:
    name: str
    method: str
    path: str
    status: int | None
    elapsed_ms: int
    outcome: str
    detail: str = ""


def _base_url(value: str) -> str:
    return value.rstrip("/")


def _headers(api_key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}"}


def _preview(text: str, limit: int) -> str:
    text = text.replace("\r", "\\r").replace("\n", "\\n")
    if len(text) <= limit:
        return text
    return text[:limit] + "...(truncated)"


def _json_preview(data: Any, limit: int) -> str:
    try:
        return _preview(
            json.dumps(data, ensure_ascii=False, separators=(",", ":")), limit
        )
    except TypeError:
        return _preview(str(data), limit)


async def _read_response(
    resp: aiohttp.ClientResponse, preview_chars: int
) -> tuple[Any, str]:
    text = await resp.text()
    content_type = resp.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            data = json.loads(text)
            return data, _json_preview(data, preview_chars)
        except json.JSONDecodeError:
            pass
    return None, _preview(text, preview_chars)


async def _request_json(
    session: aiohttp.ClientSession,
    *,
    method: str,
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any] | None = None,
    preview_chars: int,
) -> tuple[int, Any, str]:
    async with session.request(method, url, headers=headers, json=payload) as resp:
        data, preview = await _read_response(resp, preview_chars)
        return resp.status, data, preview


async def _request_form(
    session: aiohttp.ClientSession,
    *,
    url: str,
    headers: dict[str, str],
    fields: dict[str, str],
    files: list[tuple[str, str, bytes, str]] | None = None,
    preview_chars: int,
) -> tuple[int, Any, str]:
    form = aiohttp.FormData()
    for key, value in fields.items():
        form.add_field(key, value)
    for key, filename, data, content_type in files or []:
        form.add_field(key, data, filename=filename, content_type=content_type)
    async with session.post(url, headers=headers, data=form) as resp:
        data, preview = await _read_response(resp, preview_chars)
        return resp.status, data, preview


def _result(
    *,
    name: str,
    method: str,
    path: str,
    status: int | None,
    started: float,
    preview: str,
    ignore_403: bool,
) -> CaseResult:
    elapsed_ms = int((time.monotonic() - started) * 1000)
    if status is None:
        return CaseResult(name, method, path, status, elapsed_ms, "FAIL", preview)
    if status == 403 and ignore_403:
        return CaseResult(name, method, path, status, elapsed_ms, "SKIP", "403 ignored")
    if 200 <= status < 300:
        return CaseResult(name, method, path, status, elapsed_ms, "PASS", preview)
    return CaseResult(name, method, path, status, elapsed_ms, "FAIL", preview)


async def test_image_generations(
    session: aiohttp.ClientSession,
    args: argparse.Namespace,
) -> CaseResult:
    name = "images/generations"
    path = "/v1/images/generations"
    started = time.monotonic()
    payload = {
        "model": args.image_model,
        "prompt": args.prompt,
        "n": args.n,
        "size": args.image_size,
        "response_format": args.response_format,
    }
    try:
        status, _, preview = await _request_json(
            session,
            method="POST",
            url=f"{args.base_url}{path}",
            headers=_headers(args.api_key),
            payload=payload,
            preview_chars=args.preview_chars,
        )
    except Exception as exc:
        status, preview = None, f"{type(exc).__name__}: {exc}"
    return _result(
        name=name,
        method="POST",
        path=path,
        status=status,
        started=started,
        preview=preview,
        ignore_403=args.ignore_403,
    )


async def test_image_edits(
    session: aiohttp.ClientSession,
    args: argparse.Namespace,
) -> CaseResult:
    name = "images/edits"
    path = "/v1/images/edits"
    started = time.monotonic()
    try:
        status, _, preview = await _request_form(
            session,
            url=f"{args.base_url}{path}",
            headers=_headers(args.api_key),
            fields={
                "model": args.image_edit_model,
                "prompt": args.edit_prompt,
                "n": str(args.edit_n),
                "size": args.image_size,
                "response_format": args.response_format,
            },
            files=[("image[]", "tiny.png", TINY_PNG, "image/png")],
            preview_chars=args.preview_chars,
        )
    except Exception as exc:
        status, preview = None, f"{type(exc).__name__}: {exc}"
    return _result(
        name=name,
        method="POST",
        path=path,
        status=status,
        started=started,
        preview=preview,
        ignore_403=args.ignore_403,
    )


async def test_videos_create(
    session: aiohttp.ClientSession,
    args: argparse.Namespace,
) -> tuple[CaseResult, str | None]:
    name = "videos"
    path = "/v1/videos"
    started = time.monotonic()
    video_id = None
    try:
        status, data, preview = await _request_form(
            session,
            url=f"{args.base_url}{path}",
            headers=_headers(args.api_key),
            fields={
                "model": args.video_model,
                "prompt": args.video_prompt,
                "seconds": str(args.video_seconds),
                "size": args.video_size,
            },
            preview_chars=args.preview_chars,
        )
        if isinstance(data, dict):
            raw_id = data.get("id")
            video_id = raw_id if isinstance(raw_id, str) and raw_id else None
    except Exception as exc:
        status, preview = None, f"{type(exc).__name__}: {exc}"
    result = _result(
        name=name,
        method="POST",
        path=path,
        status=status,
        started=started,
        preview=preview,
        ignore_403=args.ignore_403,
    )
    return result, video_id


async def test_responses(
    session: aiohttp.ClientSession,
    args: argparse.Namespace,
) -> CaseResult:
    name = "responses"
    path = "/v1/responses"
    started = time.monotonic()
    payload = {
        "model": args.responses_model,
        "input": args.responses_input,
        "stream": False,
        "reasoning": {"effort": "none"},
    }
    try:
        status, _, preview = await _request_json(
            session,
            method="POST",
            url=f"{args.base_url}{path}",
            headers=_headers(args.api_key),
            payload=payload,
            preview_chars=args.preview_chars,
        )
    except Exception as exc:
        status, preview = None, f"{type(exc).__name__}: {exc}"
    return _result(
        name=name,
        method="POST",
        path=path,
        status=status,
        started=started,
        preview=preview,
        ignore_403=args.ignore_403,
    )


async def test_videos_retrieve(
    session: aiohttp.ClientSession,
    args: argparse.Namespace,
    video_id: str | None,
) -> CaseResult:
    name = "videos/{id}"
    path_template = "/v1/videos/{id}"
    resolved_id = args.video_id or video_id
    if not resolved_id:
        return CaseResult(
            name,
            "GET",
            path_template,
            None,
            0,
            "SKIP",
            "no video id; pass --video-id or include /v1/videos first",
        )

    path = f"/v1/videos/{resolved_id}"
    started = time.monotonic()
    try:
        status, _, preview = await _request_json(
            session,
            method="GET",
            url=f"{args.base_url}{path}",
            headers=_headers(args.api_key),
            preview_chars=args.preview_chars,
        )
    except Exception as exc:
        status, preview = None, f"{type(exc).__name__}: {exc}"
    return _result(
        name=name,
        method="GET",
        path=path,
        status=status,
        started=started,
        preview=preview,
        ignore_403=args.ignore_403,
    )


async def run(args: argparse.Namespace) -> list[CaseResult]:
    timeout = aiohttp.ClientTimeout(total=args.timeout)
    connector = aiohttp.TCPConnector(ssl=False)
    video_id: str | None = None
    results: list[CaseResult] = []
    async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
        for endpoint in args.endpoints:
            if endpoint == "images/generations":
                results.append(await test_image_generations(session, args))
            elif endpoint == "images/edits":
                results.append(await test_image_edits(session, args))
            elif endpoint == "videos":
                result, created_video_id = await test_videos_create(session, args)
                results.append(result)
                video_id = created_video_id or video_id
            elif endpoint == "responses":
                results.append(await test_responses(session, args))
            elif endpoint == "videos/{id}":
                results.append(await test_videos_retrieve(session, args, video_id))
            else:
                results.append(
                    CaseResult(
                        endpoint, "-", endpoint, None, 0, "FAIL", "unknown endpoint"
                    )
                )
    return results


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Smoke-test /v1/images, /v1/videos, and /v1/responses endpoints."
    )
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--api-key", default=DEFAULT_API_KEY)
    parser.add_argument(
        "--endpoint",
        action="append",
        dest="endpoints",
        choices=DEFAULT_ENDPOINTS,
        help="Endpoint to run. Repeat to select multiple. Defaults to all.",
    )
    parser.add_argument("--timeout", type=float, default=120.0)
    parser.add_argument("--preview-chars", type=int, default=500)
    parser.add_argument("--no-ignore-403", action="store_false", dest="ignore_403")
    parser.set_defaults(ignore_403=True)

    parser.add_argument("--prompt", default="A small red cube on a white table")
    parser.add_argument("--edit-prompt", default="Make the image brighter")
    parser.add_argument("--responses-input", default="Reply with the word ok.")
    parser.add_argument("--n", type=int, default=1)
    parser.add_argument("--edit-n", type=int, default=1)
    parser.add_argument("--image-size", default="1024x1024")
    parser.add_argument("--response-format", default="url", choices=("url", "b64_json"))

    parser.add_argument("--image-model", default="grok-imagine-image-lite")
    parser.add_argument("--image-edit-model", default="grok-imagine-image-edit")
    parser.add_argument("--video-model", default="grok-imagine-video")
    parser.add_argument("--responses-model", default="grok-4.20-0309-non-reasoning")

    parser.add_argument("--video-prompt", default="A calm sunrise over a city skyline")
    parser.add_argument("--video-seconds", type=int, default=6)
    parser.add_argument("--video-size", default="720x1280")
    parser.add_argument("--video-id", default="")
    parser.add_argument(
        "--json", action="store_true", help="Print machine-readable results."
    )

    args = parser.parse_args(argv)
    args.base_url = _base_url(args.base_url)
    args.endpoints = tuple(args.endpoints or DEFAULT_ENDPOINTS)
    return args


def print_results(results: list[CaseResult], *, as_json: bool) -> None:
    if as_json:
        print(json.dumps([r.__dict__ for r in results], ensure_ascii=False, indent=2))
        return

    for r in results:
        status = "-" if r.status is None else str(r.status)
        print(
            f"[{r.outcome}] {r.method:4} {r.path} status={status} elapsed={r.elapsed_ms}ms"
        )
        if r.detail:
            print(f"       {r.detail}")


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    results = asyncio.run(run(args))
    print_results(results, as_json=args.json)
    failures = [r for r in results if r.outcome == "FAIL"]
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
