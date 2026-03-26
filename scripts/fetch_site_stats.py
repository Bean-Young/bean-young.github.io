#!/usr/bin/env python3
"""Update stats.json and Shields.io endpoint JSON (Scholar via scholarly + GitHub API)."""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "stats.json"
SHIELDS_DIR = ROOT / "shields"
SCHOLAR_USER_ID = os.environ.get("GOOGLE_SCHOLAR_ID") or "SBZ_9bAAAAAJ"
SCHOLAR_URL = f"https://scholar.google.com/citations?user={SCHOLAR_USER_ID}&hl=en"
GITHUB_USER = "Bean-Young"
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


def fetch_scholar_citations_scholarly() -> int | None:
    """Same idea as acad-homepage google_scholar_crawler/main.py (scholarly library)."""
    try:
        from scholarly import scholarly

        author = scholarly.search_author_id(SCHOLAR_USER_ID)
        scholarly.fill(author, sections=["basics", "indices", "counts", "publications"])
        cited = author.get("citedby")
        if cited is None:
            return None
        return int(cited)
    except Exception as exc:
        print(f"Scholarly failed: {exc}", file=sys.stderr)
        return None


def fetch_scholar_citations_html() -> int | None:
    try:
        r = requests.get(SCHOLAR_URL, headers=HEADERS, timeout=45)
        r.raise_for_status()
    except requests.RequestException as exc:
        print(f"Scholar HTML request failed: {exc}", file=sys.stderr)
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


def fetch_scholar_citations() -> int | None:
    s = fetch_scholar_citations_scholarly()
    if s is not None:
        return s
    return fetch_scholar_citations_html()


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


def write_shield(
    path: Path,
    label: str,
    message: str,
    color: str,
    named_logo: str | None = None,
) -> None:
    data: dict = {
        "schemaVersion": 1,
        "label": label,
        "message": message,
        "color": color,
    }
    if named_logo:
        data["namedLogo"] = named_logo
    path.write_text(json.dumps(data, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    existing = load_existing()
    citations_raw = fetch_scholar_citations()
    stars_raw = fetch_github_stars()

    cit_ok = citations_raw is not None
    star_ok = stars_raw is not None

    citations = citations_raw if cit_ok else existing.get("citations")
    stars = stars_raw if star_ok else existing.get("githubStars")

    out: dict = {
        "scholarProfile": SCHOLAR_URL,
        "githubRepos": f"https://github.com/{GITHUB_USER}?tab=repositories",
        "citations": citations,
        "githubStars": stars,
    }

    # Avoid committing every push when only the clock would change (prevents workflow loops).
    metrics_changed = (cit_ok and citations_raw != existing.get("citations")) or (
        star_ok and stars_raw != existing.get("githubStars")
    )
    if cit_ok or star_ok:
        if metrics_changed or not existing.get("updated"):
            out["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            out["updated"] = existing.get("updated")
    elif existing.get("updated"):
        out["updated"] = existing["updated"]
    else:
        out["updated"] = None

    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    SHIELDS_DIR.mkdir(parents=True, exist_ok=True)
    cite_msg = (
        f"{int(citations):,}"
        if isinstance(citations, int)
        else ("—" if citations is None else str(citations))
    )
    stars_msg = (
        f"{int(stars):,}"
        if isinstance(stars, int)
        else ("—" if stars is None else str(stars))
    )
    write_shield(
        SHIELDS_DIR / "scholar-citations.json",
        "Scholar citations",
        cite_msg,
        "4285F4",
        "googlescholar",
    )
    write_shield(
        SHIELDS_DIR / "github-stars.json",
        "GitHub stars",
        stars_msg,
        "181717",
        "github",
    )

    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
