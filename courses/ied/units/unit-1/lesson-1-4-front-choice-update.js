// IED Lesson 1.4 page-specific update helper.
// Converts the STL viewer's overall dimensions from millimeters to inches and updates
// student-facing guidance so students select and justify their own FRONT view.
(() => {
  const toInches = (element) => {
    const text = element.textContent.trim();
    if (!text.endsWith(' mm')) return;
    const values = text.slice(0, -3).split('×').map(value => Number(value.trim().replace(/,/g, '')));
    if (values.length !== 3 || values.some(value => !Number.isFinite(value))) return;
    element.textContent = values.map(value => (value / 25.4).toFixed(2)).join(' × ') + ' in';
  };

  document.querySelectorAll('[data-stl-dimensions]').forEach((element) => {
    toInches(element);
    new MutationObserver(() => toInches(element)).observe(element, { childList: true, characterData: true, subtree: true });
  });
})();
