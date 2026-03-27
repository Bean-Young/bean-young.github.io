# Based on https://github.com/RayeRen/acad-homepage.github.io/blob/main/google_scholar_crawler/main.py
# We do NOT pass section "publications" into scholarly.fill(): that triggers one (or many) requests
# per paper and often runs tens of minutes or looks “stuck” in GitHub Actions under Scholar rate limits.
from scholarly import scholarly
import jsonpickle
import json
from datetime import datetime
import os

author: dict = scholarly.search_author_id(os.environ["GOOGLE_SCHOLAR_ID"])
scholarly.fill(author, sections=["basics", "indices", "counts"])

name = author["name"]
author["updated"] = str(datetime.now())
pubs = author.get("publications") or []
author["publications"] = (
    {v["author_pub_id"]: v for v in pubs} if pubs else {}
)

print(json.dumps(author, indent=2))
os.makedirs("results", exist_ok=True)
with open("results/gs_data.json", "w") as outfile:
    json.dump(author, outfile, ensure_ascii=False)

shieldio_data = {
    "schemaVersion": 1,
    "label": "citations",
    "message": f"{author.get('citedby', 0)}",
    "color": "4285F4",
    "namedLogo": "googlescholar",
    "logoColor": "white",
}
with open("results/gs_data_shieldsio.json", "w") as outfile:
    json.dump(shieldio_data, outfile, ensure_ascii=False)
