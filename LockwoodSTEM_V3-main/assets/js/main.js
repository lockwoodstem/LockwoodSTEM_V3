
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
