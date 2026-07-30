# Teacher Admin Authorization Fix

This fixes the case where the browser displays **Teacher Admin** but the backend returns **Teacher access is required**.

## Install

1. Replace the website files from this patch in the repository root.
2. Replace the Apps Script project `Code.gs` with `certifications/apps-script/Code.gs` from this patch.
3. Save and run `setup()` once.
4. Run `diagnoseTeacherAccount()` and confirm:
   - `serverVersion`: `2026-07-20-teacher-admin-self-repair-v1`
   - `role`: `teacher_admin`
   - `status`: `active`
5. Use **Deploy → Manage deployments → Edit → New version → Deploy**. Editing the existing deployment preserves the `/exec` URL already configured on the website.
6. Sign out and sign back in.

If you create a completely new Web App deployment instead, update `certifications/auth-config.js` with its new `/exec` URL.
