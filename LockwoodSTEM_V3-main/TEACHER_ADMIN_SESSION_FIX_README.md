# Teacher Admin Session and Authorization Fix

This update fixes two separate causes of the recurring **Teacher access is required** message:

1. The teacher dashboard was reading the normal student session token. A student login could overwrite it.
2. The backend must accept `teacher_admin` and repair Jonathan Lockwood's designated admin account when it validates.

## Website files

Extract the ZIP into the repository root and replace the included files.

## Apps Script

Replace the current `Code.gs` with the included file. Run `setup()` once, then edit the existing Web App deployment and choose **New version**. Keep the same `/exec` URL.

## Sign-in

After publishing the site files and Apps Script version, open `certifications/teacher-login.html` and sign in once. The dashboard now stores its token under a dedicated teacher-session key, so later student logins cannot overwrite it.
