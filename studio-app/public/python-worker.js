/* Classic worker: Python never runs on the browser UI thread. Version is pinned. */
const INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let python;
let busy = false;
let outputSize = 0;
let outputLines = 0;
let truncated = false;
function output(kind, text) {
  if (truncated) return;
  const remaining = 60000 - outputSize;
  text = String(text);
  const clipped = text.slice(0, Math.max(0, remaining));
  outputSize += clipped.length;
  outputLines++;
  if (clipped) postMessage({type:'output',kind,text:clipped});
  if (outputSize >= 60000 || outputLines >= 500) {
    truncated = true;
    postMessage({type:'output',kind:'system',text:'Output limit reached. Use Stop if the program is still running.'});
  }
}
async function initialize() {
  try {
    importScripts(INDEX_URL + 'pyodide.js');
    python = await loadPyodide({indexURL:INDEX_URL});
    python.setStdout({batched:text=>output('stdout',text)});
    python.setStderr({batched:text=>output('stderr',text)});
    postMessage({type:'ready'});
  } catch(error) { postMessage({type:'fatal',text:'Python could not load. Check your internet connection and school access to cdn.jsdelivr.net, then restart Python. ' + String(error)}); }
}
self.onmessage = async ({data}) => {
  if (data.type !== 'run' || !python || busy) return;
  busy = true;
  outputSize = 0; outputLines = 0; truncated = false;
  const lines = data.input === '' ? [] : data.input.replace(/\r\n/g,'\n').split('\n');
  let cursor = 0;
  python.setStdin({stdin:() => cursor < lines.length ? lines[cursor++] : undefined});
  self._studio_frame = data.frame ? {...data.frame,data:new Uint8Array(data.frame.data)} : null;
  const globals = python.toPy({__name__:'__main__'});
  try {
    if (data.frame) await python.loadPackage('numpy');
    await python.loadPackagesFromImports(data.code);
    await python.runPythonAsync(`
def get_frame():
    """Return the captured webcam snapshot as a copy of an RGBA uint8 array."""
    from js import _studio_frame
    if _studio_frame is None:
        raise RuntimeError("Start the camera and capture a frame before running this program.")
    import numpy as np
    return np.frombuffer(_studio_frame.data.to_py(), dtype=np.uint8).reshape((_studio_frame.height, _studio_frame.width, 4)).copy()
`, {globals});
    const result = await python.runPythonAsync(data.code, {globals,filename:data.name});
    if (result && typeof result.destroy === 'function') result.destroy();
    postMessage({type:'done',success:true});
  } catch (error) {
    postMessage({type:'output',kind:'stderr',text:String(error).slice(0,12000)});
    postMessage({type:'done',success:false});
  } finally { globals.destroy(); self._studio_frame = null; busy = false; }
};
initialize();
