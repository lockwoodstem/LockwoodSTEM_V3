# LockwoodSTEM Certification System QA Report

**Build:** `2026-07-20-certification-qa-v1`  
**Result:** **26 passed, 0 failed**

## Consolidated system

This package replaces the overlapping certification patches with one authoritative certification build. It includes:

- 13 student certification modules
- Randomized practice and final-test answer choices
- Student progress and badge collection
- Separate student and teacher browser sessions
- Teacher and Teacher Admin backend authorization
- Teacher Admin-only shortcuts in the Certification Hub
- Student top-bar badge removal
- Student directory, pending hands-on queue, and complete badge profiles
- Hands-on approval and approval-removal controls
- Temporary-password change workflow
- Active Apps Script deployment URL configuration
- Consolidated cache-busting version references

## Automated QA results

| Check | Result | Detail |
|---|---|---|
| 13 certification landing pages | PASS | 13/13 |
| 13 randomized quiz scripts | PASS | 13/13 |
| 13 badge images | PASS | 13/13 |
| Answer choices randomized on render | PASS | All scripts use crypto-backed Fisher–Yates shuffle |
| Active Apps Script URL configured | PASS | https://script.google.com/macros/s/AKfycbxg3uyI11W4TYoTE5ZaCbgZWl0ZViItvzCCnfXFt4jgBa9HZs_BH8hk467qhITo6H41/exec |
| Separate student and teacher sessions | PASS | Isolated localStorage keys |
| Teacher Tools restricted to Teacher Admin | PASS | Student and Teacher roles do not receive the shortcut |
| Student top bar badges removed | PASS | Compact identity/actions bar only |
| Backend accepts teacher_admin | PASS | Shared authorization helper |
| Dashboard and approval endpoints present | PASS | Required endpoints found |
| Consolidated server version | PASS | Deployment diagnostic marker |
| No temporary password embedded | PASS | Password remains a Script Property |
| Teacher dashboard includes student badge profiles | PASS | Directory, pending queue, and badge dialog hooks |
| Teacher dashboard bypasses student auth guard | PASS | Uses isolated teacher-session validation |
| Teacher dashboard uses teacher token | PASS | Student login cannot overwrite approval session |
| Hands-on approvals use teacher token | PASS | — |
| Temporary password flow supported | PASS | — |
| Certification local links and assets resolve | PASS | No missing references |
| Certification pages use consolidated cache versions | PASS | qa1 references applied |
| Student has no Teacher Tools | PASS | — |
| Student has no top badge strip | PASS | — |
| Teacher Admin sees Teacher Tools | PASS | — |
| Teacher dashboard loads rich student directory | PASS | 1 of 1 student account(s) shown. |
| Pending approval queue loads | PASS | 1 |
| Teacher dashboard uses isolated token | PASS | ['teacher-token', 'teacher-token'] |
| Approval action uses isolated token | PASS | ['teacher-token'] |

## Testing performed

1. JavaScript syntax validation on all 21 browser-side certification scripts.
2. Apps Script syntax validation using a JavaScript copy of `Code.gs`.
3. Local certification link and asset resolution across all certification HTML pages.
4. Static authorization checks for `student`, `teacher`, and `teacher_admin` roles.
5. Browser component tests with mocked backend responses for:
   - student Certification Hub visibility
   - Teacher Admin Certification Hub visibility
   - isolated teacher-session validation
   - student directory rendering
   - pending approval rendering
   - hands-on approval requests using the teacher token
6. Verification that no temporary password is embedded in repository files.

## Important deployment requirement

The website files and Apps Script must be deployed together. The package includes:

`certifications/apps-script/Code.gs`

Replace the Apps Script project code with that file and deploy a **new version of the existing Web App deployment**. Keeping the existing deployment preserves the `/exec` URL already stored in `certifications/auth-config.js`.

After deployment, the backend should report:

`2026-07-20-certification-qa-v1`

## Manual acceptance test

1. Sign out of student and teacher accounts.
2. Sign in through `certifications/teacher-login.html` as Jonathan Lockwood.
3. Confirm **Teacher Dashboard** appears in the signed-in account bar.
4. Open the Certification Hub and confirm **Teacher Tools** appears.
5. Open the Teacher Dashboard and verify the student directory loads.
6. Sign in as a student in the normal student login.
7. Confirm the student does not see Teacher Tools or the top badge strip.
8. Return to the Teacher Dashboard and confirm it remains signed in.
9. Approve one pending hands-on certification and verify its badge unlocks.
10. Open multiple certification tests and confirm the correct answer is not consistently in the same position.

## Scope limitation

Automated tests validate the consolidated frontend and mocked backend contract. The live Google Apps Script deployment cannot be fully exercised until the included `Code.gs` is deployed in the connected Apps Script project.
