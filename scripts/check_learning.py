from pathlib import Path
from html.parser import HTMLParser
import sys
ROOT=Path(__file__).resolve().parents[1]
errors=[];lessons=0
class Check(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.labels=[];self.controls=[];self.scripts=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.append(a['id'])
  if tag=='label' and a.get('for'):self.labels.append(a['for'])
  if tag in ['input','textarea','select'] and a.get('id','').startswith('learning-'):self.controls.append(a['id'])
  if tag=='script':self.scripts.append(a.get('src',''))
for p in ROOT.rglob('*.html'):
 s=p.read_text(errors='replace')
 if 'data-lesson-workspace' not in s:continue
 lessons+=1;c=Check();c.feed(s)
 for name in c.controls:
  if name not in c.labels:errors.append(f'{p}: unlabeled report field {name}')
 for anchor in ['lesson-goal','lesson-checkpoint','lesson-report']:
  if anchor not in c.ids:errors.append(f'{p}: missing guide anchor {anchor}')
 for src in ['learning-core.js','lesson-workspace.js']:
  if not any(src in x for x in c.scripts):errors.append(f'{p}: missing {src}')
 if any('assets/vendor/' in x for x in c.scripts):errors.append(f'{p}: PDF library loaded before export')
print(f'Checked {lessons} lesson guides and labeled report forms; {len(errors)} errors.')
for e in errors:print(e)
sys.exit(bool(errors))
