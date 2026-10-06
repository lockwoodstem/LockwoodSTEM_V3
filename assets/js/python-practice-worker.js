import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

const PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
let pyodideReady = null;

const mockPrelude = `
class MockArm:
    def move_to(self, x, y, z):
        print(f"ARM: move_to(x={x}, y={y}, z={z})")

    def move_inc(self, x, y, z):
        print(f"ARM: move_inc(dx={x}, dy={y}, dz={z})")

    def set_end_effector_magnet(self, enabled):
        print("MAGNET: ON" if enabled else "MAGNET: OFF")

arm = MockArm()
`;

async function ensurePyodide() {
  if (!pyodideReady) {
    pyodideReady = loadPyodide({ indexURL: PYODIDE_INDEX });
  }
  return await pyodideReady;
}

self.onmessage = async (event) => {
  const { id, code } = event.data || {};
  if (!id) return;
  try {
    self.postMessage({ id, type: "loading" });
    const pyodide = await ensurePyodide();
    self.postMessage({ id, type: "running" });
    pyodide.globals.set("__student_code__", String(code || ""));
    pyodide.globals.set("__mock_prelude__", mockPrelude);
    const output = await pyodide.runPythonAsync(`
import io, contextlib, traceback
_buffer = io.StringIO()
try:
    with contextlib.redirect_stdout(_buffer), contextlib.redirect_stderr(_buffer):
        exec(__mock_prelude__ + "\\n" + __student_code__, {})
except Exception:
    traceback.print_exc(file=_buffer)
_buffer.getvalue()
`);
    self.postMessage({ id, type: "result", output: String(output || "(no printed output)") });
  } catch (error) {
    self.postMessage({ id, type: "error", output: String(error && error.stack ? error.stack : error) });
  }
};