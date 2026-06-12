"""Persistent storage for OpenAI-compatible video jobs."""

import asyncio
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Any, Protocol, runtime_checkable

import orjson
import sqlalchemy as sa
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from app.control.account.backends.factory import (
    _get_env,
    _get_required_env,
    _resolve_local_db_path,
    get_repository_backend,
)
from app.control.account.backends.sql import create_mysql_engine, create_pgsql_engine
from app.platform.runtime.clock import now_ms

_TBL = "video_jobs"
_KEY_RECORD = "video_jobs:record:{video_id}"


@runtime_checkable
class VideoJobStore(Protocol):
    async def initialize(self) -> None:
        ...

    async def get(self, video_id: str) -> dict[str, Any] | None:
        ...

    async def put(self, video_id: str, payload: dict[str, Any]) -> None:
        ...


class LocalVideoJobStore:
    """SQLite-backed video job store, using the configured local DB path."""

    def __init__(self, db_path: Path) -> None:
        self._path = Path(db_path)
        self._lock = asyncio.Lock()
        self._initialized = False

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA busy_timeout=5000")
        return conn

    def _init_sync(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self._connect()) as conn:
            conn.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {_TBL} (
                    id         TEXT    PRIMARY KEY,
                    payload    BLOB    NOT NULL,
                    updated_at INTEGER NOT NULL
                )
                """
            )
            conn.commit()

    async def initialize(self) -> None:
        if self._initialized:
            return
        async with self._lock:
            if self._initialized:
                return
            await asyncio.to_thread(self._init_sync)
            self._initialized = True

    def _get_sync(self, video_id: str) -> dict[str, Any] | None:
        with closing(self._connect()) as conn:
            row = conn.execute(
                f"SELECT payload FROM {_TBL} WHERE id = ?",
                (video_id,),
            ).fetchone()
        if row is None:
            return None
        data = orjson.loads(row["payload"])
        return data if isinstance(data, dict) else None

    async def get(self, video_id: str) -> dict[str, Any] | None:
        await self.initialize()
        return await asyncio.to_thread(self._get_sync, video_id)

    def _put_sync(self, video_id: str, payload: dict[str, Any]) -> None:
        with closing(self._connect()) as conn:
            conn.execute(
                f"""
                INSERT INTO {_TBL} (id, payload, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    payload = excluded.payload,
                    updated_at = excluded.updated_at
                """,
                (video_id, orjson.dumps(payload), now_ms()),
            )
            conn.commit()

    async def put(self, video_id: str, payload: dict[str, Any]) -> None:
        await self.initialize()
        async with self._lock:
            await asyncio.to_thread(self._put_sync, video_id, payload)


class RedisVideoJobStore:
    """Redis-backed video job store."""

    def __init__(self, redis: Redis) -> None:
        self._r = redis

    async def initialize(self) -> None:
        return None

    async def get(self, video_id: str) -> dict[str, Any] | None:
        raw = await self._r.get(_KEY_RECORD.format(video_id=video_id))
        if not raw:
            return None
        data = orjson.loads(raw)
        return data if isinstance(data, dict) else None

    async def put(self, video_id: str, payload: dict[str, Any]) -> None:
        await self._r.set(_KEY_RECORD.format(video_id=video_id), orjson.dumps(payload))


metadata = sa.MetaData()

video_jobs_table = sa.Table(
    _TBL,
    metadata,
    sa.Column("id", sa.String(128), primary_key=True),
    sa.Column("payload", sa.Text, nullable=False),
    sa.Column("updated_at", sa.BigInteger, nullable=False),
)


class SqlVideoJobStore:
    """SQLAlchemy-backed video job store for MySQL and PostgreSQL."""

    def __init__(self, engine: AsyncEngine, *, dialect: str) -> None:
        self._engine = engine
        self._dialect = dialect
        self._session = async_sessionmaker(engine, expire_on_commit=False)
        self._initialized = False
        self._init_lock = asyncio.Lock()

    async def initialize(self) -> None:
        if self._initialized:
            return
        async with self._init_lock:
            if self._initialized:
                return
            async with self._engine.begin() as conn:
                await conn.run_sync(metadata.create_all)
            self._initialized = True

    async def get(self, video_id: str) -> dict[str, Any] | None:
        await self.initialize()
        async with self._session() as session:
            result = await session.execute(
                sa.select(video_jobs_table.c.payload).where(
                    video_jobs_table.c.id == video_id
                )
            )
            raw = result.scalar()
        if not raw:
            return None
        data = orjson.loads(raw)
        return data if isinstance(data, dict) else None

    def _build_upsert(self, video_id: str, payload: dict[str, Any]):
        row = {
            "id": video_id,
            "payload": orjson.dumps(payload).decode(),
            "updated_at": now_ms(),
        }
        if self._dialect == "postgresql":
            from sqlalchemy.dialects.postgresql import insert

            stmt = insert(video_jobs_table).values(**row)
            return stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "payload": stmt.excluded.payload,
                    "updated_at": stmt.excluded.updated_at,
                },
            )

        from sqlalchemy.dialects.mysql import insert

        stmt = insert(video_jobs_table).values(**row)
        return stmt.on_duplicate_key_update(
            payload=stmt.inserted.payload,
            updated_at=stmt.inserted.updated_at,
        )

    async def put(self, video_id: str, payload: dict[str, Any]) -> None:
        await self.initialize()
        async with self._session() as session:
            async with session.begin():
                await session.execute(self._build_upsert(video_id, payload))


_STORE: VideoJobStore | None = None
_STORE_LOCK = asyncio.Lock()


async def get_video_job_store() -> VideoJobStore:
    global _STORE
    if _STORE is not None:
        return _STORE
    async with _STORE_LOCK:
        if _STORE is not None:
            return _STORE
        backend = get_repository_backend()
        if backend == "local":
            store: VideoJobStore = LocalVideoJobStore(_resolve_local_db_path())
        elif backend == "redis":
            store = RedisVideoJobStore(
                Redis.from_url(_get_required_env("ACCOUNT_REDIS_URL"), decode_responses=False)
            )
        elif backend == "mysql":
            store = SqlVideoJobStore(
                create_mysql_engine(_get_env("ACCOUNT_MYSQL_URL")),
                dialect="mysql",
            )
        elif backend == "postgresql":
            store = SqlVideoJobStore(
                create_pgsql_engine(_get_env("ACCOUNT_POSTGRESQL_URL")),
                dialect="postgresql",
            )
        else:
            raise ValueError(f"Unknown video job storage backend: {backend!r}")
        await store.initialize()
        _STORE = store
        return store


__all__ = ["VideoJobStore", "get_video_job_store"]
