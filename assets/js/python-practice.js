(() => {
  const PYODIDE_SCRIPT = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js";
  const PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
  let pyodidePromise = null;
  let running = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.loadPyodide) return resolve();
      let script = document.querySelector('script[data-lockwood-pyodide]');
      if (script) {
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', reject, { once: true });
        return;
      }
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.lockwoodPyodide = 'true';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Unable to load the browser Python runtime.'));
      document.head.appendChild(script);
    });
  }

  async function getPyodide() {
    if (!pyodidePromise) {
      pyodidePromise = (async () => {
        await loadScript(PYODIDE_SCRIPT);
        return await window.loadPyodide({ indexURL: PYODIDE_INDEX });
      })();
    }
    return await pyodidePromise;
  }

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

  const guardedRunner = `
import io, contextlib, traceback, sys, time

_buffer = io.StringIO()
_start_time = time.monotonic()
_max_seconds = 2.5
_max_lines = 100000
_line_count = 0

def _student_trace(frame, event, arg):
    global _line_count
    if event == "line":
        _line_count += 1
        if _line_count > _max_lines or time.monotonic() - _start_time > _max_seconds:
            raise RuntimeError("Program stopped: possible infinite loop or code running too long.")
    return _student_trace

try:
    with contextlib.redirect_stdout(_buffer), contextlib.redirect_stderr(_buffer):
        sys.settrace(_student_trace)
        try:
            exec(__mock_prelude__ + "\\n" + __student_code__, {})
        finally:
            sys.settrace(None)
except Exception:
    traceback.print_exc(file=_buffer)

_buffer.getvalue()
`;

  function setStatus(root, text, state) {
    const el = root?.querySelector('[data-python-status]');
    if (!el) return;
    el.textContent = text;
    el.dataset.state = state || '';
  }

  function setOutput(root, text) {
    const el = root?.querySelector('[data-python-output]');
    if (el) el.textContent = text || '(no printed output)';
  }

  async function runLab(root) {
    const editor = root.querySelector('[data-python-editor]');
    const runButton = root.querySelector('[data-python-run]');
    if (!editor || !runButton) return;

    if (running) {
      setOutput(root, 'Another Python program is currently running. Try again when it finishes.');
      return;
    }

    running = true;
    runButton.disabled = true;
    setStatus(root, 'Loading Python…', 'loading');
    setOutput(root, 'Loading browser Python runtime…');

    try {
      const pyodide = await getPyodide();
      setStatus(root, 'Running…', 'running');
      setOutput(root, 'Running code…');
      pyodide.globals.set('__student_code__', editor.value);
      pyodide.globals.set('__mock_prelude__', mockPrelude);
      const result = await pyodide.runPythonAsync(guardedRunner);
      setOutput(root, String(result || '(no printed output)'));
      setStatus(root, 'Finished', 'ready');
    } catch (error) {
      setOutput(root, 'Python runtime error:\n\n' + String(error && error.stack ? error.stack : error));
      setStatus(root, 'Error', 'error');
      pyodidePromise = null;
    } finally {
      running = false;
      runButton.disabled = false;
    }
  }

  function initLab(root) {
    const editor = root.querySelector('[data-python-editor]');
    if (!editor) return;
    editor.dataset.initialCode = editor.value;

    root.querySelector('[data-python-run]')?.addEventListener('click', () => runLab(root));
    root.querySelector('[data-python-reset]')?.addEventListener('click', () => {
      editor.value = editor.dataset.initialCode || '';
      setOutput(root, 'Code reset. Predict the output, then click Run Code.');
      setStatus(root, 'Ready', 'ready');
    });
    root.querySelector('[data-python-clear]')?.addEventListener('click', () => {
      setOutput(root, '');
      setStatus(root, 'Ready', 'ready');
    });

    editor.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        runLab(root);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-python-lab]').forEach(initLab);
  });
})();