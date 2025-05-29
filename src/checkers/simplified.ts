import { ByteSource } from '../lib/datasource/datasource.js';
import { Reader } from '../lib/reader/reader.js';
import { Struct } from '../lib/struct.js';

(async () => {
  const test = new Uint8Array(16);
  const dv = new DataView(test.buffer, 0, 16);
  dv.setUint8(0, 1);
  dv.setUint16(1, 2, true);
  dv.setUint32(3, 3, true);
  dv.setBigUint64(8, 4n, true);

  const bs = new ByteSource(test);
  // const fs = new FileSource(resolve(import.meta.dirname, '..', '..', 'package.json'));
  const strategy = (v?: number) => (v ? v * 2 : 8);
  const reader = new Reader(bs, {
    strategy,
    maxRead: 500,
  });

  const struct = Struct.field('u8', 'uint8')
    .field('u16', 'uint16le')
    .field('u32', 'uint32le')
    .skip(1)
    .field('u64', 'uint64le')
    .build();

  const rec = await struct.require(reader, 0);
  console.log(rec);

  // await fs.close();
})();
