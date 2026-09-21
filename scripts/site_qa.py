#!/usr/bin/env python3
from pathlib import Path
import re, sys, json
ROOT=Path(__file__).resolve().parents[1]
COURSES=("ied","poe","adm")
errors=[]; warnings=[]
html=[p for c in COURSES for p in (ROOT/"courses"/c).rglob("*.html")]
files={p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*") if p.is_file()}
def clean(h): return re.sub(r"<[^>]+>"," ",h).strip()
for p in html:
    rel=p.relative_to(ROOT).as_posix(); s=p.read_text("utf-8",errors="ignore")
    if not re.search(r"<title>.+?</title>",s,re.I|re.S): errors.append(f"{rel}: missing <title>")
    if "/units/unit-" in rel and re.search(r"/(lesson|activity|project|problem)-",rel):
        if not re.search(r"<h1[^>]*>.+?</h1>",s,re.I|re.S): errors.append(f"{rel}: missing H1")
    for attr,url in re.findall(r'(href|src)=["\']([^"\']+)["\']',s,re.I):
        if not url or url.startswith(("#","http:","https:","mailto:","tel:","javascript:","data:")): continue
        target=(p.parent/url.split("#")[0].split("?")[0]).resolve()
        try: tr=target.relative_to(ROOT).as_posix()
        except ValueError: continue
        if tr and tr not in files: errors.append(f"{rel}: broken {attr} -> {url}")
# Manifest integrity
mp=ROOT/"assets/js/lesson-manifest.js"
if mp.exists():
    ms=mp.read_text("utf-8")
    seen=set()
    for num,title,file in re.findall(r'\["([^"]+)","([^"]+)","([^"]+\.html)"\]',ms):
        key=(num,file)\n        if key in seen: warnings.append(f"manifest duplicate entry: {num} -> {file}")\n        seen.add(key)
# Resource inventory
resource_ext={".pdf",".pptx",".docx",".xlsx",".zip",".stl",".step",".f3d"}
referenced=set()
for p in html:
    s=p.read_text("utf-8",errors="ignore")
    for url in re.findall(r'(?:href|src)=["\']([^"\']+)["\']',s,re.I):
        if Path(url.split("?")[0]).suffix.lower() in resource_ext:
            try: referenced.add((p.parent/url.split("#")[0].split("?")[0]).resolve().relative_to(ROOT).as_posix())
            except ValueError: pass
resources={p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in resource_ext}
for r in sorted(resources-referenced): warnings.append(f"unreferenced resource: {r}")
print(f"Checked {len(html)} course HTML pages and {len(resources)} downloadable resources.")
if warnings:
    print(f"\nWARNINGS ({len(warnings)}):"); print("\n".join(" - "+w for w in warnings[:250]))
if errors:
    print(f"\nERRORS ({len(errors)}):"); print("\n".join(" - "+e for e in errors[:250])); sys.exit(1)
print("\nSite QA passed.")
