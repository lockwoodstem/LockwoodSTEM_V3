(() => {
  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js";
  const PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
  let pyodidePromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-pyodide-loader]')) {
        const existing = document.querySelector('script[data-pyodide-loader]');
        if (window.loadPyodide) return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.pyodideLoader = 'true';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function getPyodide() {
    if (!pyodidePromise) {
      pyodidePromise = (async () => {
        await loadScript(PYODIDE_URL);
        return await window.loadPyodide({ indexURL: PYODIDE_INDEX });
      })();
    }
    return pyodidePromise;
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

  function setStatus(root, text, state) {
    const el = root.querySelector('[data-python-status]');
    if (!el) return;
    el.textContent = text;
    el.dataset.state = state || '';
  }

  function setOutput(root, text) {
    const el = root.querySelector('[data-python-output]');
    if (el) el.textContent = text || '(no printed output)';
  }

  async function runLab(root) {
    const editor = root.querySelector('[data-python-editor]');
    const runButton = root.querySelector('[data-python-run]');
    if (!editor || !runButton) return;
    runButton.disabled = true;
    setStatus(root, 'Loading Python…', 'loading');
    setOutput(root, 'Starting Python runtime…');

    try {
      const pyodide = await getPyodide();
      setStatus(root, 'Running…', 'running');
      const code = editor.value;
      pyodide.globals.set('__student_code__', code);
      const result = await pyodide.runPythonAsync(`
import io, contextlib, traceback
_buffer = io.StringIO()
try:
    with contextlib.redirect_stdout(_buffer), contextlib.redirect_stderr(_buffer):
        exec(${JSON.stringify(mockPrelude)} + "\\n" + __student_code__, {})
except Exception:
    traceback.print_exc(file=_buffer)
_buffer.getvalue()
`);
      setOutput(root, String(result || '(no printed output)'));
      setStatus(root, 'Finished', 'ready');
    } catch (err) {
      setOutput(root, String(err));
      setStatus(root, 'Error', 'error');
    } finally {
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
      setOutput(root, 'Code reset. Click Run Code when ready.');
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