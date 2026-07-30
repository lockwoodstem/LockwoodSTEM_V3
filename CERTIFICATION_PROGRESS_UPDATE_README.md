# Certification Progress and Badge Collection Update

This patch adds:
- Student progress summaries and status labels
- Best score, attempts, completion dates, and teacher-approval tracking
- A dedicated `certifications/badges.html` badge collection
- Earned, pending, retake, and locked badge states
- Equipment-access unlock indicators
- Improved account progress dashboard
- Teacher dashboard limited to certifications that actually require hands-on approval

## Deploy the website files
Extract the ZIP into the repository root and allow the included files to replace existing versions. `CNAME` is not included.

## Update the Apps Script backend
Replace the current Apps Script `Code.gs` with `certifications/apps-script/Code.gs`, save the project, and redeploy the Web App as a new version. Keep the existing Web App URL when possible.

The backend update makes academic and professional certifications earn badges after an 80% online score, while 3D Printing, Laser Cutting, CNC, Drill Press, Soldering, and Hand & Cutting Tools also require teacher hands-on approval.
