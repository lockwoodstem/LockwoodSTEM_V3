# Agenda Smartboard Quote + Width Update

Build: 2026-08-12-2

## Changes
- Full-screen day view now uses an approximately 58% / 42% main-to-side column split, giving Upcoming Due Dates and Quote of the Day substantially more horizontal room.
- Quote of the Day is always available in classroom full-screen mode.
- The Quotes sheet remains the primary source. If the exact date row has a blank Quote, the agenda now falls back to the most recent nonblank quote rather than suppressing the card.
- If the Quotes sheet is unavailable or contains no usable quote, full-screen mode displays a classroom-safe fallback quote so the section is never missing.
- The fallback quote remains hidden in the normal/non-full-screen agenda view.
- Cache versions for the agenda CSS and JavaScript were bumped to 20260812-2.

## Files changed
- `agenda.html`
- `assets/js/agenda-current.js`
- `assets/css/agenda-resources.css`
