# Outputs match https://github.com/RayeRen/acad-homepage.github.io/tree/main/google_scholar_crawler
# (gs_data.json + gs_data_shieldsio.json → pushed to branch google-scholar-stats).
# Upstream fills "publications", which pulls every paper and often hangs in CI; we only need citedby for badges.
from scholarly import scholarly
import json
from datetime import datetime
import os

_scholar_id = (os.environ.get("GOOGLE_SCHOLAR_ID") or "").strip()
if not _scholar_id:
    raise SystemExit(
        "Set repository secret GOOGLE_SCHOLAR_ID to your Google Scholar user id "
        "(the value after user= in your profile URL), per AcadHomepage README."
    )

author: dict = scholarly.search_author_id(_scholar_id)
scholarly.fill(author, sections=["basics", "indices", "counts"])

author["updated"] = str(datetime.now())
author["publications"] = author.get("publications") or {}

print(json.dumps(author, indent=2))
os.makedirs("results", exist_ok=True)
with open("results/gs_data.json", "w", encoding="utf-8") as outfile:
    json.dump(author, outfile, ensure_ascii=False)

shieldio_data = {
    "schemaVersion": 1,
    "label": "citations",
    "message": f"{author.get('citedby', 0)}",
}
with open("results/gs_data_shieldsio.json", "w", encoding="utf-8") as outfile:
    json.dump(shieldio_data, outfile, ensure_ascii=False)
