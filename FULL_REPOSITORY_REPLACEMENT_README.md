# LockwoodSTEM Full Repository Replacement

This repository contains the complete LockwoodSTEM website with the former ADM Unit 4 cybersecurity and supply-chain pages removed.

ADM Unit 4 is now:

**Aerospace CNC Manufacturing: From Design Requirements to Machined Prototype**

The production workflow is:

**Fusion Design → Fusion Manufacture → teacher-validated Mach3Mill post → `.tap` file → Mach3 → DMC2 Mini CNC mill**

## Replacing the existing GitHub repository

1. Back up the current repository.
2. Delete the existing repository contents, including old ADM Unit 4 files.
3. Copy every file and folder from this `LockwoodSTEM_V3-main` folder into the repository root.
4. Preserve hidden files, especially `.nojekyll`.
5. Commit and push the replacement to the branch used by GitHub Pages.
6. Wait for GitHub Pages deployment to finish.
7. Open the ADM Unit 4 page and perform a hard refresh.

Expected Unit 4 page:

`courses/adm/units/unit-4.html`

## Important CNC note

The included Mach3 and G&M-code materials use a classroom instructional subset. Before physical machining, the teacher must validate the DMC2 Mini Mach3 profile, spindle-control behavior, work-offset procedure, post processor, supported commands, tools, speeds, feeds, safe-start blocks, and program-ending behavior.
