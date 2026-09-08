(() => {
  "use strict";
  const BASE = '../../../../assets/models/ied/unit-1/lesson-1-5/';
  const PARTS = [
    BASE + 'brackets-pack.gz.b64.01',
    BASE + 'brackets-pack.gz.b64.02',
    BASE + 'brackets-pack.gz.b64.03',
    BASE + 'brackets-pack.gz.b64.04',
    ...[5,6,7,8,9,10,11,12,13,14].map(n => BASE + `brackets-fix.gz.b64.${String(n).padStart(2,'0')}`)
  ];
  const nativeFetch = window.fetch.bind(window);
  let modelsPromise;

  async function unpackModels() {
    if (modelsPromise) return modelsPromise;
    modelsPromise = (async () => {
      const responses = await Promise.all(PARTS.map(url => nativeFetch(url)));
      responses.forEach(r => { if (!r.ok) throw new Error('Unable to load bracket model data.'); });
      const b64 = (await Promise.all(responses.map(r => r.text()))).join('').replace(/\s+/g, '');
      const raw = atob(b64);
      const gz = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) gz[i] = raw.charCodeAt(i);
      if (!('DecompressionStream' in window)) throw new Error('This browser does not support the bracket model loader. Please use current Chrome or Edge.');
      const stream = new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'));
      const packed = new Uint8Array(await new Response(stream).arrayBuffer());
      const view = new DataView(packed.buffer, packed.byteOffset, packed.byteLength);
      const lengths = [view.getUint32(0,true), view.getUint32(4,true), view.getUint32(8,true)];
      const models = [];
      let offset = 12;
      for (const length of lengths) {
        models.push(packed.slice(offset, offset + length));
        offset += length;
      }
      return models;
    })();
    return modelsPromise;
  }

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const match = /Bracket_([123])\.virtual\.stl(?:[?#].*)?$/.exec(url);
    if (!match) return nativeFetch(input, init);
    const models = await unpackModels();
    return new Response(models[Number(match[1]) - 1], {status:200, headers:{'Content-Type':'model/stl'}});
  };
})();
