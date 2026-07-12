
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
