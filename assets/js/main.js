
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
