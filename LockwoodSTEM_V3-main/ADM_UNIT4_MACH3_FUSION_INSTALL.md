# ADM Unit 4 Mach3 + Fusion CAM Installation

This update assumes the aerospace CNC Unit 4 rebuild is already installed.

## Classroom workflow now used

- CAD: Autodesk Fusion Design workspace
- CAM: Autodesk Fusion Manufacture workspace
- Post processor: teacher-validated copy of Autodesk Mach3Mill
- NC output: `.tap`
- Controller: Mach3 configured for the DMC2 Mini
- Machine: DMC2 Mini CNC mill

## Install the update-only package

1. Extract the ZIP.
2. Open the `ADM_Unit4_Mach3_Fusion_Website_Update` folder.
3. Copy its contents into the root of the LockwoodSTEM repository.
4. Preserve the folder structure.
5. Replace existing files when prompted.
6. Commit and deploy the changes.
7. Clear the browser cache or perform a hard refresh.

## Required machine validation before student production

The Autodesk generic Mach3Mill post is used only as the baseline. Before students machine a component, verify the classroom copy against the actual DMC2 Mini and Mach3 profile:

- Machine units
- X, Y, and Z directions
- Homing/reference procedure
- Work offset and work-zero method
- Spindle control or manual spindle procedure
- Tool-change behavior
- Feed and spindle limits
- Safe Z and retract behavior
- Program end behavior
- Mach3 toolpath display and extents
- Raised-Z or single-block dry run

Do not permit student production until the teacher has validated the complete Fusion-to-Mach3-to-DMC2 workflow.
