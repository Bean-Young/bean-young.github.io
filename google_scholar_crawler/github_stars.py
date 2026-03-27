# Extra: total stars on your non-fork repos (not in upstream AcadHomepage).
import json
import sys
from pathlib import Path

import requests

USER = "Bean-Young"
OUT = Path(__file__).resolve().parent / "results" / "github_stars_shieldsio.json"


def main() -> None:
    total = 0
    page = 1
    while page <= 50:
        r = requests.get(
            f"https://api.github.com/users/{USER}/repos",
            params={"per_page": 100, "page": page},
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "Bean-Young-google-scholar-crawler",
            },
            timeout=30,
        )
        if r.status_code != 200:
            print(r.status_code, r.text[:300], file=sys.stderr)
            sys.exit(1)
        repos = r.json()
        if not repos:
            break
        for repo in repos:
            if not repo.get("fork"):
                total += int(repo.get("stargazers_count") or 0)
        if len(repos) < 100:
            break
        page += 1

    shieldio_data = {
        "schemaVersion": 1,
        "label": "stars",
        "message": str(total),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(shieldio_data, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(shieldio_data))


if __name__ == "__main__":
    main()
