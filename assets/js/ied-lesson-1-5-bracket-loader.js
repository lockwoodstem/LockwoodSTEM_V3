(() => {
  "use strict";

  const BASE = '../../../../assets/models/ied/unit-1/lesson-1-5/';
  const MODEL_PARTS = {
    1: [BASE + 'Bracket_1.stl.gz.b64'],
    2: [BASE + 'Bracket_2.stl.gz.b64'],
    3: [1, 2, 3, 4, 5].map(n => BASE + `Bracket_3.gzip.b64.${String(n).padStart(2, '0')}`)
  };

  const nativeFetch = window.fetch.bind(window);
  const modelPromises = new Map();

  async function fetchText(url) {
    const response = await nativeFetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load bracket model data (${response.status}: ${url}).`);
    }
    return response.text();
  }

  function base64ToBytes(base64) {
    const cleaned = base64.replace(/\s+/g, '');
    const raw = atob(cleaned);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  async function gunzip(bytes) {
    if (!('DecompressionStream' in window)) {
      throw new Error('This browser does not support the bracket model loader. Please use a current version of Chrome or Edge.');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function validateSTL(bytes, modelNumber) {
    if (bytes.byteLength < 84) {
      throw new Error(`Bracket ${modelNumber} model data is incomplete.`);
    }

    const headerText = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 256))).trimStart();
    if (headerText.startsWith('solid')) return bytes;

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const triangles = view.getUint32(80, true);
    const expectedLength = 84 + triangles * 50;
    if (!triangles || expectedLength > bytes.byteLength) {
      throw new Error(`Bracket ${modelNumber} STL failed validation.`);
    }
    return bytes;
  }

  async function loadModel(modelNumber) {
    if (modelPromises.has(modelNumber)) return modelPromises.get(modelNumber);

    const promise = (async () => {
      const parts = MODEL_PARTS[modelNumber];
      if (!parts) throw new Error(`Unknown bracket model: ${modelNumber}`);

      const base64 = (await Promise.all(parts.map(fetchText))).join('');
      const compressed = base64ToBytes(base64);
      const stl = await gunzip(compressed);
      return validateSTL(stl, modelNumber);
    })();

    modelPromises.set(modelNumber, promise);
    return promise;
  }

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input && input.url;
    const match = url && /Bracket_([123])\.virtual\.stl(?:[?#].*)?$/.exec(url);
    if (!match) return nativeFetch(input, init);

    try {
      const modelNumber = Number(match[1]);
      const stl = await loadModel(modelNumber);
      return new Response(stl, {
        status: 200,
        headers: {
          'Content-Type': 'model/stl',
          'Content-Length': String(stl.byteLength),
          'Cache-Control': 'no-store'
        }
      });
    } catch (error) {
      console.error(`Failed to prepare Bracket ${match[1]} STL:`, error);
      return new Response(String(error && error.message ? error.message : error), {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  };
})();
