(() => {
  "use strict";

  const BASE = '../../../../assets/models/ied/unit-1/lesson-1-5/';
  const nativeFetch = window.fetch.bind(window);

  // Prefer the per-bracket exports. Bracket 1 is a single compressed file;
  // Brackets 2 and 3 are stored as validated base64 chunks that together
  // form one gzip stream per model.
  const DIRECT_PARTS = {
    1: [BASE + 'Bracket_1.stl.gz.b64'],
    2: [1, 2, 3, 4, 5].map(
      n => BASE + `Bracket_2.gzip.b64.${String(n).padStart(2, '0')}`
    ),
    3: [1, 2, 3, 4, 5].map(
      n => BASE + `Bracket_3.gzip.b64.${String(n).padStart(2, '0')}`
    )
  };

  // Historical corrected three-model pack. This is retained only as a
  // fallback for Brackets 2 and 3 if a per-bracket export is incomplete.
  const FALLBACK_PACK_PARTS = [
    BASE + 'brackets-pack.gz.b64.01',
    BASE + 'brackets-pack.gz.b64.02',
    BASE + 'brackets-pack.gz.b64.03',
    BASE + 'brackets-pack.gz.b64.04',
    ...[5, 6, 7, 8, 9, 10, 11, 12, 13].map(
      n => BASE + `brackets-fix.gz.b64.${String(n).padStart(2, '0')}`
    ),
    BASE + 'brackets-fix2.gz.b64.14'
  ];

  const modelPromises = new Map();
  let fallbackPackPromise = null;

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
      throw new Error('This browser does not support the bracket model loader. Please use a current version of Chrome or Edge.');
    }

    const base64 = (await Promise.all(parts.map(fetchText))).join('');
    const compressed = base64ToBytes(base64);
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  // Match the viewer's own acceptance rules without requiring a particular
  // STL header. Binary STL uses the triangle count at byte 80; ASCII STL is
  // accepted when it contains complete vertex triples.
  function looksLikeSTL(bytes) {
    if (!bytes || !bytes.byteLength) return false;

    if (bytes.byteLength >= 84) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const triangleCount = view.getUint32(80, true);
      const expectedLength = 84 + triangleCount * 50;
      if (triangleCount > 0 && expectedLength <= bytes.byteLength) return true;
    }

    const sample = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.byteLength, 16384)));
    const matches = sample.match(/vertex\s+[-+\deE.]+\s+[-+\deE.]+\s+[-+\deE.]+/gi);
    return Boolean(matches && matches.length >= 3 && matches.length % 3 === 0);
  }

  async function loadFallbackPack() {
    if (!fallbackPackPromise) {
      fallbackPackPromise = (async () => {
        const packed = await gunzipBase64Parts(FALLBACK_PACK_PARTS);
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
        for (let index = 0; index < lengths.length; index += 1) {
          const length = lengths[index];
          if (!length || offset + length > packed.byteLength) {
            throw new Error(`Corrected bracket pack has an invalid length for Model ${index + 1}.`);
          }
          models.push(packed.slice(offset, offset + length));
          offset += length;
        }
        return models;
      })();
    }
    return fallbackPackPromise;
  }

  async function loadModel(modelNumber) {
    if (modelPromises.has(modelNumber)) return modelPromises.get(modelNumber);

    const promise = (async () => {
      let directBytes = null;
      let directError = null;

      try {
        directBytes = await gunzipBase64Parts(DIRECT_PARTS[modelNumber]);
        if (looksLikeSTL(directBytes)) return directBytes;
        console.warn(`Bracket ${modelNumber}: per-bracket data did not pass STL sanity check; trying corrected fallback pack.`);
      } catch (error) {
        directError = error;
        console.warn(`Bracket ${modelNumber}: per-bracket data failed to load; trying corrected fallback pack.`, error);
      }

      if (modelNumber !== 1) {
        try {
          const models = await loadFallbackPack();
          const fallbackBytes = models[modelNumber - 1];
          if (looksLikeSTL(fallbackBytes)) return fallbackBytes;
          console.warn(`Bracket ${modelNumber}: fallback pack data did not pass STL sanity check.`);
        } catch (error) {
          console.warn(`Bracket ${modelNumber}: corrected fallback pack failed to load.`, error);
        }
      }

      // If decompression succeeded, let the viewer's full parser make the
      // final decision instead of rejecting potentially unusual STL headers.
      if (directBytes && directBytes.byteLength) return directBytes;

      throw directError || new Error(`Unable to prepare Bracket ${modelNumber} STL.`);
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
      console.error(`Failed to prepare Bracket ${modelNumber} STL:`, error);
      return new Response(String(error && error.message ? error.message : error), {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
  };
})();
