import json
import os
import re
from pathlib import Path

from scholarly import scholarly


def normalize_title(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_author_publications(author_id: str) -> dict[str, int]:
    author = scholarly.search_author_id(author_id)
    scholarly.fill(author, sections=["basics", "indices", "counts", "publications"])
    pubs = author.get("publications") or []

    by_title: dict[str, int] = {}
    for pub in pubs:
        try:
            detailed = scholarly.fill(pub)
        except Exception:
            continue
        title = (detailed.get("bib") or {}).get("title") or ""
        citedby = int(detailed.get("num_citations") or detailed.get("citedby") or 0)
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

    scholar_map = load_author_publications(author_id)
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

    with (out_dir / "gs_publication_citations.json").open("w", encoding="utf-8") as f:
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
