# Laser Studio — Experimental Ruida RD compiler (offline only)

**Status:** Prototype, **NOT VALIDATED ON OMTech KT332N**. No live laser file transfer is implemented. Do not upload an exported experimental RD file to a physical laser until it has been independently decoded, checked against a known-good machine-generated test file and reviewed under the school's laser safety procedure.

## Scope implemented

- One **axis-aligned rectangle** in the **CUT** layer.
- One pass only; the speed and laser power come from a separately instructor-published, locally tested preset.
- Ruida header, one cut layer, absolute move/cut path and trailer, with RUIda 0x88 byte scrambling.
- Result can be previewed in the browser and exported as a local `.experimental.rd` file in the **Advanced** panel.
- **No USB transmission of this file**, no framing, no machine start, and no direct laser control.

The structure follows the independent reverse-engineered [ruida-laser generator](https://github.com/jnweiger/ruida-laser/blob/master/src/ruida.py) and the [MeerK40t command definitions](https://github.com/meerk40t/meerk40t/blob/main/meerk40t/ruida/rdjob.py). These are references, not a claim that the format or machine coordinate system has been confirmed on this specific controller.

## Validation performed

The browser JavaScript was syntax checked and the compiler was run offline with a 40 × 20 mm rectangle at (10,20). It produced a 532-byte experimental RD draft, with 120 mm cut length; scrambling and unscrambling recovered every original byte. This establishes internal byte consistency **only**.

Still necessary before any live job transfer:

1. Independently decode an offline generated RD file and confirm all header/layer/power/speed/path/trailer commands.
2. Compare one fixed rectangle against a known-good RD file exported from verified existing software, to establish differences including origin modes, feeding, job flags, air assist and machine-specific parameters.
3. Independently verify material profile authority (not editable browser state) and require instructor-controlled execution.
4. Validate protocol packetization, controller acknowledgments, failure recovery and connection cleanup **without executing a laser job**.
5. Perform supervised physical commissioning with appropriate fire, cooling, exhaust, interlock and machine safety provisions before enabling anything that might move or fire the laser.

## Student workflow

The default page is intentionally simple: design, select a material preset, review and export artwork. Advanced diagnostics and experimental files are hidden behind an **Advanced** toggle. SVG design-only export remains available even when the instructor has not published a validated material preset. Machine job compilation/export is separate and requires a published, verified preset.

## Important distinction

A downloaded `.experimental.rd` file contains machine commands; even though this site **never transmits** the bytes, it must not be considered safe or ready to execute. Keep it in a controlled instructor testing folder. No direct software-only procedure substitutes for physical laser safety.

## LightBurn screenshot reference — 19 November 2026

The user supplied a LightBurn workspace screenshot showing the selected rectangle at **XPos 25.000, YPos 15.000, Width 40.000, Height 20.000 mm**, with the **center anchor** selected in LightBurn's nine-point position selector. Converting center position into axis-aligned extents yields **X 5–45 mm and Y 5–25 mm**, matching the bounds read from the user's saved reference RD file. This removes the apparent 20 mm X and 10 mm Y discrepancy; do not add an arbitrary offset in the compiler to compensate.

The screenshot also shows **Absolute Coords**, **Ruida KT332N**, a **700 × 500 mm displayed workspace**, and upper-right-side zero on the LightBurn canvas. These are screenshot observations and **do not independently prove controller-specific motion direction or homing behavior**. The layer shows **Line**, **15.00 mm/s**, **20.00% min power**, **35.00% max power**, **1 pass**. The experimental offline RD compiler now accepts an optional separate `profile.cut.minPower`, defaulting to `profile.cut.power` for older profiles. This change has not been validated against the laser; **live machine commands remain disabled**.
