/* Compact ADM lesson code picker for the prebuilt Studio deployment.
   The React source includes the same simplified component. */
(() => {
  function apply() {
    const panel = document.querySelector('.studio-grid .classroom');
    if (!panel) return;
    panel.classList.add('classroom-compact');
    const heading = panel.querySelector('#classroom-title');
    if (heading && heading.textContent !== 'ADM lesson code') heading.textContent = 'ADM lesson code';
    const body = panel.querySelector('.classroom-body');
    if (!body) return;
    const selector = body.querySelector('select[aria-label="Classroom lesson"]');
    if (!selector) return;
    const label = selector.closest('label');
    if (label) {
      label.classList.add('studio-lesson-picker');
      const text = Array.from(label.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
      if (text && text.textContent !== 'Load lesson starter code ') text.textContent = 'Load lesson starter code ';
    }
    const names = {
      'sensor-control': '2.1.8 · Sensor-controlled LED & servo',
      'color-detection': '2.1.9 · Detect a colored object',
      'vision-sorter': '2.1.10 · Build a vision-controlled sorter'
    };
    for (const option of selector.options) {
      const text = names[option.value];
      if (text && option.textContent !== text) option.textContent = text;
      if (!option.value && option.textContent !== 'Choose an ADM lesson…') option.textContent = 'Choose an ADM lesson…';
    }
  }
  // Reveal the editor if it was minimized during a previous session.
  function revealEditor() {
    const editor = document.querySelector('.studio-grid .workspace-column .studio-panel');
    if (!editor || !editor.classList.contains('studio-collapsed')) return;
    const toggle = editor.querySelector('.studio-collapse-toggle');
    if (toggle) toggle.click();
    else editor.classList.remove('studio-collapsed');
  }
  function bindLoad() {
    const select = document.querySelector('select[aria-label="Classroom lesson"]');
    if (!select || select.dataset.studioLoadReveal === 'yes') return;
    select.dataset.studioLoadReveal = 'yes';
    select.addEventListener('change', () => {
      if (select.value) revealEditor();
    });
  }
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; apply(); bindLoad(); });
  }
  function ready() {
    apply(); bindLoad();
    const root = document.getElementById('root');
    if (root) new MutationObserver(schedule).observe(root, {subtree:true,childList:true,characterData:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();
