LockwoodSTEM Student-Facing Lesson Copy Cleanup
Version: 2026-08-23

PURPOSE
Removes internal/developer placeholder language from student lesson pages without
replacing the lesson HTML files themselves. This prevents the patch from undoing
newer lesson presentations, resources, worksheets, or other page-specific updates.

WHAT IT FIXES
- "This page is ready for lesson directions, resources, code, files, or project evidence when they are added."
- Similar "coming soon", "will be added", "not yet available", "placeholder", and "under construction" wording on lesson pages.

HOW THE REPLACEMENT WORKS
- In the Lesson Focus card, unfinished copy becomes: "Your goal: [the actual lesson summary]"
- In a resource area, unfinished copy becomes a student instruction for using class/linked materials.
- Elsewhere, unfinished copy becomes a direction to complete the lesson sequence and document evidence.

AUDIT RESULT
The current website archive contained 30 student lesson pages with the exact unfinished
sentence, all in ADM Units 1-3. IED and POE did not contain that exact sentence in the
audited archive.

INSTALL
Extract this ZIP directly inside the active LockwoodSTEM_V3-main folder and replace
existing files. Then hard-refresh the site once (Ctrl+F5).

PATCH STACKING
This main.js is based on the version that includes the Teacher Dashboard navigation
deduplication fix, so that fix is preserved.
