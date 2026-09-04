# Certification Answer-Order Randomization

This patch updates all 13 certification quiz scripts.

## What changes

- Each question's choices are shuffled independently when a practice or final test loads.
- The question order stays the same.
- Correct-answer values remain unchanged, so existing grading, feedback, pass/fail rules, attempts, and badges continue to work.
- Refreshing or reopening a test generates a new answer order.
- A correct answer may still appear first occasionally by chance, but it will no longer be the first choice for every question.

## Installation

Extract the ZIP into the repository root and replace the JavaScript files in `certifications/`. No Apps Script update is required. After publishing, hard-refresh one test page with Ctrl+Shift+R to clear the old cached scripts.
