# LockwoodSTEM Laser Studio — Instructor Preset Publishing

Machine: OMTech 80W CO₂ laser, Ruida KT332N controller.

## Student-safe preset workflow

The student-facing page at `/laser-studio/` loads **only** `/laser-studio/profiles.json` from this website. Its local preset editor and arbitrary JSON preset import have been removed. Students cannot edit the published file through the website, but this is **not security against modifying exported SVGs or tampering with their own browser**. Never treat browser-selected metadata as authority to power a laser.

Only instructors with authorized write permissions to the LockwoodSTEM GitHub repository should edit `profiles.json`. Use protected branches, code review and limited repository write access where available.

## Before adding a profile

Validate speed, power and pass count **on your specific machine** with the **actual material and thickness**, correct lens/focus, air assist, exhaust, cooling and a supervised test. Follow the laser manufacturer’s and school's operating procedures. Never infer settings from a generic 80W estimate.

Edit `profiles.json` to add validated profile objects inside `profiles`. Example structure below uses placeholder strings in place of numeric settings. Replace all placeholders with measured numeric values; this example is **not an operational preset**.

```json
{
  "version": 1,
  "controller": "Ruida KT332N",
  "machine": "OMTech 80W CO2",
  "profiles": [
    {
      "id": "birch-plywood-3mm-v1",
      "label": "Birch plywood — 3 mm",
      "material": "Birch plywood",
      "thickness": 3,
      "verified": true,
      "cut": {"speed": "TESTED_MM_PER_SEC", "power": "TESTED_PERCENT", "passes": "TESTED_COUNT"},
      "engrave": {"speed": "TESTED_MM_PER_SEC", "power": "TESTED_PERCENT", "passes": 1}
    }
  ]
}
```

All speeds are numeric in **mm/s**, powers are numeric percentages from **0 to 100**, and passes are positive integers. Set `verified: true` only after **both** the cut and engraving settings have been tested on your machine. Use a unique `id` for every profile. The website validates type/range and rejects a malformed library entirely.

After committing the JSON file, refresh the Laser Studio and click **Refresh Presets**. Confirm the preset appears, the material and thickness match, and the readout contains the expected values.

## Classroom and machine safety

- Student browser mode never sends motion, framing, laser-on, or cut commands.
- The published profile cannot authorize machine operation by itself, and exported files are untrusted input.
- Before any future machine transfer feature, require independent instructor authentication, review, physical safety checks and a separate machine-side authorization gate.
- A static GitHub Pages site cannot securely enforce an instructor role merely through client-side JavaScript or a PIN.

The published library starts empty intentionally; no untested parameters are provided.
