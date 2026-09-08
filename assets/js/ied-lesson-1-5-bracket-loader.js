(() => {
  "use strict";

  const BASE = '../../../../assets/models/ied/unit-1/lesson-1-5/';
  const nativeFetch = window.fetch.bind(window);

  // Every preferred source below is reconstructed from the original uploaded
  // STL for that bracket and verified against its Git blob hash.
  const DIRECT_PARTS = {
    1: [BASE + 'Bracket_1.stl.gz.b64'],
    2: [1, 2, 3, 4, 5].map(
      n => BASE + `Bracket_2.gzip.b64.${String(n).padStart(2, '0')}`
    ),
    3: [
      BASE + 'Bracket_3.gzip.b64.01',
      BASE + 'Bracket_3.gzip.b64.02',
      BASE + 'Bracket_3.gzip.b64.03',
      BASE + 'Bracket_3.gzip.b64.04a',
      BASE + 'Bracket_3.gzip.b64.04b',
      BASE + 'Bracket_3.gzip.b64.05',
      BASE + 'Bracket_3.gzip.b64.06a',
      BASE + 'Bracket_3.gzip.b64.06b',
      BASE + 'Bracket_3.gzip.b64.07a',
      BASE + 'Bracket_3.gzip.b64.07b',
      BASE + 'Bracket_3.gzip.b64.08'
    ]
  };

  const modelPromises = new Map();

  async function fetchText(url) {
    const response = await nativeFetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load model data (${response.status}: ${url}).`);
    }
    return response.text();
  }

  function base64ToBytes(base64) {
    const cleaned = base64.replace(/\s+/g, '');
    const raw = atob(cleaned);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  async function gunzipBase64Parts(parts) {
    if (!('DecompressionStream' in window)) {
      throw new Error(
        'This browser does not support the bracket model loader. Please use a current version of Chrome or Edge.'
      );
    }
    const base64 = (await Promise.all(parts.map(fetchText))).join('');
    const compressed = base64ToBytes(base64);
    const stream = new Blob([compressed])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function looksLikeSTL(bytes) {
    if (!bytes || bytes.byteLength < 84) return false;

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const triangleCount = view.getUint32(80, true);
    const expectedLength = 84 + triangleCount * 50;

    if (triangleCount > 0 && expectedLength === bytes.byteLength) return true;

    const sample = new TextDecoder().decode(
      bytes.slice(0, Math.min(bytes.byteLength, 16384))
    );
    const matches = sample.match(
      /vertex\s+[-+\deE.]+\s+[-+\deE.]+\s+[-+\deE.]+/gi
    );
    return Boolean(matches && matches.length >= 3 && matches.length % 3 === 0);
  }

  async function loadModel(modelNumber) {
    if (modelPromises.has(modelNumber)) return modelPromises.get(modelNumber);

    const promise = (async () => {
      const stl = await gunzipBase64Parts(DIRECT_PARTS[modelNumber]);
      if (!looksLikeSTL(stl)) {
        throw new Error(`Bracket ${modelNumber} model data failed STL validation.`);
      }
      return stl;
    })();

    modelPromises.set(modelNumber, promise);
    return promise;
  }

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input && input.url;
    const match = url && /Bracket_([123])\.virtual\.stl(?:[?#].*)?$/.exec(url);

    if (!match) return nativeFetch(input, init);

    const modelNumber = Number(match[1]);

    try {
      const stl = await loadModel(modelNumber);
      return new Response(stl, {
        status: 200,
        headers: {
          'Content-Type': 'model/stl',
          'Content-Length': String(stl.byteLength),
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    } catch (error) {
      console.error(`Bracket ${modelNumber} model failed to load.`, error);
      return new Response(
        `Unable to load Bracket ${modelNumber}: ${error.message || error}`,
        {
          status: 500,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    }
  };
})();
