# POE Unit 1 Lesson Improvements QA

## Scope

Updated all 18 canonical POE Unit 1 lesson pages under:

`courses/poe/units/unit-1/`

POE Unit 0 and POE Units 2–5 were not modified. IED content and interactives were not modified.

## Improvements applied to every lesson

- Replaced the repeated generic activity flow with a lesson-specific three-part sequence.
- Replaced the repeated generic success statement with lesson-specific performance criteria.
- Simplified student work to one focused deliverable with two clear requirements.
- Removed the repeated “Questions Before Answers” reveal-card section.
- Added a lesson-specific interactive activity.
- Added an Interactive jump button in the lesson hero.
- Added accessible labels, keyboard-focus styles, feedback regions, and responsive layouts.

## Lesson-specific interactives

1. **1.1** Rover lift input–process–output systems map
2. **1.2** Aerospace simple-machine classifier
3. **1.3** Work, actual mechanical advantage, and efficiency analysis
4. **1.4** Gear ratio, speed, torque, and direction explorer
5. **1.5** Pulley mechanical-advantage configuration challenge
6. **1.6** Sprocket ratio and chain-direction explorer
7. **1.7** VEX mechanism build-quality audit
8. **1.8** Work, power, and efficiency calculator
9. **1.9** Aerospace energy-conversion chain
10. **1.10** Ohm’s law and electrical-power check
11. **1.11** Motor load, speed, and current operating-point simulator
12. **1.12** Rover challenge design-brief parser
13. **1.13** Weighted mechanism decision matrix
14. **1.14** Mechanism sketch and build-plan audit
15. **1.15** Prototype Build Day 1 sequence organizer
16. **1.16** Powered-mechanism troubleshooting path
17. **1.17** Repeatability, anomaly, and data-analysis activity
18. **1.18** Final design-review evidence organizer

## Validation completed

- 18/18 pages contain one Unit 1 interactive.
- 18/18 pages contain an Interactive jump link.
- 18/18 repeated generic reveal sections were removed.
- JavaScript syntax check passed with `node --check`.
- 540 local page links and 144 local CSS/JS/image references were inspected.
- No missing local assets were introduced by this update.
- No duplicate IDs were found.
- 145 interactive controls were checked for accessible names or labels.
- No unnamed buttons or unlabeled controls remain.
- File comparison confirmed that only the 18 Unit 1 pages, the two new shared assets, and build documentation changed.

## Existing presentation-file issue

The master website contains PowerPoint links for all 18 POE Unit 1 lessons, but the corresponding `POE_Unit1_Lesson_*.pptx` files were not present in the supplied master site. Those existing links were preserved rather than silently removing or replacing them. The interactive update does not create or modify lesson presentations.
