LockwoodSTEM Teacher-Approved Password Reset — 2026-08-23

WHAT CHANGED
- Removed email-based password resets. No reset email is sent.
- Student Forgot Password now creates a teacher approval request.
- Teacher Dashboard has a Pending Password Resets section.
- Approving a request generates a one-time 6-digit code valid for 30 minutes.
- Teachers can also generate a reset code directly from a student's certification profile.
- Student enters email/student ID + 6-digit code + new password on reset-password.html.
- Five incorrect code attempts lock that code; teacher can generate a new one.
- Successful reset revokes existing student sessions.
- Reset codes are stored only as hashes; the plain code is shown only when generated.
- Existing pending-hands-on sorting and teacher-dashboard performance fixes are preserved.

WEBSITE INSTALLATION
1. Extract the CONTENTS of this ZIP directly into the active LockwoodSTEM_V3-main folder.
2. Choose Replace the files in the destination.
3. Files updated: certifications/login.html, auth-forms.js, reset-password.html, teacher-dashboard.html, teacher.js.

GOOGLE APPS SCRIPT — REQUIRED
1. Open the Apps Script project used by the LockwoodSTEM certification/student-account system.
2. Replace Code.gs with APPS_SCRIPT_BACKEND/Code.gs from this ZIP.
3. Save.
4. Run setup() once. This creates the PasswordResetRequests sheet. (The backend also creates it automatically on the first request.)
5. Deploy > Manage deployments > Edit the EXISTING Web App deployment > New version > Deploy.
6. Keep the same /exec URL. Do not create a different deployment URL unless you also update auth-config.js.

PASSWORD_RESET_URL and email authorization are no longer required. The old PasswordResets sheet may remain; it is ignored by the new flow.

STUDENT FLOW
Forgot Password > enter school email or student ID > Request Password Reset > ask teacher for approval/code > I already have a reset code > enter identifier + 6-digit code + new password.

TEACHER FLOW
Teacher Dashboard > Pending Password Resets > Approve & Generate Code. Give the code to the student in person.
OR: Student Directory > View Badges > Generate Password Reset Code.

BACKEND SERVER VERSION
2026-08-23-teacher-approved-reset-v1
