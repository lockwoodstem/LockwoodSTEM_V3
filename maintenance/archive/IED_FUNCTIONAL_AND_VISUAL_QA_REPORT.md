# IED Functional and Visual QA Report

**Date:** July 20, 2026  
**Build audited:** Latest LockwoodSTEM GitHub-ready site after the Units 2–5 Open Lesson button update

## Scope

This pass covered the complete IED course area and focused on:

1. Functional integrity across all IED hubs, lesson pages, links, downloads, navigation, reveal controls, and model assets.
2. Visual and responsive behavior across desktop, Chromebook/tablet, and phone layouts.

## Functional audit results

The automated audit inspected **153 IED HTML pages**, including **109 lesson pages**.

| Check | Result |
|---|---:|
| Local links checked | 4,205 |
| Local assets checked | 1,038 |
| Missing links or assets | 0 |
| Images checked | 444 |
| Images missing alt text | 0 |
| Buttons checked | 390 |
| Unnamed buttons or links | 0 |
| Reveal/dropdown elements checked | 222 |
| Reveal elements missing a readable summary | 0 |
| Form controls checked | 5 |
| Unlabeled controls | 0 |
| Duplicate HTML IDs | 0 |
| Missing internal section anchors | 0 |
| Incorrect previous/next lesson navigation | 0 |

### Presentation, code, and model integrity

- **104 unique linked PowerPoint files** were found and tested as valid PPTX packages.
- **10 JavaScript files** used by the IED area passed syntax checking.
- **13 CSS files** passed stylesheet parsing with no syntax errors.
- All **5 IED STL models** were structurally valid, contained usable triangles, finite coordinates, and nonzero dimensions.
- Existing 3D-model HTML sections, model files, and viewer scripts were not altered during the QA correction.

## Visual and responsive audit

Representative course, unit-hub, lesson, student-task, deliverable, reveal-box, and 3D-viewer layouts were rendered at:

- Desktop: 1366 × 768
- Tablet/Chromebook: 768 × 1024
- Phone: 390 × 844

The sample included the IED course hub, unit hubs, early/middle/final lessons from multiple units, standard lesson activities, and the single- and dual-model lesson layouts.

### Issue found

The lesson-map tables on the Unit 2–5 hub pages were wider than a phone viewport:

| Unit | Original phone overflow |
|---|---:|
| Unit 2 | 277 px |
| Unit 3 | 246 px |
| Unit 4 | 301 px |
| Unit 5 | 242 px |

This made the Focus Question and Open columns extend beyond the visible screen.

### Correction applied

At phone widths, each lesson row now becomes a labeled card with separate sections for:

- Lesson
- Title
- Focus Question
- Open

The **Open Lesson** and **PPTX** controls remain visible, wrap cleanly, and retain a minimum 44-pixel interaction height. Desktop and tablet table layouts remain unchanged.

### Post-correction result

- Unit 2 phone page width: **390 / 390 px**
- Unit 3 phone page width: **390 / 390 px**
- Unit 4 phone page width: **390 / 390 px**
- Unit 5 phone page width: **390 / 390 px**
- Horizontal overflow after correction: **0 px**
- Clipped controls or labels in tested layouts: **0**

## Files changed

- `assets/css/ied-accessibility.css`
- `courses/ied/units/unit-2.html`
- `courses/ied/units/unit-3.html`
- `courses/ied/units/unit-4.html`
- `courses/ied/units/unit-5.html`

The four unit pages received an updated stylesheet version parameter so browsers do not continue using a cached copy of the older mobile table styling.
