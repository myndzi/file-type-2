import { FileHandle, open } from 'node:fs/promises';
import type { Integer } from '../integer.js';
import type { DataSource } from './datasource.js';

export class FileSource implements DataSource {
  private bytesRead: number = 0;
  private fh: FileHandle | undefined = undefined;
  constructor(private abspath: string) {}

  private open(): Promise<FileHandle> {
    return open(this.abspath, 'r');
  }

  async readInto(
    buf: Uint8Array,
    offset: number,
    requestBytes: number,
    position: Integer,
  ): Promise<number> {
    if (position > Number.MAX_SAFE_INTEGER) {
      throw new RangeError('node FileHandle cannot read positions > MAX_SAFE_INTEGER');
    }

    this.fh ??= await this.open();
    // console.log('read', offset, requestBytes, position);
    const res = await this.fh.read(buf, offset, requestBytes, Number(position));
    // console.log('completed', res.bytesRead);
    this.bytesRead += res.bytesRead;
    return res.bytesRead;
  }

  async close(): Promise<void> {
    console.log('read', this.bytesRead, 'bytes total');
    return this.fh?.close();
  }
}
