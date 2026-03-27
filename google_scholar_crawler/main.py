# Produces the same files as AcadHomepage (gs_data.json + gs_data_shieldsio.json).
# We do NOT use scholarly here: it pulls Selenium/proxies and often hangs for minutes in GitHub Actions.
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


def parse_citations(html: str) -> int | None:
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


def main() -> None:
    try:
        r = requests.get(SCHOLAR_URL, headers=HEADERS, timeout=60)
        r.raise_for_status()
    except requests.RequestException as exc:
        print(f"Scholar HTTP error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

    citedby = parse_citations(r.text)
    if citedby is None:
        print("Could not parse citation count from Scholar HTML.", file=sys.stderr)
        raise SystemExit(1)

    author = {
        "citedby": citedby,
        "publications": {},
        "updated": str(datetime.now()),
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
