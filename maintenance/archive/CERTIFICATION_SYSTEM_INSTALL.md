# Certification System Installation

1. Extract this ZIP into the LockwoodSTEM repository root.
2. Replace the existing `certifications/` directory and the included certification CSS/badge assets.
3. Commit and publish the website changes.
4. Open the connected Google Apps Script project.
5. Replace the complete contents of `Code.gs` with `certifications/apps-script/Code.gs` from this package.
6. Save and run `setup()` once.
7. Choose **Deploy → Manage deployments → Edit**.
8. Select **New version** and deploy the existing Web App.
9. Keep the same `/exec` URL.
10. Hard-refresh the Certification Hub and sign in again through the Teacher Login page.

The package does not include or modify `CNAME`.
