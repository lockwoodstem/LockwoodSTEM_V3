# LockwoodSTEM Certification Apps Script

## Required Script Properties

- `AUTH_SECRET` — a long random value used when hashing permanent passwords.
- `TEACHER_SETUP_CODE` — optional private code for legacy first-teacher registration.
- `DEFAULT_TEACHER_TEMP_PASSWORD` — one-time temporary password used by `setup()` to provision the preconfigured Teacher Admin account.

## Default Teacher Admin provisioning

The account identity is preconfigured in `Code.gs`. The temporary password is not stored in the source code.

1. Add `DEFAULT_TEACHER_TEMP_PASSWORD` in **Project Settings → Script Properties**.
2. Run `setup()`.
3. The account is created or updated and marked to require a password change.
4. The temporary-password property is deleted automatically after successful provisioning.
5. Deploy a new Web App version.

The first sign-in redirects to `certifications/change-password.html`.
