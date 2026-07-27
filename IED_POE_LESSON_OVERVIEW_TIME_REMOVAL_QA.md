# IED and POE Lesson Overview Time Removal QA

## Scope
Removed displayed minute values from the lesson pacing / Today in Class overview areas across the current IED and POE website.

## Changes
- IED Unit 0: removed 84 individual minute labels from 12 lesson timeline sections.
- IED Units 1-5: existing Launch / Learn / Apply / Check / Submit timelines were already time-free and were preserved.
- POE Units 0-5: removed 630 individual minute labels from 102 lesson pacing strips.
- Preserved every activity label and its original order.
- Added time-free pacing-card styling so the remaining labels stay balanced and readable.

## Files changed
- 114 lesson HTML pages.
- `assets/css/styles.css`.

## Validation
- Checked 400 IED and POE HTML pages.
- Verified all 12 IED lesson-timeline containers and all 102 POE pacing-strip containers.
- No minute labels remain in the targeted lesson-overview sections.
- No pacing cards were left empty.
- No duplicate HTML IDs were introduced.
- Compared 11,818 local references against the source build; no new missing links, missing assets, or broken anchors were introduced.
- Existing lessons, interactives, models, downloads, quizzes, and navigation were otherwise preserved.
