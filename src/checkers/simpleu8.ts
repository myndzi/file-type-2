import { Source } from '../source/types.js';
import { Ext, Mime, MimeString } from '../types.js';
import type { Checker } from './types.js';

export class SimpleU8<M extends Mime> {
  private constructor(
    readonly mime: M,
    readonly exts: Ext[],
    readonly offset: number,
    readonly bytes: Uint8Array,
    readonly parent?: Checker
  ) {}

  static of<M extends MimeString>(mime: M, exts: string[] | string, offset: number, bytes: number[]): SimpleU8<M & { __brand__: 'mime' }> {
    if (!bytes.every(b => b >= 0 && b <= 255)) throw new Error('bytes[] must contain values from 0-255');
    return new SimpleU8(
      mime as M & { __brand__: 'mime' },
      Array.isArray(exts) ? (exts as Ext[]) : [exts as Ext],
      offset,
      new Uint8Array(bytes)
    );
  }

  static childOf<M extends MimeString>(
    parent: Checker,
    mime: M,
    exts: string[] | string,
    offset: number,
    bytes: number[]
  ): SimpleU8<M & { __brand__: 'mime' }> {
    if (!bytes.every(b => b >= 0 && b <= 255)) throw new Error('bytes[] must contain values from 0-255');
    return new SimpleU8(
      mime as M & { __brand__: 'mime' },
      Array.isArray(exts) ? (exts as Ext[]) : [exts as Ext],
      offset,
      new Uint8Array(bytes),
      parent
    );
  }

  async isMatch(source: Source): Promise<boolean> {
    if (this.parent && !this.parent.isMatch(source)) return false;

    const dv = await source.readu8(this.offset, this.bytes.length);
    return dv && dv.every((v, idx) => this.bytes[idx] === v);
  }
}
