# Agenda Full-Screen Fit Update

This update makes the complete day or week agenda fit inside the available full-screen viewport.

## Files replaced
- `agenda.html`
- `assets/css/agenda-resources.css`
- `assets/js/agenda-current.js`

## Behavior
- The full-screen toolbar is compressed.
- The redundant status row is hidden while full screen is active.
- Day view remains in a two-column presentation layout.
- Week view uses five columns.
- Card spacing, padding, and typography are compacted only in full-screen mode.
- The rendered agenda is automatically scaled to the available viewport height and width.
- The fit is recalculated after course/date/view changes, due-date loading, window resizing, and dynamic content updates.
- Normal non-full-screen formatting is unchanged.

Extract this ZIP directly into the repository root and replace matching files.
