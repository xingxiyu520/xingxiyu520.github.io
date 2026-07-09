from pathlib import Path


def title_from_markdown(content: str, fallback_filename: str) -> str:
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped.removeprefix("# ").strip()
            if title:
                return title[:220]

    return Path(fallback_filename).stem[:220] or "Untitled"
