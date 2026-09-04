LockwoodSTEM Teacher Dashboard Navigation Duplicate Fix
========================================================

What this fixes
- Prevents a second Dashboard link from being injected when the header already contains Dashboard.
- Deduplicates any repeated header navigation destinations, keeping the first copy.
- Marks the existing Teacher Dashboard header link so older script logic also recognizes it.
- Cache-busts main.js on teacher-dashboard.html so the browser loads the corrected script.

Install
1. Extract this ZIP directly inside the active LockwoodSTEM_V3-main website folder.
2. Choose Replace the files in the destination.
3. Hard refresh the Teacher Dashboard once (Ctrl+F5) if it was already open.

No Apps Script deployment is required. This is website/front-end only.
