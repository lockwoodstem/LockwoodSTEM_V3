# Teacher Session, Student Top Bar, and Role Visibility Fix

This update fixes three related account-display issues:

- Teacher Admin uses a dedicated teacher session on the teacher dashboard, so signing in as a student no longer replaces the teacher dashboard session.
- Student certification badges are removed from the signed-in top bar. Badges remain available on **Progress** and **My Badges**.
- Teacher Dashboard, Teacher Tools, and teacher-account controls are hidden from student accounts.

## Install

Extract this ZIP into the repository root and replace the included files. No Apps Script or `Code.gs` update is required.

After publishing:

1. Open `certifications/teacher-login.html`.
2. Sign in once with the Jonathan Lockwood Teacher Admin account.
3. The teacher dashboard will use that dedicated teacher session.
4. Student sign-ins can then be used in other tabs without exposing teacher tools or replacing the teacher session.

The package does not include or modify `CNAME`.
