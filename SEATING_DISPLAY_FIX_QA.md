# Seating Display Fix — QA Report

## Diagnosis

The uploaded repository did not contain `seating-display/index.html` or `robots.txt`. As a result, the hidden `/seating-display/` route could not load from the repository.

## Restored files

- `seating-display/index.html`
- `robots.txt`
- `SEATING_DISPLAY_FIX_README.md`

## Functionality

- Restores the hidden `/seating-display/` route.
- Uses the existing LockwoodSTEM Google Apps Script deployment.
- Opens in read-only display mode by default.
- Supports optional `period` and `layout` query parameters.
- Provides Refresh and Full Screen controls.
- Provides direct Open Display and Open Editor links.
- Displays sign-in guidance when the embedded Google app takes too long.
- Remains unlisted and marked `noindex`/`nofollow`.

## Validation results

- HTML parsed successfully.
- Duplicate HTML IDs: 0.
- Required local CSS, JavaScript, and logo files found.
- Inline JavaScript syntax check passed.
- Local HTTP route test passed.
- `robots.txt` excludes `/seating-display/`.
- Full repository ZIP integrity test passed.

## Important external dependency

The website wrapper cannot verify or repair the Google Apps Script deployment itself. The Apps Script deployment must remain active and accessible to the signed-in LockwoodSTEM account. If Google blocks sign-in inside the iframe, use **Open Display**, complete sign-in in the new tab, and then refresh the hidden website page.
