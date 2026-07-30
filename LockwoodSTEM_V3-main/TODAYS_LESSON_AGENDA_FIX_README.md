# Today’s Lesson agenda visibility fix

This patch keeps the existing homepage integration and makes the agenda action area reliable.

## Updated files
- `index.html`
- `agenda.html`
- `assets/js/today-lesson.js`
- `assets/css/today-lesson.css`

The agenda page now has a dedicated action panel directly below the rendered Day view. It uses the lesson index when available and falls back to the course or unit hub if matching fails.
