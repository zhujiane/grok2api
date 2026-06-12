from app.platform.config.loader import apply_prefixed_env


def test_prefixed_env_supports_nested_double_underscore_overrides():
    data = {
        "proxy": {
            "egress": {
                "mode": "direct",
                "proxy_url": "",
            },
        },
    }

    apply_prefixed_env(
        data,
        env={
            "GROK_PROXY__EGRESS__MODE": "single_proxy",
            "GROK_PROXY__EGRESS__PROXY_URL": "http://127.0.0.1:40080",
        },
    )

    assert data["proxy"]["egress"]["mode"] == "single_proxy"
    assert data["proxy"]["egress"]["proxy_url"] == "http://127.0.0.1:40080"


def test_prefixed_env_keeps_legacy_two_level_overrides():
    data = {"app": {"api_key": ""}}

    apply_prefixed_env(data, env={"GROK_APP_API_KEY": "secret"})

    assert data["app"]["api_key"] == "secret"
