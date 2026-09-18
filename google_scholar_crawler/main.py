# Based on https://github.com/RayeRen/acad-homepage.github.io/blob/main/google_scholar_crawler/main.py
# We do NOT pass section "publications" into scholarly.fill(): that triggers one (or many) requests
# per paper and often runs tens of minutes or looks “stuck” in GitHub Actions under Scholar rate limits.
from scholarly import scholarly
import json
from datetime import datetime
import os
from pathlib import Path
import time

RESULTS_DIR = Path(__file__).resolve().parent / "results"
RETRY_DELAYS = (10, 30)


def fetch_author(author_id: str) -> dict:
    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        try:
            author = scholarly.search_author_id(author_id)
            scholarly.fill(author, sections=["basics", "indices", "counts"])
            if not author.get("name"):
                raise RuntimeError("Google Scholar returned an incomplete author profile.")
            return author
        except Exception as exc:
            last_error = exc
            if attempt < len(RETRY_DELAYS):
                delay = RETRY_DELAYS[attempt]
                print(
                    f"Google Scholar request failed ({exc!r}); retrying in {delay}s.",
                    flush=True,
                )
                time.sleep(delay)
    raise RuntimeError("Google Scholar author profile is temporarily unavailable.") from last_error


def main() -> None:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    data_path = RESULTS_DIR / "gs_data.json"
    shield_path = RESULTS_DIR / "gs_data_shieldsio.json"

    try:
        author = fetch_author(os.environ["GOOGLE_SCHOLAR_ID"])
    except Exception as exc:
        if data_path.is_file() and shield_path.is_file():
            print(
                f"::warning::Google Scholar is temporarily unavailable; "
                f"keeping the last successful citation data. ({exc})"
            )
            return
        raise

    author["updated"] = str(datetime.now())
    pubs = author.get("publications") or []
    author["publications"] = (
        {v["author_pub_id"]: v for v in pubs} if pubs else {}
    )

    print(json.dumps(author, indent=2))
    with data_path.open("w", encoding="utf-8") as outfile:
        json.dump(author, outfile, ensure_ascii=False)

    shieldio_data = {
        "schemaVersion": 1,
        "label": "citations",
        "message": f"{author.get('citedby', 0)}",
    }
    with shield_path.open("w", encoding="utf-8") as outfile:
        json.dump(shieldio_data, outfile, ensure_ascii=False)


if __name__ == "__main__":
    main()
