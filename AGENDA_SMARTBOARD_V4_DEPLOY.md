# Smartboard Agenda v4

This build uses NEW asset filenames to bypass stale browser/CDN caches:

- `assets/css/agenda-resources-smartboard-v4.css`
- `assets/js/agenda-current-smartboard-v4.js`

`agenda.html` and `agenda-v4.html` both reference those files.

## Expected full-screen layout
- Today in Class side: 58%
- Right side: 42%
- Right side order: Objectives → Upcoming Due Dates → Quote of the Day
- Standards and Notes hidden in full-screen
- A tiny `SMARTBOARD v4` badge appears in the lower-right of full-screen as a deployment check.

## GitHub Pages
Copy the CONTENTS of the patch/site folder into the repository root. Do not place the outer folder itself inside the repository. After the Pages deployment finishes, test `/agenda-v4.html` first.
