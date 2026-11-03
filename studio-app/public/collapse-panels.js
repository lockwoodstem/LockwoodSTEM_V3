/* Studio panel minimize/expand controls. Keeps React panels mounted. */
(() => {
  const storageKey = 'lockwoodstem-studio-panel-collapse-v1';
  const labels = {
    'classroom-title': 'Classroom launchpad',
    'editor-title': 'Editor',
    'console-title': 'Python console',
    'camera-title': 'Vision lab',
    'hardware-title': 'Hardware lab'
  };
  function read() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; }
    catch { return {}; }
  }
  const preferences = read();
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); }
    catch { /* Browsers with storage disabled still support collapsing. */ }
  }
  function identity(panel, heading) {
    const title = heading.querySelector('h2');
    if (title?.id) return title.id;
    if (panel.classList.contains('starter-panel')) return 'starter-panel';
    return null;
  }
  function update(panel, button, id) {
    const collapsed = preferences[id] === true;
    panel.classList.toggle('studio-collapsed', collapsed);
    const label = collapsed ? '＋ Expand' : '− Minimize';
    if (button.textContent !== label) button.textContent = label;
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', (collapsed ? 'Expand ' : 'Minimize ') + (labels[id] || 'starter programs'));
    button.title = collapsed ? 'Expand section' : 'Minimize section';
  }
  function enhance() {
    document.querySelectorAll('.studio-grid .studio-panel').forEach(panel => {
      const heading = Array.from(panel.children).find(child => child.classList?.contains('panel-heading'));
      if (!heading) return;
      const id = identity(panel, heading);
      if (!id) return;
      let button = Array.from(heading.children).find(child => child.classList?.contains('studio-collapse-toggle'));
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'studio-collapse-toggle';
        button.addEventListener('click', () => {
          preferences[id] = !panel.classList.contains('studio-collapsed');
          save();
          update(panel, button, id);
        });
        heading.appendChild(button);
      }
      update(panel, button, id);
    });
  }
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; enhance(); });
  });
  const ready = () => {
    enhance();
    observer.observe(document.getElementById('root') || document.body, {childList:true, subtree:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
})();
