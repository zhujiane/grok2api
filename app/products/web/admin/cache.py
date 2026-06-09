"""Local media cache management — stats, list, clear, delete."""

import asyncio
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.platform.config.snapshot import get_config
from app.platform.errors import AppError, ErrorKind
from app.platform.storage import (
    clear_local_media_files,
    delete_local_media_file,
    image_files_dir,
    video_files_dir,
)

router = APIRouter(prefix="/cache", tags=["Admin - Cache"])

# ---------------------------------------------------------------------------
# Lightweight local media cache service.
# ---------------------------------------------------------------------------
_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
_VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"}
_IMAGE_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
}
_VIDEO_MIME = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".m4v": "video/mp4",
    ".webm": "video/webm",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
}


class ClearCacheRequest(BaseModel):
    type: Literal["image", "video"] = "image"


class DeleteCacheItemRequest(BaseModel):
    type: Literal["image", "video"] = "image"
    name: str


class DeleteCacheItemsRequest(BaseModel):
    type: Literal["image", "video"] = "image"
    names: list[str]


def _dir(media_type: str) -> Path:
    return image_files_dir() if media_type == "image" else video_files_dir()


def _exts(media_type: str):
    return _IMAGE_EXTS if media_type == "image" else _VIDEO_EXTS


def _validate_name(media_type: str, name: str) -> str:
    value = (name or "").strip()
    if not value:
        raise AppError(
            "Missing file name",
            kind=ErrorKind.VALIDATION,
            code="missing_file_name",
            status=400,
        )
    if Path(value).name != value or Path(value).suffix.lower() not in _exts(media_type):
        raise AppError(
            "Invalid file name",
            kind=ErrorKind.VALIDATION,
            code="invalid_file_name",
            status=400,
        )
    return value


def _limit_mb(media_type: str) -> int:
    cfg = get_config()
    return max(0, int(cfg.get_int(f"cache.local.{media_type}_max_mb", 0)))


def _stats(media_type: str) -> dict[str, Any]:
    d = _dir(media_type)
    files = []
    if d.exists():
        allowed = _exts(media_type)
        files = [f for f in d.glob("*") if f.is_file() and f.suffix.lower() in allowed]

    total_size = sum(f.stat().st_size for f in files)
    limit_mb = _limit_mb(media_type)
    limit_bytes = limit_mb * 1024 * 1024
    usage_ratio = (total_size / limit_bytes) if limit_bytes > 0 else None
    usage_percent = round(usage_ratio * 100, 1) if usage_ratio is not None else None
    return {
        "count": len(files),
        "size_mb": round(total_size / 1024 / 1024, 2),
        "size_bytes": total_size,
        "limit_mb": limit_mb,
        "limit_bytes": limit_bytes,
        "limited": limit_bytes > 0,
        "usage_ratio": round(usage_ratio, 4) if usage_ratio is not None else None,
        "usage_percent": usage_percent,
    }


def _list_files(media_type: str, page: int, page_size: int) -> dict[str, Any]:
    d = _dir(media_type)
    if not d.exists():
        return {"total": 0, "page": page, "page_size": page_size, "items": []}
    allowed = _exts(media_type)
    files = sorted(
        (f for f in d.glob("*") if f.is_file() and f.suffix.lower() in allowed),
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )
    total = len(files)
    start = (page - 1) * page_size
    chunk = files[start : start + page_size]
    items = []
    for f in chunk:
        st = f.stat()
        items.append({
            "name": f.name,
            "size_bytes": st.st_size,
            "modified_at": st.st_mtime,
        })
    return {"total": total, "page": page, "page_size": page_size, "items": items}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("")
async def cache_stats():
    return {
        "local_image": _stats("image"),
        "local_video": _stats("video"),
    }


@router.get("/list")
async def list_local(
    cache_type: Literal["image", "video"] = "image",
    type_: Literal["image", "video"] | None = Query(default=None, alias="type"),
    page: int = 1,
    page_size: int = 1000,
):
    media_type = type_ or cache_type
    return {"status": "success", **_list_files(media_type, page, page_size)}


@router.get("/item/preview")
async def preview_local_item(
    cache_type: Literal["image", "video"] = "image",
    type_: Literal["image", "video"] | None = Query(default=None, alias="type"),
    name: str = "",
):
    media_type = type_ or cache_type
    safe_name = _validate_name(media_type, name)
    path = _dir(media_type) / safe_name
    if not path.is_file():
        raise AppError(
            "File not found",
            kind=ErrorKind.VALIDATION,
            code="file_not_found",
            status=404,
        )
    mime_map = _IMAGE_MIME if media_type == "image" else _VIDEO_MIME
    return FileResponse(
        path,
        media_type=mime_map.get(path.suffix.lower(), "application/octet-stream"),
        filename=safe_name,
        content_disposition_type="inline",
    )


@router.post("/clear")
async def clear_local(req: ClearCacheRequest):
    removed = await asyncio.to_thread(clear_local_media_files, req.type)
    return {"status": "success", "result": {"removed": removed}}


@router.post("/item/delete")
async def delete_local_item(req: DeleteCacheItemRequest):
    if not req.name:
        raise AppError(
            "Missing file name",
            kind=ErrorKind.VALIDATION,
            code="missing_file_name",
            status=400,
        )
    try:
        deleted = await asyncio.to_thread(delete_local_media_file, req.type, req.name)
    except ValueError as exc:
        raise AppError(
            str(exc),
            kind=ErrorKind.VALIDATION,
            code="invalid_file_name",
            status=400,
        ) from exc
    if not deleted:
        raise AppError(
            "File not found",
            kind=ErrorKind.VALIDATION,
            code="file_not_found",
            status=404,
        )
    return {"status": "success", "result": {"deleted": req.name}}


@router.post("/items/delete")
async def delete_local_items(req: DeleteCacheItemsRequest):
    names = [name.strip() for name in req.names if name and name.strip()]
    if not names:
        raise AppError(
            "Missing file names",
            kind=ErrorKind.VALIDATION,
            code="missing_file_names",
            status=400,
        )

    deleted = 0
    missing = 0

    for name in names:
        try:
            removed = await asyncio.to_thread(delete_local_media_file, req.type, name)
        except ValueError:
            missing += 1
            continue
        if removed:
            deleted += 1
        else:
            missing += 1

    return {
        "status": "success",
        "result": {
            "deleted": deleted,
            "missing": missing,
        },
    }
