# LockwoodSTEM AI Programming Studio — Phase 1

A browser-only Python lab integrated into the existing static LockwoodSTEM site at `studio/index.html`. Students need no installation, account, API key, local Python, or local Arduino tools.

## What ships

- React + TypeScript application; bundled Monaco Python editor, font controls, keyboard Run shortcut, and plain-text alternative.
- Pyodide 0.27.7 in a dedicated classic Web Worker. Run captures stdout/stderr and Python tracebacks. Stop terminates the worker, including tight infinite loops. Restart creates a fresh runtime. Programs have fresh global variables on each run; imported modules remain cached until restart.
- Bounded output (60,000 characters / 500 output messages per run) keeps printing loops from overwhelming the page.
- IndexedDB autosaves filename, code and input after each edit, with commit-based save status and explicit storage-error messaging. Restore finishes before editing is enabled. No account sync or multi-device storage; export on shared devices. Multiple tabs share the same current-project slot: use one studio tab at a time.
- UTF-8 `.py` import/export, a 1 MB import limit, safe export filenames, and a replacement confirmation before examples/imports overwrite the editor.
- Program input supplied before Run, one answer per line. Exhausting the queue gives EOFError. This is not an interactive terminal or a REPL.
- Opt-in webcam preview and snapshot bridge: `get_frame()` returns a copied NumPy RGBA array. Python `cv2` imports load the bundled OpenCV package. Camera access stops on tab hiding and unmount. Captures are memory-only; there is no automatic camera upload or saved photo.
- Web Serial capability detection and optional connect/disconnect at 115200 baud. This is a connection prototype, not a Python-to-board bridge, serial monitor, compiler or firmware uploader. Opening a serial port can reset a board. Test real boards before classroom use.

No AI assistant or model API is connected yet. Live OpenCV video, rendered image output, Arduino messaging/firmware upload, teacher-managed lessons, and project libraries remain future phases.

## Architecture

`src/main.tsx` owns program, runtime and console state. `Editor.tsx` bundles Monaco and its worker locally. `public/python-worker.js` loads pinned Pyodide assets from jsDelivr and executes user code away from the UI thread. `storage.ts` wraps IndexedDB transactions. `Devices.tsx` owns browser permission requests and device cleanup. Each Run copies the latest captured frame to the Python worker; no SharedArrayBuffer or cross-origin isolation headers are required.

Worker termination is the cancellation boundary. It drops Python memory, imported packages and pending work while preserving the editor and captured snapshot. Runtime loading errors and a 60-second startup timeout expose a restart action. Output is rendered as text, never HTML.

The studio is a coding environment, not a security sandbox for untrusted programs: Python can access worker JavaScript and make browser-permitted network requests. There are no secrets bundled with the application. Avoid adding credentials or privileged APIs to this origin.

## Maintainer development (not student setup)

Use Node 24 and pnpm 11.25.0:

```sh
cd studio-app
pnpm install --frozen-lockfile
pnpm build
node scripts/serve.mjs
# Open http://127.0.0.1:4173/studio/
```

Builds write only to `../studio/`. Commit the source, lockfile and generated `studio/` directory together. The site continues to work as static files; its other pages do not require React or a build step. The preview server serves the repository root, allowing the site's existing navigation, branding and search assets to work.

```sh
pnpm exec playwright install chromium
pnpm test
```

Browser tests exercise real Pyodide, input/errors, infinite-loop cancellation and restart, bounded console output, IndexedDB reload persistence, import confirmation and exact UTF-8 export, real OpenCV with a simulated camera, unavailable storage/network errors, and mobile layout. Physical camera/USB behavior needs a classroom hardware check.

The `Programming Studio QA` workflow builds and tests the app and checks that committed static assets match source. Existing site QA continues to validate `/studio/` links; it ignores maintainer source and dependency directories.

## Deployment

1. Review and merge this feature branch into the repository's existing publishing branch (`main`). No hosting-provider migration is required.
2. Publish the repository root using the site's existing static hosting process, including the committed `studio/` assets and `python-worker.js`. The existing CNAME is unchanged.
3. Open `https://lockwoodstem.org/studio/`. Check the Run/Stop flow, reload persistence, import/export and mobile navigation on a student browser.
4. Use HTTPS. Permit `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/` through the school filter for Python/WASM/packages. First load and OpenCV package load require internet; offline operation is not guaranteed. Monaco, React and their worker are served from the site itself.
5. If hosting adds a Content Security Policy, allow same-origin scripts/workers plus the pinned Pyodide CDN for worker imports and fetches, and WebAssembly compilation (`wasm-unsafe-eval`). Verify the policy in the actual target browser. No extra server endpoints, database service or environment secrets are required.
6. Pilot webcam permission and USB serial on school-managed devices. Desktop Chrome/Edge are the initial Web Serial targets; unsupported browsers retain the core Python studio. Already-flashed Arduino firmware is needed for the connection prototype.

Rollback: revert this feature's commit and republish; existing course content and hosting configuration are unaffected. Browser-local work persists until the browser profile is cleared.

## References

- https://pyodide.org/en/0.27.7/usage/webworker.html
- https://pyodide.org/en/0.27.7/usage/streams.html
- https://pyodide.org/en/0.27.7/usage/packages-in-pyodide.html
- https://developer.mozilla.org/en-US/docs/Web/API/Serial
