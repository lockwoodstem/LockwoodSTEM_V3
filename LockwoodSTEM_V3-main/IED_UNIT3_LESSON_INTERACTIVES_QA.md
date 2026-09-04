# IED Unit 3 Lesson-Specific Interactives QA

## Scope
- Updated all 17 IED Unit 3 lesson pages.
- Added one lesson-specific interactive to each lesson.
- Added an **Interactive** jump button to each lesson hero.
- Removed the repeated generic multiple-choice evidence check from each Unit 3 lesson.
- Preserved all Unit 1 and Unit 2 lesson files unchanged.
- Preserved all existing 3D models and interactives.
- Added the supplied classroom rocket STL as the assembly reference in Lesson 3.1.

## Interactives added
1. Fit decision from tolerance evidence
2. CAD component and assembly file organizer
3. Part insertion and positioning sequence
4. Alignment and planned-clearance dashboard
5. Joint and motion relationship selector
6. Fin symmetry pattern builder
7. Pre-print revision triage
8. Exploded-view spacing builder
9. Motion and interference limit check
10. Rocket print-submission planner
11. Physical prototype build sequence
12. Fit-test data revision decision
13. Technical drawing-sheet region activity
14. Part and assembly view-set selector
15. Balloon, parts-list, and revision matcher
16. Final design-package audit
17. Final presentation story organizer

## Functional validation
- 17/17 correct-answer paths tested successfully in a headless browser.
- 0 JavaScript page errors during interactive tests.
- JavaScript syntax check passed.
- All 17 pages contain the Unit 3 interactive stylesheet and script.
- All 17 pages contain an Interactive jump link.
- No old generic interactive cards remain.

## Accessibility and markup validation
- 139 interactive controls checked.
- No unnamed buttons.
- No unlabeled select or text/range controls.
- No duplicate IDs.
- Visible keyboard focus rules included.
- Live feedback regions use `aria-live="polite"`.
- Primary interactive buttons use white text on dark blue; choice controls use dark text on white.

## Link and asset validation
- 563 local links and assets checked.
- 563/563 resolved successfully.
- Supplied rocket model copied to:
  `assets/models/ied/unit-3/unit-3-rocket-assembly-reference.stl`

## Responsive visual checks
Representative lessons 3.4, 3.8, 3.13, and 3.17 were rendered at:
- 1365 × 900 desktop
- 390 × 844 phone

Results:
- 0 horizontal overflow at either size.
- Interactive grids stack into one column on narrow screens.
- Drawing-sheet labels were adjusted for phone readability.
- Exploded-view, alignment, and sortable activities remain usable on phone screens.
