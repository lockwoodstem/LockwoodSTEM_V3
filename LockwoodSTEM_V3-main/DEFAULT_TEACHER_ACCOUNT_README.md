# Default Teacher Admin Account

This update preconfigures the following account in the certification backend:

- Display name: Jonathan Lockwood
- Email: jlockwood@cornerstonecharter.com
- Teacher ID: JLOCKWOOD
- Role: Teacher Admin
- Status: Active
- Password change required at first sign-in: Yes

The temporary password is intentionally **not stored in the website repository or Code.gs file**.

## Install the website files

Extract this update into the repository root and replace the included files.

## Update Google Apps Script

1. Open the Google Apps Script project used by the certification system.
2. Replace the existing `Code.gs` with `certifications/apps-script/Code.gs` from this update.
3. Open **Project Settings → Script Properties**.
4. Keep the existing `AUTH_SECRET` property.
5. Add a temporary property named `DEFAULT_TEACHER_TEMP_PASSWORD` and enter the temporary password selected for this account.
6. Save the property.
7. Run the `setup` function once from the Apps Script editor and authorize it when prompted.
8. Confirm the execution result says the default Teacher Admin account was created or updated.

After successful provisioning, `setup()` automatically deletes the `DEFAULT_TEACHER_TEMP_PASSWORD` Script Property so the temporary password is not retained there.

## Deploy

1. Choose **Deploy → Manage deployments**.
2. Edit the current Web App deployment.
3. Select **New version**.
4. Confirm **Execute as: Me** and the existing access setting.
5. Deploy.
6. Keep the existing `/exec` URL in `certifications/auth-config.js` unless Google provides a different URL.

## First sign-in

1. Open `certifications/teacher-login.html`.
2. Sign in with either the configured email address or Teacher ID `JLOCKWOOD`.
3. Use the temporary password.
4. The site redirects to `change-password.html`.
5. Create a new permanent password of at least 10 characters.
6. After the change, the Teacher Dashboard opens with student records, badge collections, and hands-on approval controls.

## Notes

- Running `setup()` again does not create a duplicate account.
- When the temporary-password Script Property is present, running `setup()` intentionally resets this default account to that temporary password and requires another password change.
- Teacher Admin accounts can create additional Teacher or Teacher Admin accounts.
- Standard Teacher accounts can review students and approve hands-on certifications but cannot create additional teacher accounts.
