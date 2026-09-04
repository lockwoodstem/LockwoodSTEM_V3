# LockwoodSTEM Student-Facing Site Polish QA Report

## Scope

This pass audited the complete public LockwoodSTEM website using the latest IED/POE no-times build as the source.

- HTML pages in final build: 674
- Redirect/compatibility pages: 96
- Student-facing and general public pages reviewed for tone: 671
- Staff account pages intentionally retained as staff-facing: 3
- Local links, anchors, scripts, images, stylesheets, downloads, and embedded resources checked: 21,943
- JavaScript files syntax-checked: 42

## Student-focused language updates

- Replaced third-person course and unit descriptions with direct language such as “You will…” and “You can…”.
- Replaced `What Students Should Be Able To Do` with `What You Will Be Able to Do` on POE lessons.
- Replaced teacher-centered presentation descriptions with student-ready review guidance.
- Updated common labels such as `Student Task`, `Student Deliverables`, `Student Objective`, and `Today’s Student Work` to direct labels including `Your Task`, `What You Will Submit`, `Your Objective`, and `Today’s Work`.
- Replaced `teacher-led` wording with `guided` wording.
- Standardized public challenge wording from `instructor` to `teacher` where approval, limits, or provided materials are required. The official staff title on the About page was preserved.
- Replaced `45-Minute Flight Plan` with `Today’s Plan` and removed duration wording from lesson metadata.
- Refreshed the global search index so search results use the corrected student-facing text.

## Development and placeholder cleanup

The following visible language was removed from public pages and search data:

- In Development
- Will be added
- Placeholder project/page wording
- Coming soon
- Under construction
- Not yet available
- Teacher-led lesson descriptions

Forty-three ADM lesson pages that previously contained future-development messages now contain usable directions for following the focus question, class files, activity sequence, project checkpoints, evidence collection, and submission expectations.

## Functional and accessibility repairs

- Removed 54 broken POE Unit 1 presentation links because the referenced PPTX files were not present in the website package. The completed lesson pages and interactives remain available.
- Corrected 8 outdated navigation paths on POE unit pages.
- Removed an obsolete duplicate IED lesson folder and the public `_dev` status page.
- Repaired 4 missing internal anchor targets.
- Added accessible labels to 4 select controls in IED Lesson 1.22.
- Added a heading to one legacy JavaScript redirect page.

## Final static QA results

- Broken local references: 0
- Missing internal anchors: 0
- Duplicate IDs: 0
- Missing image alt attributes: 0
- Unnamed buttons: 0
- Unlabeled form controls: 0
- Placeholder links: 0
- Public development messages: 0
- Teacher-led wording on public pages or data: 0
- Old third-person POE lesson-target heading: 0
- JavaScript syntax errors: 0

## Browser runtime note

A browser-based local-host rendering pass was attempted, but the managed Chromium environment blocked local URLs with `ERR_BLOCKED_BY_ADMINISTRATOR`. Static HTML, link, anchor, control-label, asset, search-data, and JavaScript validation completed successfully. No browser-runtime result is claimed beyond those checks.
