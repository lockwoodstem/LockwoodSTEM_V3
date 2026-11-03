# LockwoodSTEM AI Programming Studio

The browser-only React/TypeScript Studio at `/studio/` combines Python, live vision,
optional AI predictions, simulated hardware, and a standardized Arduino bridge.
Students do not install Python, an agent, or a local server. No keys or credentials
are bundled. Existing site routes and the older `/vision/` and `/lab/` remain intact;
they link to Studio. `/lab/train/` remains the shared Model Builder.

## Student workflow

1. Open a saved named project, create/duplicate one, or load a starter.
2. Choose Program for one-shot Python, or Live vision for `process_frame(frame)`.
3. For vision, start the camera. Optionally load object detection or a saved classifier.
4. For hardware, select Simulator or USB Arduino and explicitly Arm hardware.
5. Run. Stop terminates the Python worker, stops the camera and disarms hardware.
6. Export `.py` or Export submission (JSON with code, input, mode, console and timestamp).
   Upload that file to the teacher's LMS. Studio does not send submissions itself.

## Vision and AI

Each live run evaluates the script once, then calls `process_frame(frame)` for each
camera frame. Callback globals persist for motion tracking. The input is copied
RGBA uint8 NumPy data. Return gray, RGB or RGBA; `None` uses the input. Use RGB,
not OpenCV BGR, for three-channel output. Async callbacks are supported. A program
can also call `show_image(image)`; at most one image is emitted per run/frame.

Only one capture/inference/Python frame cycle is active at a time. Resolution is
320/480/640 px; target rate is 3/7/12 FPS, an upper bound rather than guaranteed
throughput. Frames are not queued. The processed preview is separate from the
camera view, with a processed-frame counter. Images are memory-only and excluded
from autosave/submission. Stop remains responsive even to infinite Python loops.

Starters carry forward face detection, edges, green tracking, motion, ArUco markers,
COCO-SSD boxes and custom classifier overlays. `get_detections()` returns
`[{label, score, bbox:[x,y,w,h]}]`; `get_custom_prediction()` returns
`[{label, score}]`. These reflect the current live frame. AI downloads are opt-in;
model errors appear in the UI/console. `get_frame()` still supports captured snapshots.

The existing Model Builder supports browser datasets, training/import/export,
validation and bounding-box annotation. It shares the saved
`lockwoodstem-classifier-model` database with React Studio. React consumes the
MobileNet v2 alpha 0.5 centroid classifier format without modifying its datasets.
Custom bounding-box model training and a chat/code assistant are not implemented.

## Hardware

See [wiring, protocol, safety behavior and physical validation](docs/HARDWARE.md).
`await arduino.led(bool)`, `await arduino.servo(0..180)`, `await arduino.sensor()`
and `await arduino.stop()` work in both modes. Simulation displays LED/servo state
and a 0–1023 sensor slider. USB uses acknowledged, ID-correlated text commands,
bounded parsing, a single outstanding request, timeout handling and a version handshake.

Run completion/error disarms hardware. Browser heartbeats maintain the board's
1500 ms firmware watchdog only while armed. Standard firmware targets Uno R3 /
classic Nano, D13 LED, D9 servo, A0 sensor. Teacher flashing is a one-time prerequisite;
there is no in-browser firmware uploader. Servo detach does not brake a load.

## Projects and migration

IndexedDB `lockwoodstem-studio` version 2 adds a project library with stable IDs.
Upgrade copies the version-1 `current` draft; the current slot remains compatible.
The old `lockwood_unified_studio` localStorage draft is copied once to a separate
recovered project without deleting the source. Invalid legacy data is ignored;
invalid current data shows an export/storage warning instead of overwriting it.
The original Live Vision Lab has no persisted draft to migrate.

Autosave confirms transaction completion. JSON import validates the format and
project fields and creates a new ID after confirmation. Export contains no webcam
images or hardware permissions. Browser storage is per origin/profile, not account
sync; export on shared school devices. Use one editing tab at a time: the last
writer wins if two tabs edit the same project ID.

## Architecture and build

- `src/main.tsx`: runtime generation guards, bounded live scheduling, projects/console.
- `src/Devices.tsx`: camera lifecycle, previews, opt-in AI and hardware controls.
- `src/hardware.ts`: simulation and Web Serial state machine.
- `src/ai.ts`: COCO-SSD and existing custom classifier integration.
- `public/python-worker.js`: pinned Pyodide 0.27.7; Python API, image and hardware RPC.
- `src/storage.ts`: IndexedDB v1→v2 migration, named library and current project.

Maintainers use Node 24, pnpm 11.25.0:

```sh
cd studio-app
pnpm install --frozen-lockfile
pnpm build
pnpm exec playwright install chromium
pnpm test
```

Build writes only `../studio/`. Commit source and generated output together.
`node scripts/serve.mjs` serves the repository at localhost:4173. The existing
Studio QA workflow builds, checks generated assets and runs Playwright. Other site
pages retain their original static navigation and do not depend on React.

Internet access is needed for Pyodide/packages and optional models. Allow jsDelivr
and the model-host download URLs permitted by school policy. Offline availability
is not guaranteed. HTTPS (or localhost) is required for media/serial. Desktop
Chrome/Edge are the initial USB targets; simulation remains available elsewhere.
Python is a coding environment, not a security sandbox: student code can make
browser-permitted network requests. No camera/code uploads are performed by Studio.

## Validation and release

Tests use real Pyodide/OpenCV with browser fake camera input, plus mocked serial
streams. They cover existing Python behavior, live output/errors/Stop, simulator,
project migration and submission round trip, fragmented replies and serial timeout.
Physical camera, managed browser permissions, USB reset/unplug behavior, servo
wiring and firmware watchdog behavior still require the hardware checklist.
Review/merge the feature PR and publish via the existing static hosting process.
No CNAME, account service or server change is needed.

References: [Pyodide workers](https://pyodide.org/en/0.27.7/usage/webworker.html),
[Web Serial lifecycle](https://developer.chrome.com/docs/capabilities/serial).

## Classroom build

The Classroom launchpad adds guided first-run setup and three complete lessons:
sensor-controlled outputs, color detection and a vision-controlled sorter. Lessons
open new named projects, preserving the current project before switching. Run
preflight checks the lesson's mode and required hardware arming; camera readiness
uses the existing live-run check. Self-check evidence and reflection are stored in
optional project metadata, compatible with existing IndexedDB v2 records and JSON
submissions. Imported lesson metadata is validated before replacement.

The simulator adds an animated servo diagram, sensor meter and boundary presets,
and manual LED/servo tests through the same arming gate. Manual commands are
simulation-only and disabled during Python runs. USB arming waits for the firmware
handshake. Connection help and specific camera errors guide recovery.

See [the classroom guide](docs/CLASSROOM.md) for lesson timing, assessment and the
physical-device validation record. No AI coding assistant will be added to this
build. Existing optional vision classifiers remain separate and are not needed for
these lessons. No backend, API key or account service was introduced.
