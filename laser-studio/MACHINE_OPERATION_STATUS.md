# Laser Studio — Send, Frame, Start status

Updated 2026-11-19 for OMTech 80W CO2, Ruida KT332N, COM3 FTDI 0403:6001.

## Available in the student browser
- Build a design, select a published material demonstration profile, and inspect/export project artwork.
- Run the virtual **Send to Simulator → Frame Preview → Start Simulation** workflow.
- The virtual frame draws an orange dashed bounding rectangle around the artwork on the screen; it **does not move the laser head**.
- The virtual start finishes a browser-only state machine and **does not energize the laser**.
- In Advanced mode, instructor USB diagnostics can query the controller Card ID only after explicit acknowledgement. The query is the sole live transmitted request currently implemented.
- Experimental .rd compiler is offline only and accepts one rectangle with one instructor-verified preset. It is not validated for machine use, and no .rd transfer routine exists.

## Why hardware commands are not enabled
The actual Ruida .rd encoder, job transport, start behavior, coordinate origin, hardware interlocks, and failure handling have not been validated against the KT332N. The two prepublished 3mm material profiles are explicitly unverified. A successful Card ID query establishes protocol request/response but not job execution compatibility.

Do **not** upload experimental RD files, bypass safety interlocks, run unattended, or rely on client-side JavaScript for instructor authorization.

## Commissioning checklist
1. **Independent decoding:** independently decode the experimental 1-rectangle RD output and verify every command, layer, units and trailer; compare to a known-good file from this exact controller.
2. **Geometry and calibration:** establish physical bed size, origin, reference behavior and safe no-laser frame behavior.
3. **Material tests:** calibrate real cut/engrave power and speed for each approved material with instructor supervision. Do not use DEMO values in production.
4. **Transport:** verify RD file upload protocol and responses, abort/error conditions, port cleanup and controller state. Job-sending must not implicitly execute a job before separate review.
5. **Execution:** implement an independently authenticated instructor approval gate and physical readiness checks; do not let students arbitrarily command or power the machine through an untrusted browser.
6. **Physical acceptance:** supervised testing with cooling, exhaust, air assist, fire detection, safety glasses as required, emergency stop and interlocks operational.

Machine operation is not implemented in this release. The interface is intentionally explicit about simulation status.
