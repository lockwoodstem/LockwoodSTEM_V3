(() => {
  "use strict";

  const BASE = '../../../../assets/models/ied/unit-1/lesson-1-5/';
  const nativeFetch = window.fetch.bind(window);

  // Bracket 1 has a known-good standalone export.
  const BRACKET_1 = [BASE + 'Bracket_1.stl.gz.b64'];

  // Brackets 2 and 3 are loaded from the corrected complete model pack.
  // This replaces the older intermediate per-bracket exports that were
  // causing Models 2 and 3 to fail in the browser.
  const PACK_PARTS = [1, 2, 3, 4, 5, 6, 7].map(
    n => BASE + `brackets-pack2.gz.b64.${String(n).padStart(2, '0')}`
  );

  let bracket1Promise = null;
  let packPromise = null;

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

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const triangleCount = view.getUint32(80, true);
    const expectedLength = 84 + triangleCount * 50;

    // Binary STL is the normal case for these files.
    if (triangleCount > 0 && expectedLength <= bytes.byteLength) return bytes;

    // Allow ASCII STL as a fallback.
    const header = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.byteLength, 256))).trimStart();
    if (header.startsWith('solid')) return bytes;

    throw new Error(`Bracket ${modelNumber} STL failed validation.`);
  }

  async function loadBracket1() {
    if (!bracket1Promise) {
      bracket1Promise = (async () => {
        const base64 = (await Promise.all(BRACKET_1.map(fetchText))).join('');
        return validateSTL(await gunzip(base64ToBytes(base64)), 1);
      })();
    }
    return bracket1Promise;
  }

  async function loadCorrectedPack() {
    if (!packPromise) {
      packPromise = (async () => {
        const base64 = (await Promise.all(PACK_PARTS.map(fetchText))).join('');
        const packed = await gunzip(base64ToBytes(base64));

        if (packed.byteLength < 12) {
          throw new Error('Corrected bracket model pack is incomplete.');
        }

        const view = new DataView(packed.buffer, packed.byteOffset, packed.byteLength);
        const lengths = [
          view.getUint32(0, true),
          view.getUint32(4, true),
          view.getUint32(8, true)
        ];

        const models = [];
        let offset = 12;
        for (let index = 0; index < 3; index += 1) {
          const length = lengths[index];
          if (!length || offset + length > packed.byteLength) {
            throw new Error(`Corrected bracket pack has an invalid length for Model ${index + 1}.`);
          }
          models.push(validateSTL(packed.slice(offset, offset + length), index + 1));
          offset += length;
        }

        return models;
      })();
    }
    return packPromise;
  }

  async function loadModel(modelNumber) {
    if (modelNumber === 1) return loadBracket1();
    const models = await loadCorrectedPack();
    return models[modelNumber - 1];
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
          'Cache-Control': 'no-store'
        }
      });
    } catch (error) {
      console.error(`Failed to prepare Bracket ${modelNumber} STL:`, error);
      return new Response(String(error && error.message ? error.message : error), {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  };
})();
