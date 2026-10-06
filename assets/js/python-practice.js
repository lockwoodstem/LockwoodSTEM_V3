(() => {
  const WORKER_URL = "../../../assets/js/python-practice-worker.js?v=20261006-4";
  let worker = null;
  let runCounter = 0;
  let activeRun = null;

  function createWorker() {
    if (worker) worker.terminate();
    worker = new Worker(WORKER_URL, { type: 'module' });
    worker.onmessage = handleWorkerMessage;
    worker.onerror = (event) => {
      if (activeRun) {
        setStatus(activeRun.root, "Loader Error", "error");
        setOutput(activeRun.root, "Python runtime failed to load. Refresh the page and try again.\n\n" + (event.message || "Unknown worker error"));
        if (activeRun.button) activeRun.button.disabled = false;
        activeRun = null;
      }
    };
    return worker;
  }

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

  function finishRun() {
    if (!activeRun) return;
    clearTimeout(activeRun.timeout);
    if (activeRun.button) activeRun.button.disabled = false;
    activeRun = null;
  }

  function handleWorkerMessage(event) {
    const msg = event.data || {};
    if (!activeRun || msg.id !== activeRun.id) return;
    const root = activeRun.root;

    if (msg.type === 'loading') {
      setStatus(root, 'Loading Python…', 'loading');
      setOutput(root, 'Loading browser Python runtime…');
      return;
    }

    if (msg.type === 'running') {
      setStatus(root, 'Running…', 'running');
      setOutput(root, 'Running code…');
      activeRun.timeout = setTimeout(() => {
        worker?.terminate();
        worker = null;
        setStatus(root, 'Stopped', 'error');
        setOutput(root, 'Program stopped: it ran too long. Check for an infinite loop or code that never reaches a stopping condition.');
        if (activeRun?.button) activeRun.button.disabled = false;
        activeRun = null;
      }, 5000);
      return;
    }

    if (msg.type === 'result') {
      setOutput(root, msg.output);
      setStatus(root, 'Finished', 'ready');
      finishRun();
      return;
    }

    if (msg.type === 'error') {
      setOutput(root, msg.output || 'Unknown Python error');
      setStatus(root, 'Error', 'error');
      finishRun();
    }
  }

  function runLab(root) {
    const editor = root.querySelector('[data-python-editor]');
    const runButton = root.querySelector('[data-python-run]');
    if (!editor || !runButton) return;

    if (activeRun) {
      setOutput(root, 'Another run is still active. Wait for it to finish or reload the page.');
      return;
    }

    if (!worker) createWorker();

    const id = ++runCounter;
    runButton.disabled = true;
    activeRun = { id, root, button: runButton, timeout: null };
    worker.postMessage({ id, code: editor.value });
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