# Agenda Smartboard Auto-Fit Update — 2026-08-12

Updated `agenda.html` and `assets/css/agenda-resources.css` for the classroom full-screen agenda.

## Changes
- Reduced the full-screen lesson-title footprint.
- Replaced whole-agenda shrinking in Day view with section-by-section text fitting.
- Today in Class now receives the largest share of remaining screen height and scales its agenda text up when content is short.
- Homework and Announcements each scale independently inside their allotted area.
- Upcoming Due Dates scales independently rather than staying at a fixed small font.
- Quote of the Day is now visible in full-screen mode directly after Upcoming Due Dates and scales to use its available space.
- Objectives remain visible; Standards and Notes remain hidden in classroom full-screen mode to preserve reading distance.
- Week view retains the existing whole-grid fit behavior.

## Cache busting
- `agenda-resources.css` query version updated to `20260812-1`.
- Agenda build metadata updated to `20260812-1`.
