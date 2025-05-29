import type { Integer } from '../integer.js';
import type { DataSource } from './datasource.js';

export class ByteSource implements DataSource {
  constructor(private bytes: Uint8Array) {}

  async readInto(
    buf: Uint8Array,
    offset: number, // offset in target buffer to begin writing to
    requestBytes: number, // number of bytes to copy
    position: Integer, // position in source data to begin reading from
  ): Promise<number> {
    if (position >= this.bytes.length) return 0;
    if (position > Number.MAX_SAFE_INTEGER) throw new RangeError('position out of range');

    const actual = this.bytes.subarray(Number(position), requestBytes);
    buf.set(actual, offset);

    return actual.byteLength;
  }
}
