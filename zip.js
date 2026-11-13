// Minimal ZIP writer, "stored" (no compression: audio is already compressed). files: [{name, data: Uint8Array}] -> Blob
let CRC;
function crc32(d) {
  if (!CRC) { CRC = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c; } }
  let c = -1;
  for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function zip(files) {
  const enc = new TextEncoder(), out = [], dir = [];
  let off = 0;
  // fields shared by the local header and the central directory: version 20, UTF-8 names, stored, date 1980-01-01
  const common = (v, at, name, crc, n) => {
    v.setUint16(at, 20, true); v.setUint16(at + 2, 0x0800, true); v.setUint16(at + 4, 0, true);
    v.setUint16(at + 6, 0, true); v.setUint16(at + 8, 33, true); v.setUint32(at + 10, crc, true);
    v.setUint32(at + 14, n, true); v.setUint32(at + 18, n, true); v.setUint16(at + 22, name.length, true);
  };
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), n = f.data.length;
    const lh = new Uint8Array(30 + name.length), lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); common(lv, 4, name, crc, n); lh.set(name, 30);
    const ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); common(cv, 6, name, crc, n);
    cv.setUint32(42, off, true); ch.set(name, 46);
    out.push(lh, f.data); dir.push(ch); off += lh.length + n;
  }
  const size = dir.reduce((a, d) => a + d.length, 0), end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, size, true); ev.setUint32(16, off, true);
  return new Blob([...out, ...dir, end], { type: 'application/zip' });
}
