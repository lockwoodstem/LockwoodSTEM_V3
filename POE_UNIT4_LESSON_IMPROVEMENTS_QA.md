# POE Unit 4 Lesson Improvements QA

## Scope

POE Unit 4 was rebuilt as an 18-lesson mission-performance sequence. POE Units 0–3 were retained byte-for-byte from the Unit 3 master build.

## Lesson improvements

Each Unit 4 lesson now includes:

- a lesson-specific focus question, learning target, and success criteria;
- a three-step activity sequence connected to the Unit 4 mission investigation;
- one main deliverable with two focused evidence requirements;
- a dedicated **Interactive** jump button;
- a distinct data-analysis, statistics, kinematics, testing, or design-review interactive;
- previous/next lesson navigation and preserved PowerPoint downloads.

## Interactives added

1. 4.1 — Defensible mission-evidence chain
2. 4.2 — Independent, dependent, and controlled variable planner
3. 4.3 — Empirical reliability and failure probability
4. 4.4 — Frequency distribution and histogram binning
5. 4.5 — Mean, median, mode, and range analysis
6. 4.6 — Standard-deviation design comparison
7. 4.7 — Graph selection, axis assignment, and qualified claim
8. 4.8 — Distance, displacement, speed, and velocity
9. 4.9 — Acceleration and motion-graph interpretation
10. 4.10 — Free-fall estimate of gravitational acceleration and percent error
11. 4.11 — Projectile velocity-component analysis
12. 4.12 — Launch-angle and range reasoning
13. 4.13 — Launch-system energy-transfer sequence
14. 4.14 — Mission-investigation brief parser
15. 4.15 — Safe and repeatable test-plan sequence
16. 4.16 — Measurement-offset and calibration correction
17. 4.17 — Before-and-after iteration data analysis
18. 4.18 — Final mission-performance argument organizer

## Functional validation

- Lesson pages checked: **18**
- Correct-answer interaction paths executed in Chromium: **18 of 18 passed**
- JavaScript syntax check: **passed**
- Form controls inspected: **68**
- Local references inspected: **612**
- Local asset references inspected: **180**
- PowerPoint references inspected: **36** across **18 presentation files**
- Missing local references: **0**
- Duplicate IDs: **0**
- Unnamed buttons: **0**
- Unlabeled controls: **0**

## Responsive and visual validation

All 18 lesson interactives were rendered and measured in Chromium at:

- desktop: **1366 px** wide;
- phone: **390 px** wide.

Results:

- desktop horizontal-overflow failures: **0**;
- phone horizontal-overflow failures: **0**;
- responsive two-column workspaces collapse to one column on narrow screens;
- action-button text contrast was hardened against the existing course-wide contrast rules;
- representative histogram, projectile, iteration, and final-review pages were visually inspected.

## Change isolation

The completed build changes only:

- `courses/poe/units/unit-4.html`
- `courses/poe/units/unit-4/lesson-4-1.html` through `lesson-4-18.html`
- `assets/css/poe-unit4-interactives.css`
- `assets/js/poe-unit4-interactives.js`
- this QA report

POE Units 0–3 were compared with the Unit 3 master and showed **no changes**.
