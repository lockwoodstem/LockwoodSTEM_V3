
function toggleNav(){document.querySelector('.nav-links')?.classList.toggle('open')}
function filterResources(){const q=(document.getElementById('resourceSearch')?.value||'').toLowerCase();document.querySelectorAll('[data-resource]').forEach(el=>{el.style.display=el.textContent.toLowerCase().includes(q)?'':'none'})}


// Reusable copy button for code examples
document.addEventListener("click", async function(event) {
  const button = event.target.closest(".copy-code-btn");
  if (!button) return;

  const codeBlock = button.closest(".code-card")?.querySelector("code");
  if (!codeBlock) return;

  const originalText = button.innerText;

  try {
    await navigator.clipboard.writeText(codeBlock.innerText);
    button.innerText = "Copied!";
  } catch (error) {
    button.innerText = "Copy failed";
  }

  setTimeout(() => {
    button.innerText = originalText;
  }, 1500);
});

// LockwoodSTEM Challenge Library filters
document.addEventListener("DOMContentLoaded",()=>{const grid=document.querySelector("#challenge-card-grid");if(grid){const cards=[...grid.querySelectorAll(".challenge-card")];const c={search:document.querySelector("#challenge-search"),course:document.querySelector("#challenge-course"),unit:document.querySelector("#challenge-unit"),category:document.querySelector("#challenge-category"),difficulty:document.querySelector("#challenge-difficulty"),time:document.querySelector("#challenge-time"),tool:document.querySelector("#challenge-tool")};const count=document.querySelector("#challenge-result-count"),empty=document.querySelector("#challenge-empty-state");const apply=()=>{const v=Object.fromEntries(Object.entries(c).map(([k,e])=>[k,e?e.value.trim().toLowerCase():""]));let n=0;cards.forEach(card=>{const ok=(!v.search||card.dataset.search.includes(v.search))&&(!v.course||card.dataset.course.toLowerCase()===v.course)&&(!v.unit||card.dataset.unit===v.unit)&&(!v.category||card.dataset.category.toLowerCase()===v.category)&&(!v.difficulty||card.dataset.difficulty.toLowerCase()===v.difficulty)&&(!v.time||card.dataset.time.toLowerCase()===v.time)&&(!v.tool||card.dataset.tools.toLowerCase().includes(v.tool));card.hidden=!ok;if(ok)n++});if(count)count.textContent=n;if(empty)empty.hidden=n!==0};Object.values(c).forEach(e=>{if(e)e.addEventListener(e.tagName==="INPUT"?"input":"change",apply)});const reset=document.querySelector("#challenge-reset");if(reset)reset.addEventListener("click",()=>{Object.values(c).forEach(e=>{if(e)e.value=""});apply()});apply()}const f=document.querySelector("#challenge-id-field");if(f)f.value=new URLSearchParams(location.search).get("challenge")||""});


// Site-wide consistency and navigation pass v4
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.toLowerCase();
  let section = '';
  if (path.includes('/courses/') || path.endsWith('/courses.html')) section = 'courses';
  else if (path.includes('/agenda')) section = 'agenda';
  else if (path.includes('/resources/')) section = 'resources';
  else if (path.includes('/certifications/')) section = 'certifications';
  else if (path.includes('/fablab/')) section = 'fablab';
  else if (path.includes('/about/')) section = 'about';
  else if (path.includes('/challenge-')) section = 'challenges';

  if (section) {
    document.querySelectorAll(`[data-nav-section="${section}"]`).forEach((link) => {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    });
  }

  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      window.setTimeout(() => {
        const nav = document.querySelector('#site-navigation');
        const expanded = nav ? nav.classList.contains('open') || nav.classList.contains('show') : false;
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      }, 0);
    });
  }

  const backToTop = document.querySelector('#backToTop');
  if (backToTop) {
    const update = () => backToTop.classList.toggle('is-visible', window.scrollY > 500);
    window.addEventListener('scroll', update, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    update();
  }
});


// LockwoodSTEM global search v1
(() => {
  const SEARCH_INDEX_URL = '/assets/data/search-index.json?v=1';
  const MAX_RESULTS = 14;
  let searchItems = null;
  let searchPromise = null;

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);

  const normalize = (value = '') => String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const loadIndex = () => {
    if (searchItems) return Promise.resolve(searchItems);
    if (!searchPromise) {
      searchPromise = fetch(SEARCH_INDEX_URL, { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error(`Search index failed: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          searchItems = Array.isArray(data) ? data : (data.items || []);
          searchItems.forEach((item) => {
            item._title = normalize(item.title);
            item._section = normalize(item.section);
            item._description = normalize(item.description);
            item._search = normalize(item.searchText || `${item.title} ${item.section} ${item.description}`);
          });
          return searchItems;
        })
        .catch((error) => {
          console.error(error);
          searchPromise = null;
          throw error;
        });
    }
    return searchPromise;
  };

  const scoreItem = (item, query, tokens) => {
    let score = 0;
    if (item._title === query) score += 500;
    if (item._title.startsWith(query)) score += 260;
    else if (item._title.includes(query)) score += 180;
    if (item._section.includes(query)) score += 80;
    if (item._description.includes(query)) score += 45;
    if (item._search.includes(query)) score += 35;
    for (const token of tokens) {
      if (!item._search.includes(token)) return -1;
      if (item._title.startsWith(token)) score += 70;
      else if (item._title.includes(token)) score += 42;
      if (item._section.includes(token)) score += 22;
      if (item._description.includes(token)) score += 12;
    }
    const typeBoost = { Lesson: 10, Unit: 8, Course: 7, Certification: 7, Resource: 5, Download: 3 };
    score += typeBoost[item.type] || 0;
    return score;
  };

  const iconForType = (type) => ({
    Lesson: 'L', Unit: 'U', Course: 'C', Certification: '✓', Resource: 'R',
    Download: '↓', FabLab: 'F', Challenge: '★', Agenda: 'A', About: 'i', Page: 'P'
  })[type] || 'P';

  const highlight = (text, tokens) => {
    let safe = escapeHtml(text || '');
    tokens.filter((t) => t.length > 1).slice(0, 5).forEach((token) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      safe = safe.replace(new RegExp(`(${escaped})`, 'ig'), '<mark>$1</mark>');
    });
    return safe;
  };

  const initGlobalSearch = () => {
    if (document.querySelector('[data-global-search-trigger]')) return;
    const nav = document.querySelector('.site-header .nav, header .nav');
    if (!nav) return;

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/css/global-search.css?v=1';
    document.head.appendChild(stylesheet);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'global-search-trigger';
    trigger.setAttribute('data-global-search-trigger', '');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.innerHTML = '<span class="global-search-trigger-icon" aria-hidden="true">⌕</span><span class="global-search-trigger-text">Search the site</span><kbd>Ctrl K</kbd>';
    const navToggle = nav.querySelector('.nav-toggle');
    nav.insertBefore(trigger, navToggle || nav.querySelector('.nav-links') || null);

    const overlay = document.createElement('div');
    overlay.className = 'global-search-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="global-search-backdrop" data-search-close></div>
      <section class="global-search-dialog" role="dialog" aria-modal="true" aria-labelledby="globalSearchTitle">
        <header class="global-search-header">
          <div class="global-search-heading-row">
            <div>
              <div class="global-search-eyebrow">Global site search</div>
              <h2 id="globalSearchTitle">Find a lesson, certification, or resource</h2>
            </div>
            <button class="global-search-close" type="button" aria-label="Close search" data-search-close>×</button>
          </div>
          <label class="global-search-input-wrap">
            <span aria-hidden="true">⌕</span>
            <input id="globalSearchInput" type="search" autocomplete="off" spellcheck="false" placeholder="Try “3D printing,” “Unit 2,” or “design review”" />
            <kbd>Esc</kbd>
          </label>
        </header>
        <div class="global-search-status" id="globalSearchStatus" aria-live="polite">Start typing to search the entire LockwoodSTEM site.</div>
        <div class="global-search-results" id="globalSearchResults">
          <div class="global-search-suggestions">
            <strong>Popular searches</strong>
            <div>
              <button type="button" data-search-suggestion="3D printing">3D printing</button>
              <button type="button" data-search-suggestion="Fusion CAD">Fusion CAD</button>
              <button type="button" data-search-suggestion="engineering notebook">Engineering notebook</button>
              <button type="button" data-search-suggestion="design review">Design review</button>
            </div>
          </div>
        </div>
        <footer class="global-search-footer"><span>↑↓ Browse</span><span>Enter Open</span><span>Esc Close</span></footer>
      </section>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#globalSearchInput');
    const results = overlay.querySelector('#globalSearchResults');
    const status = overlay.querySelector('#globalSearchStatus');
    let lastFocused = null;

    const openSearch = () => {
      lastFocused = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add('global-search-open');
      window.setTimeout(() => input.focus(), 30);
      loadIndex().catch(() => {
        status.textContent = 'Search could not load. Refresh the page and try again.';
      });
    };

    const closeSearch = () => {
      overlay.hidden = true;
      document.body.classList.remove('global-search-open');
      input.value = '';
      status.textContent = 'Start typing to search the entire LockwoodSTEM site.';
      results.innerHTML = '<div class="global-search-suggestions"><strong>Popular searches</strong><div><button type="button" data-search-suggestion="3D printing">3D printing</button><button type="button" data-search-suggestion="Fusion CAD">Fusion CAD</button><button type="button" data-search-suggestion="engineering notebook">Engineering notebook</button><button type="button" data-search-suggestion="design review">Design review</button></div></div>';
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };

    const render = async () => {
      const raw = input.value.trim();
      const query = normalize(raw);
      if (query.length < 2) {
        status.textContent = query.length ? 'Type at least two characters.' : 'Start typing to search the entire LockwoodSTEM site.';
        return;
      }
      status.textContent = 'Searching…';
      try {
        const items = await loadIndex();
        const tokens = query.split(' ').filter(Boolean);
        const matches = items.map((item) => ({ item, score: scoreItem(item, query, tokens) }))
          .filter((match) => match.score >= 0)
          .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
          .slice(0, MAX_RESULTS);
        status.textContent = matches.length ? `${matches.length}${matches.length === MAX_RESULTS ? '+' : ''} result${matches.length === 1 ? '' : 's'} for “${raw}”` : `No results for “${raw}”`;
        if (!matches.length) {
          results.innerHTML = '<div class="global-search-empty"><strong>No match found.</strong><p>Try a broader term, a unit number, a tool name, or a course abbreviation such as IED or POE.</p></div>';
          return;
        }
        results.innerHTML = matches.map(({ item }) => `
          <a class="global-search-result" href="${escapeHtml(item.url)}">
            <span class="global-search-result-icon" aria-hidden="true">${iconForType(item.type)}</span>
            <span class="global-search-result-copy">
              <span class="global-search-result-title">${highlight(item.title, tokens)}</span>
              <span class="global-search-result-description">${highlight(item.description || 'Open this page.', tokens)}</span>
              <span class="global-search-result-meta">${escapeHtml(item.section || item.type)}</span>
            </span>
            <span class="global-search-result-arrow" aria-hidden="true">→</span>
          </a>`).join('');
      } catch (error) {
        status.textContent = 'Search could not load. Refresh the page and try again.';
        results.innerHTML = '<div class="global-search-empty"><strong>Search unavailable.</strong><p>The search index could not be loaded.</p></div>';
      }
    };

    let debounce;
    input.addEventListener('input', () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(render, 120);
    });
    trigger.addEventListener('click', openSearch);
    overlay.addEventListener('click', (event) => {
      if (event.target.closest('[data-search-close]')) closeSearch();
      const suggestion = event.target.closest('[data-search-suggestion]');
      if (suggestion) {
        input.value = suggestion.dataset.searchSuggestion;
        input.focus();
        render();
      }
    });
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSearch();
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const links = [...overlay.querySelectorAll('.global-search-result')];
        if (!links.length) return;
        event.preventDefault();
        const current = links.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? Math.min(current + 1, links.length - 1) : Math.max(current - 1, 0);
        links[next].focus();
      }
    });
    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        overlay.hidden ? openSearch() : closeSearch();
      } else if (event.key === '/' && !isTyping && overlay.hidden) {
        event.preventDefault();
        openSearch();
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGlobalSearch);
  else initGlobalSearch();
})();


// Student dashboard navigation and recent-page history
(() => {
  const RECENT_KEY = 'lockwoodstem-recent-pages-v1';
  function normalizeNavHref(anchor){
    try{
      const url=new URL(anchor.getAttribute('href')||'',location.href);
      let path=url.pathname.replace(/\/+/g,'/');
      if(path.length>1) path=path.replace(/\/$/,'');
      return path+(url.search||'');
    }catch{return (anchor.getAttribute('href')||'').trim();}
  }
  function dedupeNavLinks(nav){
    const seen=new Map();
    [...nav.querySelectorAll('a[href]')].forEach((a)=>{
      const key=normalizeNavHref(a).toLowerCase();
      if(!key) return;
      if(!seen.has(key)){seen.set(key,a);return;}
      const duplicate=a.closest('li')||a;
      duplicate.remove();
    });
  }
  function addDashboardLink(){
    const nav=document.querySelector('#site-navigation.nav-links, .site-header .nav-links');
    if(!nav) return;

    // Patch stacking can leave the same navigation item in the HTML more than once.
    // Keep the first copy of each destination before adding anything dynamically.
    dedupeNavLinks(nav);

    const existing=[...nav.querySelectorAll('a[href]')].find((a)=>{
      const path=normalizeNavHref(a).toLowerCase();
      return path==='/dashboard/index.html' || path==='/dashboard';
    });
    if(existing){
      existing.dataset.navSection='dashboard';
      if(location.pathname.includes('/dashboard/')) existing.setAttribute('aria-current','page');
      return;
    }

    const li=document.createElement('li');
    const a=document.createElement('a');
    a.href='/dashboard/index.html'; a.dataset.navSection='dashboard'; a.textContent='Dashboard';
    if(location.pathname.includes('/dashboard/')) a.setAttribute('aria-current','page');
    li.appendChild(a); nav.insertBefore(li,nav.firstElementChild);
  }
  function trackPage(){
    const path=location.pathname+location.search;
    if(/\/(dashboard|certifications\/(login|register|teacher-login))\//.test(location.pathname)) return;
    const title=(document.querySelector('main h1')?.textContent || document.title.split('|')[0] || 'LockwoodSTEM').trim();
    const section=(document.querySelector('main .eyebrow')?.textContent || document.querySelector('[aria-current="page"]')?.textContent || 'Page').trim();
    let items=[]; try{items=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');if(!Array.isArray(items))items=[];}catch{}
    items=items.filter(item=>item&&item.path!==path);
    items.unshift({path,title,section,visitedAt:new Date().toISOString()});
    try{localStorage.setItem(RECENT_KEY,JSON.stringify(items.slice(0,12)));}catch{}
  }
  function init(){addDashboardLink();trackPage();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// Student-facing lesson copy cleanup v20260823
// Removes internal/developer placeholder wording from student lesson pages without
// overwriting the lesson HTML itself. This keeps later resource/presentation patches intact.
(() => {
  const unfinishedPatterns = [
    /this page is ready for lesson directions.*when they are added/i,
    /this (page|section|lesson).*\b(placeholder|under construction)\b/i,
    /\b(content|resources?|files?|directions?)\b.*\b(coming soon|will be added|to be added|not yet available|not yet added)\b/i,
    /\b(check back|return later)\b.*\b(content|resources?|files?|lesson)\b/i
  ];

  const isUnfinishedCopy = (text) => {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    return value && unfinishedPatterns.some((pattern) => pattern.test(value));
  };

  const cleanLessonCopy = () => {
    if (!document.body || !document.body.classList.contains('lesson-detail-page')) return;

    const heroSummary = document.querySelector('.page-hero .hero-grid > div > p');
    const lessonGoal = heroSummary ? heroSummary.textContent.replace(/\s+/g, ' ').trim() : '';

    document.querySelectorAll('main p').forEach((paragraph) => {
      const current = paragraph.textContent.replace(/\s+/g, ' ').trim();
      if (!isUnfinishedCopy(current)) return;

      if (paragraph.closest('.card.dark') && lessonGoal) {
        paragraph.textContent = `Your goal: ${lessonGoal}`;
        return;
      }

      if (paragraph.closest('.resources-placeholder, .lesson-resources-card, .resource-list')) {
        paragraph.textContent = 'Use the lesson materials provided in class and any linked resources on this page. Save the required evidence in your assigned project folder.';
        return;
      }

      paragraph.textContent = 'Complete the lesson tasks in order, follow the class demonstration and directions, and document your progress with the evidence requested below.';
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanLessonCopy);
  } else {
    cleanLessonCopy();
  }
})();


// Automatic course lesson navigation v1
document.addEventListener('DOMContentLoaded', () => {
  const run = (manifest) => {
  const match = location.pathname.match(/\/courses\/(ied|poe|adm)\/units\/unit-(\d+)\/([^/]+\.html)$/i);
  if (!match) return;
  const course = match[1].toLowerCase(), unit = match[2], file = match[3];
  const units = manifest[course];
  if (!units || !units[unit]) return;
  const current = units[unit].findIndex(item => item[2] === file);
  if (current < 0) return;

  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const label = item => esc(item[0] + ': ' + item[1]);
  const orderedUnits = Object.keys(units).sort((a,b) => Number(a)-Number(b));
  const unitIndex = orderedUnits.indexOf(unit);
  const previous = current > 0 ? units[unit][current-1] : (unitIndex > 0 ? units[orderedUnits[unitIndex-1]].at(-1) : null);
  const next = current < units[unit].length-1 ? units[unit][current+1] : (unitIndex >= 0 && unitIndex < orderedUnits.length-1 ? units[orderedUnits[unitIndex+1]][0] : null);

  const hrefFor = item => {
    if (!item) return null;
    const targetUnit = item[0].match(/(\d+)\./)?.[1] || unit;
    return targetUnit === unit ? item[2] : '../unit-' + targetUnit + '/' + item[2];
  };

  let nav = document.querySelector('.lesson-bottom-nav');
  if (!nav) {
    nav = document.createElement('section');
    nav.className = 'container lesson-bottom-nav';
    const main = document.querySelector('main');
    if (main) main.appendChild(nav); else return;
  }
  nav.innerHTML = '<div class="lesson-bottom-nav-card"><div class="lesson-bottom-nav-links">' +
    (previous ? '<a class="btn secondary" href="'+esc(hrefFor(previous))+'">← '+label(previous)+'</a>' : '<span></span>') +
    '<a class="btn" href="../unit-'+esc(unit)+'.html">Unit '+esc(unit)+' Overview</a>' +
    (next ? '<a class="btn secondary" href="'+esc(hrefFor(next))+'">'+label(next)+' →</a>' : '<a class="btn secondary" href="../../index.html">Course Overview →</a>') +
    '</div></div>';
  };
  if (window.LOCKWOODSTEM_LESSONS) return run(window.LOCKWOODSTEM_LESSONS);
  const script = document.createElement('script');
  script.src = '/assets/js/lesson-manifest.js?v=2';
  script.onload = () => run(window.LOCKWOODSTEM_LESSONS);
  document.head.appendChild(script);
});


// Standard lesson experience + manifest-synced unit maps v1
document.addEventListener('DOMContentLoaded', () => {
  const ensureStyles = () => {
    if (document.querySelector('link[href*="lesson-experience.css"]')) return;
    const l=document.createElement('link'); l.rel='stylesheet'; l.href='/assets/css/lesson-experience.css?v=1'; document.head.appendChild(l);
  };
  ensureStyles();

  const loadManifest = (done) => {
    if (window.LOCKWOODSTEM_LESSONS) return done(window.LOCKWOODSTEM_LESSONS);
    const existing=document.querySelector('script[src*="lesson-manifest.js"]');
    if(existing){existing.addEventListener('load',()=>done(window.LOCKWOODSTEM_LESSONS),{once:true});return;}
    const s=document.createElement('script');s.src='/assets/js/lesson-manifest.js?v=3';s.onload=()=>done(window.LOCKWOODSTEM_LESSONS);document.head.appendChild(s);
  };

  loadManifest((manifest) => {
    if(!manifest) return;
    const path=location.pathname;
    const unitMatch=path.match(/\/courses\/(ied|poe|adm)\/units\/unit-(\d+)\.html$/i);
    if(unitMatch){
      const course=unitMatch[1].toLowerCase(), unit=unitMatch[2], list=manifest[course]?.[unit];
      if(list){
        const rows=[...document.querySelectorAll('table tbody tr')];
        list.forEach((item,i)=>{
          const row=rows.find(r=>r.textContent.trim().startsWith(item[0])) || rows[i];
          if(!row) return;
          const cells=row.querySelectorAll('td'); if(cells.length<2) return;
          cells[0].textContent=item[0];
          const titleLink=cells[1].querySelector('a');
          if(titleLink){titleLink.textContent=item[1];titleLink.href='unit-'+unit+'/'+item[2];}
          else cells[1].textContent=item[1];
          row.querySelectorAll('a.btn').forEach(a=>{if(/open/i.test(a.textContent))a.href='unit-'+unit+'/'+item[2];});
        });
      }
    }

    const lessonMatch=path.match(/\/courses\/(ied|poe|adm)\/units\/unit-(\d+)\/([^/]+\.html)$/i);
    if(!lessonMatch) return;
    const course=lessonMatch[1].toLowerCase(), unit=lessonMatch[2], file=lessonMatch[3];
    const item=manifest[course]?.[unit]?.find(x=>x[2]===file);
    const main=document.querySelector('main'); if(!main||!item) return;

    // Standard student workflow panel. It supplements existing lesson content without deleting teacher-authored material.
    if(!document.querySelector('.lesson-standard-tools')){
      const panel=document.createElement('section');panel.className='container lesson-standard-tools lesson-section';
      panel.innerHTML='<div class="section-header"><div><div class="eyebrow">Lesson Workflow</div><h2>'+item[0]+': '+item[1]+'</h2><p class="section-subtitle">Use the lesson sections in order. Check the required evidence before you submit.</p></div></div><div class="lesson-standard-grid"><article class="lesson-standard-card"><h3>1. Learn</h3><p>Review the lesson target, examples, and directions before beginning the task.</p></article><article class="lesson-standard-card"><h3>2. Build / Practice</h3><p>Complete the investigation, design, calculation, fabrication, or programming work described below.</p></article><article class="lesson-standard-card"><h3>3. Check</h3><p>Test your work against the lesson requirements and correct problems before submitting.</p></article></div>';
      const firstContent=main.querySelector('.lesson-section, .lesson-web-section');
      if(firstContent) firstContent.before(panel); else main.appendChild(panel);
    }

    // Standard submission reminder; specific assignment requirements remain authoritative in Google Classroom.
    if(!document.querySelector('.lesson-submission-box')){
      const submit=document.createElement('section');submit.className='container lesson-section';
      submit.innerHTML='<article class="card lesson-submission-box"><span class="tag">Submission</span><h2>What do I submit?</h2><p>Submit the evidence identified in this lesson and in the associated Google Classroom assignment. Before submitting, confirm that your name/team information is complete, required files or photos are included, and your final work has been tested or checked.</p></article>';
      const nav=main.querySelector('.lesson-bottom-nav'); if(nav) nav.before(submit); else main.appendChild(submit);
    }

    // Reusable ADM coding-help library appears only on pages that contain programming/code language.
    if(course==='adm' && /\b(code|coding|program|python|variable|loop|conditional|function|sensor)\b/i.test(main.innerText) && !document.querySelector('.adm-hint-library')){
      const hints=document.createElement('section');hints.className='container lesson-section adm-hint-library';
      hints.innerHTML='<div class="section-header"><div><div class="eyebrow">Coding Support</div><h2>Python & Robot Programming Hints</h2><p class="section-subtitle">Open only the hint you need. These examples show general structures, not the solution to this assignment.</p></div></div>'+
      '<details><summary>Variables — store values you may need to change</summary><div class="hint-body"><pre><code>selection = 2\ndestination = "B"</code></pre><p>Use a variable when the value may change while the overall program structure stays the same.</p></div></details>'+
      '<details><summary>Conditionals — make a decision</summary><div class="hint-body"><pre><code>if selection == 1:\n    # action for choice 1\nelif selection == 2:\n    # action for choice 2\nelse:\n    # unexpected choice</code></pre><p>Remember: <code>=</code> assigns a value; <code>==</code> compares values.</p></div></details>'+
      '<details><summary>Functions — reuse a sequence</summary><div class="hint-body"><pre><code>def perform_task(location):\n    # reusable actions\n    pass\n\nperform_task(2)</code></pre><p>If you are copying the same movement sequence repeatedly, consider what should become a function.</p></div></details>'+
      '<details><summary>Loops — repeat without copying code</summary><div class="hint-body"><pre><code>for item in items:\n    # repeat an action for each item\n    pass</code></pre><p>Use a loop when the same kind of action must repeat for multiple items or cycles.</p></div></details>'+
      '<details><summary>Debugging — test one layer at a time</summary><div class="hint-body"><ol><li>Print or inspect variable values.</li><li>Test decision logic before adding robot motion.</li><li>Test one position or subsystem at reduced speed.</li><li>Verify approach and clearance positions.</li><li>Check end-effector timing.</li><li>Run the complete sequence only after each part works.</li></ol><pre><code>print("Current selection:", selection)</code></pre></div></details>'+
      '<details><summary>Common Python checks</summary><div class="hint-body"><p>Check indentation, colons after <code>if</code>/<code>elif</code>/<code>else</code>/<code>def</code>, matching variable names, string quotation marks, and whether a value is a number or a string.</p></div></details>';
      const submit=main.querySelector('.lesson-submission-box')?.parentElement; if(submit) submit.before(hints); else main.appendChild(hints);
    }
  });
});
