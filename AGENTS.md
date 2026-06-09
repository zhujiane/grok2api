Windows PowerShell 环境。rg 正则必须用单引号包裹，避免 |、<、>、()、@、\ 被 shell 误解析。

不要在 PowerShell 里使用 Bash heredoc/重定向写法（例如 `python - <<'PY'`），也不要用复杂的 `python -c` 长命令反复试错；PowerShell 会误解析引号、分号、重定向和缩进。需要运行多行 Python 时，优先使用项目已有脚本/测试；确实需要临时脚本时，创建临时 `.py` 文件后运行，结束再删除。
