# LockwoodSTEM Site QA Report

Completed QA pass on the student site package.

## Checks completed
- Verified all local HTML links, images, scripts, stylesheets, and download links resolve inside the ZIP.
- Confirmed HTML pages include language, title, viewport, skip link/main target, and image alt text.
- Checked for stale legacy ASE terminology in visible HTML pages.
- Checked for legacy AED unit references in visible HTML pages.
- Checked for unneeded resource-status labels on ASE template cards.
- Checked for obvious placeholder/development wording and cleaned the main visible course/resource sections.
- Checked common color contrast combinations used in the site theme.
- Verified no downloadable resources are empty.

## Fixes applied
- Added missing CSS support for `.card-grid` so unit/resource cards display consistently.
- Added a CSS variable alias for `--navy2` to prevent invalid gradient declarations.
- Replaced Advanced Manufacturing placeholder language with cleaner “In Development” language.
- Replaced ASE course resource placeholder text with direct links to the project brief packet, rover systems build guide, and template pack.
- Added ASE aerospace rover resources to the main Engineering Resource Library.
- Replaced unit-level resource placeholder wording with student-facing resource guidance.
- Removed internal VERIFY_*.txt development files from the public ZIP.

## Notes
- The current source ZIP uses an AED Units 0–5 structure. This QA pass did not restructure AED into Units 0–7.
- Teacher approval wording remains on certification pages because it is part of the student-facing certification process.


## Post-Rename URL/File QA

- Course URL folders renamed to full descriptive paths.
- Downloadable course files use AED/ASE naming.
- 6,476 local links/resources checked after rename.
- 0 broken local links/resources found.
