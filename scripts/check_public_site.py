"""Check all static links, catalog references, and student-auth retirement."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,sys
ROOT=Path(__file__).resolve().parents[1];errors=[];count=0
class Links(HTMLParser):
 def __init__(self):super().__init__();self.urls=[]
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if key in ('href','src') and value:self.urls.append(value)
def check(url,base,label):
 u=urlsplit(url)
 if u.scheme or u.netloc or not u.path:return
 path=unquote(u.path)
 p=(ROOT/path.lstrip('/')) if path.startswith('/') else (base/path)
 if not p.exists() and not p.with_suffix('.html').exists():errors.append(f'{label}: missing {url}')
for p in ROOT.rglob('*.html'):
 # Apps Script HTML templates are deployed separately and may contain template syntax.
 if 'integrations' in p.parts:continue
 parser=Links();s=p.read_text(errors='replace');parser.feed(s);count+=1
 for u in parser.urls:check(u,p.parent,str(p.relative_to(ROOT)))
 if p.parent.name=='certifications' and p.name.endswith(('-final.html','-practice.html','-study.html')) and 'auth-guard.js' in s:errors.append(f'{p.name}: student guard remains')
for p in ROOT.rglob('*.gs'):errors.append(f'Private server source in public tree: {p}')
c=json.loads((ROOT/'assets/data/site-catalog.json').read_text())
for x in c['lessons']:check(x['url'],ROOT,'lesson catalog')
for x in c['resources']['items']:check(x['url'],ROOT/'resources','resource catalog')
for x in c['pages']:check(x['url'],ROOT,'search catalog')
for p in (ROOT/'certifications').glob('*.html'):
 s=p.read_text()
 if any(x in s for x in ['data-login-form','data-register-form','data-teacher-login-form','data-teacher-register-form']):errors.append(f'Account form remains: {p.name}')
for name in ['auth.js','auth-config.js','teacher.js']:
 if (ROOT/'certifications'/name).exists():errors.append(f'Account implementation remains: {name}')
print(f'Checked {count} HTML pages and catalog references. {len(errors)} error(s).')
for e in errors:print(e)
sys.exit(bool(errors))
