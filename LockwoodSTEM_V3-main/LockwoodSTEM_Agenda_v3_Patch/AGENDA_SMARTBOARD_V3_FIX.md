# Agenda Smartboard v3 Fix — 2026-08-12

This revision addresses the two issues confirmed by the classroom screenshot:

1. The older 71% / 29% full-screen column rule was still winning on the Smartboard.
2. Quote of the Day was not appearing under Upcoming Due Dates.

## Changes
- Full-screen day view is now enforced at **60% left / 40% right**.
- The old 1.42fr / .58fr full-screen ratio was removed from the agenda stylesheet.
- The full-screen controller also sets the 60/40 ratio inline with `!important` while full screen is active, then removes it when leaving full screen.
- Quote of the Day is rendered directly after Upcoming Due Dates in the day-view markup.
- Quote is no longer included in the legacy classroom `display:none` rule.
- If a stale/older agenda renderer ever fails to create a quote card, the full-screen controller creates a safe runtime fallback card so the section cannot disappear.
- Standards and Notes remain hidden in full-screen mode.
- Agenda CSS/JS cache versions bumped to `20260812-3`.

## Files changed
- `agenda.html`
- `assets/css/agenda-resources.css`
- `assets/js/agenda-current.js`
