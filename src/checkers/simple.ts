import { Source } from '../source/types.js';
import { Ext, Mime, MimeString } from '../types.js';
import { Check } from './check.js';
import { Checker } from './types.js';

export class Simple<M extends Mime> {
  private constructor(
    readonly mime: M,
    readonly exts: Ext[],
    readonly check: Check,
    readonly childOf?: Checker,
  ) {}

  static of<M extends MimeString>(
    mime: M,
    exts: string[] | string,
    check: Check,
  ): Simple<M & Mime> {
    return new Simple(
      mime as M & Mime,
      Array.isArray(exts) ? (exts as Ext[]) : [exts as Ext],
      check,
    );
  }

  static childOf<M extends MimeString>(
    parent: Checker,
    mime: M,
    exts: string[] | string,
    check: Check,
  ): Simple<M & Mime> {
    return new Simple(
      mime as M & Mime,
      Array.isArray(exts) ? (exts as Ext[]) : [exts as Ext],
      check,
      parent,
    );
  }

  async isMatch(source: Source): Promise<boolean> {
    if (this.childOf && !(await this.childOf.isMatch(source))) return false;
    return this.check(source, 0);
  }
}
