# Produces gs_data.json + gs_data_shieldsio.json for branch google-scholar-stats.
# Google Scholar often returns 403 from GitHub Actions IPs — we fall back to Jina Reader, then OpenAlex.
import json
import os
import re
import sys
from datetime import datetime

import requests
from bs4 import BeautifulSoup

_scholar_id = (os.environ.get("GOOGLE_SCHOLAR_ID") or "").strip()
if not _scholar_id:
    raise SystemExit(
        "Set repository secret GOOGLE_SCHOLAR_ID (Scholar profile user=... id)."
    )

SCHOLAR_URL = f"https://scholar.google.com/citations?user={_scholar_id}&hl=en"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def parse_citations_html(html: str) -> int | None:
    soup = BeautifulSoup(html, "html.parser")
    cells = soup.select("table#gsc_rsb_st td.gsc_rsb_std")
    if cells:
        raw = cells[0].get_text(strip=True).replace(",", "")
        if raw.isdigit():
            return int(raw)
    for td in soup.select("td.gsc_rsb_std"):
        raw = td.get_text(strip=True).replace(",", "")
        if raw.isdigit():
            return int(raw)
    m = re.search(r"gsc_rsb_std[^>]*>([\d,]+)<", html)
    if m:
        raw = m.group(1).replace(",", "")
        if raw.isdigit():
            return int(raw)
    return None


def parse_citations_plain(text: str) -> int | None:
    """Heuristic for Jina / markdown-like dumps of a Scholar profile."""
    for pat in (
        r"(?i)\bcitations\b[^\d]{0,40}(\d[\d,]*)",
        r"(?i)all[\s-]*time[^\d]{0,80}(\d[\d,]*)",
        r"\|\s*Citations\s*\|\s*(\d[\d,\s]*)\s*\|",
    ):
        m = re.search(pat, text)
        if m:
            raw = m.group(1).replace(",", "").replace(" ", "")
            if raw.isdigit():
                return int(raw)
    return None


def fetch_scholar_direct() -> tuple[int | None, str]:
    try:
        r = requests.get(SCHOLAR_URL, headers=HEADERS, timeout=60)
        if r.status_code == 403:
            print("Scholar: direct request got 403 (blocked IP).", file=sys.stderr)
            return None, "blocked"
        r.raise_for_status()
    except requests.RequestException as exc:
        print(f"Scholar: direct request failed: {exc}", file=sys.stderr)
        return None, "error"
    n = parse_citations_html(r.text)
    return n, "google_scholar" if n is not None else "parse_failed"


def fetch_scholar_jina() -> tuple[int | None, str]:
    jina = "https://r.jina.ai/" + SCHOLAR_URL
    try:
        r = requests.get(
            jina,
            headers={**HEADERS, "X-Return-Format": "markdown"},
            timeout=120,
        )
        r.raise_for_status()
    except requests.RequestException as exc:
        print(f"Jina Reader fallback failed: {exc}", file=sys.stderr)
        return None, "error"
    n = parse_citations_plain(r.text) or parse_citations_html(r.text)
    return n, "google_scholar_jina" if n is not None else "parse_failed"


def fetch_openalex_citedby() -> tuple[int | None, str]:
    raw = (os.environ.get("OPENALEX_ORCID") or "").strip()
    if not raw:
        return None, "skipped"
    oid = raw.rsplit("/", 1)[-1].strip()
    if not re.fullmatch(r"\d{4}-\d{4}-\d{4}-\d{3}[\dXx]", oid) and not re.fullmatch(
        r"\d{4}-\d{4}-\d{4}-\d{4}", oid
    ):
        print(
            "OPENALEX_ORCID must look like 0000-0002-1234-5678 (set in repo Variables).",
            file=sys.stderr,
        )
        return None, "bad_orcid"
    url = "https://api.openalex.org/authors"
    for filt in (f"orcid:https://orcid.org/{oid}", f"orcid:{oid}"):
        try:
            r = requests.get(url, params={"filter": filt}, timeout=45)
            r.raise_for_status()
            results = (r.json() or {}).get("results") or []
            if not results:
                continue
            c = results[0].get("cited_by_count")
            if c is not None:
                return int(c), "openalex"
        except requests.RequestException as exc:
            print(f"OpenAlex request failed ({filt}): {exc}", file=sys.stderr)
            return None, "error"
    print("OpenAlex: no author matched this ORCID.", file=sys.stderr)
    return None, "not_found"


def resolve_citations() -> tuple[int, str]:
    n, src = fetch_scholar_direct()
    if n is not None:
        return n, src

    print("Trying Jina Reader mirror for Scholar…", file=sys.stderr)
    n, src = fetch_scholar_jina()
    if n is not None:
        return n, src

    print("Trying OpenAlex (set repo Variable OPENALEX_ORCID if not yet)…", file=sys.stderr)
    n, src = fetch_openalex_citedby()
    if n is not None:
        return n, src

    raise SystemExit(
        "Could not get citations: Scholar blocked (403), Jina/OpenAlex failed. "
        "Add a Repository variable OPENALEX_ORCID = your ORCID id (e.g. 0000-0001-2345-6789) "
        "from https://openalex.org — OpenAlex allows CI without blocking."
    )


def main() -> None:
    citedby, source = resolve_citations()

    author = {
        "citedby": citedby,
        "publications": {},
        "updated": str(datetime.now()),
        "citation_source": source,
    }

    print(json.dumps(author, indent=2))
    os.makedirs("results", exist_ok=True)
    with open("results/gs_data.json", "w", encoding="utf-8") as outfile:
        json.dump(author, outfile, ensure_ascii=False)

    shieldio_data = {
        "schemaVersion": 1,
        "label": "citations",
        "message": str(citedby),
    }
    with open("results/gs_data_shieldsio.json", "w", encoding="utf-8") as outfile:
        json.dump(shieldio_data, outfile, ensure_ascii=False)


if __name__ == "__main__":
    main()
