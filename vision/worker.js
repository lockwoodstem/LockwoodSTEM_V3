/* LockwoodSTEM Live Vision Lab: isolated, frame-at-a-time Pyodide worker. */
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const FACE_CASCADE = "https://cdn.jsdelivr.net/gh/opencv/opencv@4.10.0/data/haarcascades/haarcascade_frontalface_default.xml";
let pyodide = null;
let globals = null;
let configured = false;
let frameBusy = false;
let outputCount = 0;
function send(type, extra = {}) { self.postMessage({ type, ...extra }); }
function reportError(error) { send("error", { message: String(error).slice(0, 10000) }); }
async function initialize() {
  try {
    importScripts(PYODIDE_URL + "pyodide.js");
    pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
    send("status", { message: "Loading NumPy and OpenCV…" });
    await pyodide.loadPackage(["numpy", "opencv-python"]);
    pyodide.setStdout({ batched: message => { if (outputCount++ < 30) send("log", { message }); } });
    pyodide.setStderr({ batched: message => { if (outputCount++ < 30) send("log", { message }); } });
    try {
      send("status", { message: "Loading face-detection reference…" });
      const response = await fetch(FACE_CASCADE);
      if (!response.ok) throw new Error("HTTP " + response.status);
      pyodide.FS.writeFile("/tmp/lockwoodstem_face_cascade.xml", new Uint8Array(await response.arrayBuffer()));
      send("status", { message: "Python, OpenCV and face detection ready." });
    } catch (error) {
      send("status", { message: "OpenCV ready; face model unavailable on this network. Edge detection still works." });
    }
    send("ready");
  } catch (error) { reportError("Cannot load Python/OpenCV. Check internet and CDN access. " + error); }
}
self.onmessage = async ({ data }) => {
  if (!pyodide) return;
  if (data.type === "configure") {
    configured = false;
    frameBusy = false;
    outputCount = 0;
    if (globals) { globals.destroy(); globals = null; }
    globals = pyodide.toPy({ __name__: "__main__" });
    try {
      await pyodide.loadPackagesFromImports(data.code);
      await pyodide.runPythonAsync(data.code, { globals, filename: "live_vision.py" });
      await pyodide.runPythonAsync(
        'if not callable(globals().get("process_frame")): raise ValueError("Define a process_frame(frame) function that returns a processed image.")',
        { globals }
      );
      configured = true;
      send("configured");
    } catch (error) { reportError(error); }
    return;
  }
  if (data.type === "frame" && configured && !frameBusy) {
    frameBusy = true;
    self._vision_pixels = new Uint8Array(data.pixels);
    self._vision_width = data.width;
    self._vision_height = data.height;
    let image = null;
    let buffer = null;
    try {
      const t0 = performance.now();
      image = await pyodide.runPythonAsync(`
import numpy as np
import cv2
from js import _vision_pixels, _vision_width, _vision_height

_original = np.frombuffer(_vision_pixels.to_py(), dtype=np.uint8).reshape(
    (int(_vision_height), int(_vision_width), 4)
).copy()
_processed = process_frame(_original.copy())
if _processed is None:
    _processed = _original
_processed = np.asarray(_processed)
if _processed.dtype != np.uint8:
    _processed = np.clip(_processed, 0, 255).astype(np.uint8)
if _processed.ndim == 2:
    _processed = cv2.cvtColor(_processed, cv2.COLOR_GRAY2RGBA)
elif _processed.ndim == 3 and _processed.shape[2] == 3:
    _processed = cv2.cvtColor(_processed, cv2.COLOR_RGB2RGBA)
if _processed.shape != _original.shape:
    raise ValueError("process_frame must return the input frame size, using grayscale, RGB or RGBA pixels.")
np.ascontiguousarray(_processed)
`, { globals });
      buffer = image.getBuffer("u8");
      const pixels = new Uint8ClampedArray(buffer.data);
      send("frame", { pixels: pixels.buffer, width: data.width, height: data.height, milliseconds: Math.round(performance.now() - t0) });
    } catch (error) {
      configured = false;
      reportError(error);
    } finally {
      if (buffer) buffer.release();
      if (image) image.destroy();
      self._vision_pixels = null;
      frameBusy = false;
    }
  }
};
initialize();
