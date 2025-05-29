import { type FileHandle, open } from 'node:fs/promises';
import { Source } from './types.js';

export class FileSource implements Source {
  private constructor(private handle: FileHandle) {}

  async readu8(offset: number, length: number): Promise<Uint8Array> {
    const u8 = new Uint8Array(length);
    console.log('read', offset, length);
    const { bytesRead } = await this.handle.read(u8, 0, length, offset);
    if (bytesRead < length) return u8.subarray(0, bytesRead);
    return u8;
  }

  static async with(path: string, cb: (file: FileSource) => Promise<void>): Promise<void> {
    const handle = await open(path, 'r');
    const fileSource = new FileSource(handle);

    let caught: boolean = false;
    let err: unknown = null;
    try {
      await cb(fileSource);
    } catch (e) {
      caught = true;
      err = e;
    }

    try {
      await handle.close();
    } catch (e) {
      if (!caught) throw e;

      // we have two errors, surface the user error and log a warning for the file
      // close error
      console.error('WARNING: file.close() failed after callback threw', e);
    }
  }
}
