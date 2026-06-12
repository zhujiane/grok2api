"""TOML configuration loader with environment-variable override support."""

import os
from pathlib import Path
from typing import Any, Mapping

import tomllib


def _flatten(mapping: dict[str, Any], prefix: str = "") -> dict[str, Any]:
    """Flatten a nested dict into dotted keys."""
    out: dict[str, Any] = {}
    for k, v in mapping.items():
        full = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(_flatten(v, full))
        else:
            out[full] = v
    return out


def _deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    """Recursively merge *override* into *base* (non-destructive)."""
    result = dict(base)
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = _deep_merge(result[k], v)
        else:
            result[k] = v
    return result


def _set_nested(data: dict[str, Any], parts: list[str], value: Any) -> None:
    node = data
    for part in parts[:-1]:
        child = node.setdefault(part, {})
        if not isinstance(child, dict):
            child = {}
            node[part] = child
        node = child
    node[parts[-1]] = value


def apply_prefixed_env(
    data: dict[str, Any],
    env: Mapping[str, str] | None = None,
    prefix: str = "GROK_",
) -> dict[str, Any]:
    """Apply ``GROK_`` environment overrides.

    The legacy form ``GROK_APP_API_KEY`` maps to ``app.api_key``.
    Use double underscores for deeper paths, e.g.
    ``GROK_PROXY__EGRESS__MODE`` maps to ``proxy.egress.mode``.
    """
    source = os.environ if env is None else env
    prefix_len = len(prefix)
    for env_key, env_val in source.items():
        if not env_key.startswith(prefix):
            continue

        raw_key = env_key[prefix_len:].lower()
        if "__" in raw_key:
            parts = [part for part in raw_key.split("__") if part]
            if parts:
                _set_nested(data, parts, env_val)
            continue

        parts = raw_key.split("_", 1)
        if len(parts) == 2:
            section, key = parts
            data.setdefault(section, {})[key] = env_val
    return data


def load_toml(path: Path) -> dict[str, Any]:
    """Load a TOML file and return the raw nested dict."""
    if not path.exists():
        return {}
    with open(path, "rb") as fh:
        return tomllib.load(fh)


def load_config(
    defaults_path: Path,
    user_path: Path | None = None,
    env_prefix: str = "GROK_",
) -> dict[str, Any]:
    """Load configuration: defaults → user file → environment overrides.

    Environment variables use ``GROK_SECTION_KEY=value`` for legacy two-level
    keys, or double underscores for nested paths such as
    ``GROK_PROXY__EGRESS__MODE=single_proxy``.
    """
    data = load_toml(defaults_path)
    if user_path and user_path.exists():
        user = load_toml(user_path)
        data = _deep_merge(data, user)

    return apply_prefixed_env(data, prefix=env_prefix)


def get_nested(data: dict[str, Any], dotted_key: str, default: Any = None) -> Any:
    """Retrieve a value from a nested dict using a dotted key path."""
    keys = dotted_key.split(".")
    node: Any = data
    for k in keys:
        if not isinstance(node, dict):
            return default
        node = node.get(k)
        if node is None:
            return default
    return node
