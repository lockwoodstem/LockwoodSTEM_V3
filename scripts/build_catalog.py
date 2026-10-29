"""Generate all navigation/search inventories from assets/data/site-catalog.json."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
c=json.loads((ROOT/'assets/data/site-catalog.json').read_text())
def write(path,obj): (ROOT/path).write_text(json.dumps(obj,indent=2)+'\n')
write('assets/data/lesson-index.json',{'generated':'2026-10-28','lessons':c['lessons']})
write('assets/data/resource-library.json',c['resources'])
write('assets/data/search-index.json',{'version':'2026-10-28','count':len(c['pages']),'items':c['pages']})
nav={}
for lesson in c['lessons']:
 course=lesson['course'].lower();unit=str(lesson['unit']);filename=Path(lesson['url']).name
 nav.setdefault(course,{}).setdefault(unit,[]).append([str(lesson.get('number','')),lesson['title'],filename])
(ROOT/'assets/js/lesson-manifest.js').write_text('window.LOCKWOODSTEM_LESSONS = '+json.dumps(nav,indent=2)+';\n')
print('Generated lesson, resource, search, and navigation indexes from site-catalog.json.')
