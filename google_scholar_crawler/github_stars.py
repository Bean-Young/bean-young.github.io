# Sum stargazers across this user's public non-fork repos (same idea as before; style=social via shields endpoint on site).
import json
import os
import urllib.error
import urllib.request
from typing import Any, List, Optional, Tuple

OWNER = os.environ.get("GITHUB_REPOSITORY", "Bean-Young/bean-young.github.io").split("/")[0]
TOKEN = os.environ.get("GITHUB_TOKEN", "")
RESULTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")


def fetch_repos_page(url: str) -> Tuple[List[Any], Optional[str]]:
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read().decode())
            link = resp.headers.get("Link", "")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"GitHub API HTTP {e.code}: {e.read().decode()[:800]}") from e
    next_url = None
    for part in link.split(","):
        if 'rel="next"' in part:
            next_url = part.split(";")[0].strip().strip("<>")
            break
    return body, next_url


def main() -> None:
    total = 0
    url: Optional[str] = (
        f"https://api.github.com/users/{OWNER}/repos?per_page=100&type=owner"
    )
    while url:
        repos, url = fetch_repos_page(url)
        for repo in repos:
            if repo.get("fork"):
                continue
            total += int(repo.get("stargazers_count") or 0)

    os.makedirs(RESULTS_DIR, exist_ok=True)
    shieldio_data = {
        "schemaVersion": 1,
        "label": "stars",
        "message": str(total),
    }
    out_path = os.path.join(RESULTS_DIR, "github_stars_shieldsio.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(shieldio_data, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
