# Install the ADM Unit 4 Aerospace CNC Update

This is the consolidated update. It includes the complete Aerospace CNC Unit 4 rebuild plus the Fusion Manufacture, Mach3Mill, Mach3, and DMC2 Mini revisions.

## GitHub web upload

1. Open the GitHub repository that publishes LockwoodSTEM.org.
2. Download and extract this ZIP on your computer.
3. Open the extracted folder. You should immediately see folders named `assets`, `challenge-library`, and `courses`.
4. Upload those files and folders into the repository root. Do **not** upload the outer extracted folder as a new folder inside the repository.
5. Allow files with matching paths to replace the existing versions.
6. Delete every path listed in `DELETE_OLD_ADM_UNIT4_FILES.txt`.
7. Commit the changes to the branch used by GitHub Pages.
8. Wait for the GitHub Pages deployment to finish.
9. Open `https://lockwoodstem.org/courses/adm/units/unit-4.html` and perform a hard refresh (`Ctrl+F5`).

## Expected page title after deployment

`Aerospace CNC Manufacturing: From Design Requirements to Machined Prototype`

## Classroom workflow represented

Fusion Design → Fusion Manufacture → teacher-validated Mach3Mill post → `.tap` file → Mach3 → DMC2 Mini CNC mill

## Safety note

The generic Mach3Mill post and all feeds, speeds, work offsets, spindle behavior, safe-Z moves, and program-end behavior must be validated on the exact DMC2 Mini/Mach3 configuration before student machining.
