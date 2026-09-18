import json
import os
import re
from pathlib import Path
import time

from scholarly import scholarly

RETRY_DELAYS = (10, 30)
scholarly.set_timeout(20)


def normalize_title(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_author_publications(author_id: str) -> dict[str, int]:
    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        try:
            author = scholarly.search_author_id(author_id)
            scholarly.fill(author, sections=["publications"])
            break
        except Exception as exc:
            last_error = exc
            if attempt < len(RETRY_DELAYS):
                delay = RETRY_DELAYS[attempt]
                print(
                    f"Google Scholar publication request failed ({exc!r}); "
                    f"retrying in {delay}s.",
                    flush=True,
                )
                time.sleep(delay)
    else:
        raise RuntimeError(
            "Google Scholar publication data is temporarily unavailable."
        ) from last_error

    pubs = author.get("publications") or []

    by_title: dict[str, int] = {}
    for pub in pubs:
        title = (pub.get("bib") or {}).get("title") or ""
        citedby = int(pub.get("num_citations") or pub.get("citedby") or 0)
        key = normalize_title(title)
        if key:
            by_title[key] = max(by_title.get(key, 0), citedby)
    return by_title


def main() -> None:
    author_id = os.environ.get("GOOGLE_SCHOLAR_ID")
    if not author_id:
        raise RuntimeError("GOOGLE_SCHOLAR_ID is required.")

    repo_root = Path(__file__).resolve().parents[1]
    papers_path = repo_root / "paper-graph-viz" / "src" / "data" / "papers.json"
    out_dir = Path(__file__).resolve().parent / "results"
    out_dir.mkdir(parents=True, exist_ok=True)

    with papers_path.open("r", encoding="utf-8") as f:
        payload = json.load(f)

    result_path = out_dir / "gs_publication_citations.json"
    try:
        scholar_map = load_author_publications(author_id)
    except Exception as exc:
        if result_path.is_file():
            print(
                f"::warning::Google Scholar publication data is temporarily "
                f"unavailable; keeping the last successful paper citation data. ({exc})"
            )
            return
        raise
    updated = []
    unmatched = []

    for node in payload.get("nodes", []):
        if node.get("role") != "paper":
            continue
        scholar_title = node.get("scholarTitle")
        if not scholar_title:
            continue
        key = normalize_title(scholar_title)
        if key in scholar_map:
            old_val = int(node.get("citations", 0))
            node["citations"] = int(scholar_map[key])
            updated.append(
                {
                    "id": node.get("id"),
                    "title": scholar_title,
                    "old": old_val,
                    "new": node["citations"],
                }
            )
        else:
            unmatched.append({"id": node.get("id"), "title": scholar_title})

    with result_path.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "updated_count": len(updated),
                "updated": updated,
                "unmatched": unmatched,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"Fetched citations for {len(updated)} papers.")


if __name__ == "__main__":
    main()
