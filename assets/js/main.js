
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
