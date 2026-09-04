# ADM Python Programming Pre-Test — Visibility and Direct-Extraction QA

## Corrected visibility

- The directions, form fields, question prompts, answer choices, navigator, diagnostic results, and teacher note now use explicit readable colors.
- Both `color` and `-webkit-text-fill-color` are defined where shared site rules or browser rendering could otherwise produce white text on a light surface.
- The page declares a light color scheme and loads `adm-python-pretest.css?v=20260730-3` to bypass the old cached stylesheet.
- Intentionally dark surfaces retain their white or gold text.

## Functional and structural checks

- Questions detected: **20**
- Duplicate HTML IDs: **0**
- Missing local page assets: **0**
- JavaScript syntax: **PASS**
- CSS parser errors: **0**
- CSS braces balanced: **PASS**

- directions explicit color: **PASS**
- answer option text explicit: **PASS**
- form text explicit: **PASS**
- result summary text explicit: **PASS**
- light color scheme: **PASS**
- cache-busted stylesheet: **PASS**
- hidden seating display preserved: **PASS**
- resource library entry: **PASS**
- global search entry: **PASS**
- adm course link: **PASS**

## Contrast checks

- Directions text: **10.81:1**
- Directions marker: **7.05:1**
- Muted body: **7.06:1**
- Question and answers: **12.76:1**
- Placeholder: **4.55:1**
- Dark result summary: **15.45:1**

## ZIP layout

- The full-repository ZIP is created from inside the repository root, so `index.html`, `.nojekyll`, `assets/`, `courses/`, `resources/`, and the other site folders appear directly at the ZIP root.
- The update-only ZIP likewise begins with `assets/`, `resources/`, and `maintenance/`; it does not contain an extra wrapper folder.
