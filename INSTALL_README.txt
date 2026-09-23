Bracket 3 Viewer Fix
=====================

Replace these three files in the repository:
- courses/ied/units/unit-2/lesson-2-5.html
- courses/ied/units/unit-2/lesson-2-6.html
- courses/ied/units/unit-2/lesson-2-7.html

Cause of the problem:
The previous embedded viewer omitted required data-stl-status, reset,
auto-rotate, and fullscreen controls. The shared stl-lesson-viewer.js
stopped during initialization before requesting the Bracket 3 model.

This update uses the same complete viewer markup used in Unit 1 Lesson 1.5
and reuses the existing Bracket 3 model data already in the repository.
