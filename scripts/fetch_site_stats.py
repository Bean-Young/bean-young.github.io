#!/usr/bin/env python3
"""Write stats.json from Google Scholar profile and GitHub public repos (non-fork)."""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

SCHOLAR_URL = "https://scholar.google.com/citations?user=SBZ_9bAAAAAJ&hl=en"
GITHUB_USER = "Bean-Young"
OUT = Path(__file__).resolve().parent.parent / "stats.json"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; Bean-Young-site-stats/1.0; +https://bean-young.github.io)"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def load_existing() -> dict:
    if not OUT.exists():
        return {}
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def fetch_scholar_citations() -> int | None:
    try:
        r = requests.get(SCHOLAR_URL, headers=HEADERS, timeout=45)
        r.raise_for_status()
    except requests.RequestException as exc:
        print(f"Scholar request failed: {exc}", file=sys.stderr)
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    cells = soup.select("table#gsc_rsb_st td.gsc_rsb_std")
    if cells:
        raw = cells[0].get_text(strip=True).replace(",", "")
        if raw.isdigit():
            return int(raw)

    for td in soup.select("td.gsc_rsb_std"):
        raw = td.get_text(strip=True).replace(",", "")
        if raw.isdigit():
            return int(raw)

    m = re.search(r"gsc_rsb_std[^>]*>([\d,]+)<", r.text)
    if m:
        raw = m.group(1).replace(",", "")
        if raw.isdigit():
            return int(raw)

    print("Could not parse Scholar citations from HTML", file=sys.stderr)
    return None


def fetch_github_stars() -> int | None:
    total = 0
    page = 1
    try:
        while page <= 50:
            r = requests.get(
                f"https://api.github.com/users/{GITHUB_USER}/repos",
                params={"per_page": 100, "page": page},
                headers={
                    "Accept": "application/vnd.github+json",
                    "User-Agent": HEADERS["User-Agent"],
                },
                timeout=30,
            )
            if r.status_code != 200:
                print(
                    f"GitHub API {r.status_code}: {r.text[:300]}",
                    file=sys.stderr,
                )
                return None
            repos = r.json()
            if not repos:
                break
            for repo in repos:
                if not repo.get("fork"):
                    total += int(repo.get("stargazers_count") or 0)
            if len(repos) < 100:
                break
            page += 1
        return total
    except requests.RequestException as exc:
        print(f"GitHub request failed: {exc}", file=sys.stderr)
        return None


def main() -> None:
    existing = load_existing()
    citations = fetch_scholar_citations()
    stars = fetch_github_stars()

    cit_ok = citations is not None
    star_ok = stars is not None

    out: dict = {
        "scholarProfile": SCHOLAR_URL,
        "githubRepos": f"https://github.com/{GITHUB_USER}?tab=repositories",
        "citations": citations if cit_ok else existing.get("citations"),
        "githubStars": stars if star_ok else existing.get("githubStars"),
    }

    if cit_ok or star_ok:
        out["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    elif existing.get("updated"):
        out["updated"] = existing["updated"]
    else:
        out["updated"] = None

    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
