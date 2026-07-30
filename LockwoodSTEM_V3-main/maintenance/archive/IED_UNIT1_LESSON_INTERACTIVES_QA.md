# IED Unit 1 Lesson-Specific Interactives — QA Report

## Scope

Added one unique, lesson-specific interactive to each of the 22 IED Unit 1 lesson pages. The previous repeated multiple-choice interaction was removed from each page. Existing lesson content, downloads, Student Tasks, Student Deliverables, and 3D model sections were preserved.

## Interactive Map

| Lesson | Interactive |
|---|---|
| 1.1 | Sketch communication annotation selector |
| 1.2 | Visible/object-line and hidden-line classifier |
| 1.3 | Hidden-slot line placement challenge |
| 1.4 | Click-to-place center and symmetry identifier |
| 1.5 | Adjustable isometric-axis box explorer |
| 1.6 | Ellipse viewing-angle and shading laboratory |
| 1.7 | Isometric-to-front-projection matcher |
| 1.8 | Missing orthographic-view puzzle |
| 1.9 | Dimensioning-error audit |
| 1.10 | Multi-view bracket consistency check |
| 1.11 | Accessible disassembly-sequence organizer |
| 1.12 | Documentation ambiguity stress test |
| 1.13 | Measurement-tool selector |
| 1.14 | Tolerance limit and inspection calculator |
| 1.15 | Connection-method trade study |
| 1.16 | Rocket system failure-chain explorer |
| 1.17 | Component-record consistency audit |
| 1.18 | Example exploded-view order organizer |
| 1.19 | BOM verification challenge |
| 1.20 | Reassembly sequence and checkpoint organizer |
| 1.21 | Engineering Change Request completeness review |
| 1.22 | Claim-to-evidence presentation planner |

## Files Added

- `assets/css/ied-unit1-interactives.css`
- `assets/js/ied-unit1-interactives.js`

## Pages Updated

- `courses/ied/units/unit-1/lesson-1-1.html` through `lesson-1-22.html`

Each lesson now includes an **Interactive** button in the mission-action area that jumps directly to the lesson-specific activity.

## Functional Testing

All 22 activities were tested in Chromium using the completed page markup with the site's CSS inlined for controlled QA.

- 22/22 activities initialized successfully.
- 22/22 Check/Review buttons changed the live feedback region.
- 22/22 correct-answer paths produced a success response.
- 22/22 incomplete or incorrect initial states produced instructional feedback.
- 0 JavaScript exceptions.
- 0 unhandled promise rejections.

## Responsive Testing

Tested every interactive at:

- Desktop: 1440 × 900
- Phone: 390 × 844

Results:

- 0 horizontal-overflow failures.
- All two-column activities stack to one column on narrow screens.
- Candidate-view grids, tables, sequence controls, and feedback panels remain usable on phones.
- Buttons retain a minimum 44-pixel target size.

## Accessibility Checks

- All activities use native buttons, checkboxes, selects, textareas, and range controls.
- Dynamic feedback uses `aria-live="polite"`.
- Choice buttons expose their selected state with `aria-pressed`.
- Sequence activities use explicit Up/Down buttons rather than mouse-only drag-and-drop.
- SVG diagrams include accessible names or are marked decorative.
- Keyboard focus indicators remain visible.
- Text and controls use the established high-contrast IED palette.

## 3D Model Preservation

The five Unit 1 STL files were hash-compared against the incoming QA-approved build and are unchanged:

- Lesson 1.2 model
- Lesson 1.3 model
- Lesson 1.4 model
- Lesson 1.6 Model A
- Lesson 1.6 Model B

The existing 3D viewer markup remains present on Lessons 1.2, 1.3, 1.4, and 1.6.

## Teacher-Supplied Assets

No additional assets are required for this release. Lessons 1.11 and 1.16–1.22 use clearly identified example/training rocket data so the interactives teach the documentation process without claiming to represent the exact classroom rocket.

For a future exact-rocket version, the useful optional inputs would be:

- One assembled-rocket photo from the front and side
- One disassembled-parts photo
- The preferred component names and quantities
- The actual assembly order

Those assets are optional and were not needed to produce a complete, functional Unit 1 interactive set.
