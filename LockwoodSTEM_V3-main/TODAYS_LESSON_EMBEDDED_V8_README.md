# Today’s Lesson Agenda — Embedded Visibility Fix v8

This patch embeds the Lesson Resources panel directly inside `agenda.html`. It no longer depends on `today-lesson.js`, `today-lesson.css`, or modifications to `agenda.js`.

Replace the included files at the repository root. The panel appears inside the main Day-view agenda card, directly above “Today in Class,” including in full-screen mode.
