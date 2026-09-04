LOCKWOODSTEM STUDENT FORGOT-PASSWORD FIX

WHAT THIS ADDS
- “Forgot your password?” section on certifications/login.html
- Student enters school email or student ID
- A one-time reset link is emailed to the school email already stored on the account
- Reset link expires after 30 minutes
- Student chooses a new password (minimum 10 characters)
- All existing sessions for that student are revoked after the reset
- No plaintext password is emailed or stored

WEBSITE INSTALL
1. Extract the contents of this ZIP directly inside your active LockwoodSTEM_V3-main folder.
2. Choose Replace the files in the destination.
3. Upload/publish the changed website files.

GOOGLE APPS SCRIPT BACKEND INSTALL — REQUIRED
1. Open the Apps Script project used by the LockwoodSTEM student/certification accounts.
2. Replace Code.gs with APPS_SCRIPT_BACKEND/Code.gs from this package.
3. In Apps Script Project Settings > Script Properties, add:
   PASSWORD_RESET_URL = https://lockwoodstem.org/certifications/reset-password.html
   (Only change this if your live site uses a different URL.)
4. Save.
5. Run setup() once from the Apps Script editor. This creates the PasswordResets sheet if needed.
6. Google may ask you to authorize email-sending permission because the reset flow uses MailApp. Approve the permission.
7. Deploy > Manage deployments > Edit > New version > Deploy. KEEP THE SAME WEB APP DEPLOYMENT so the /exec URL remains unchanged.

TEST
1. Open the Student Login page.
2. Expand “Forgot your password?”
3. Enter a test student’s email or student ID.
4. Check that student’s school email.
5. Open the reset link and choose a new password.
6. Verify the student can sign in and that any old session was revoked.

SECURITY NOTES
- The public request message is intentionally generic so the page does not reveal whether an account exists.
- Only active student accounts are eligible for this self-service reset.
- Reset tokens are stored as hashes and are single-use.
- Requests are throttled to one email per student every five minutes.
