import { Checker, CheckResult } from '../../lib/checker.js';
import { StringPattern } from '../../lib/matcher/matcher.js';
import { matchString } from '../../lib/matcher/pattern.js';
import { Reader } from '../../lib/reader/reader.js';
import { Match, NoMatch } from '../../lib/runner.js';
import { Ext, Mime, MimeString } from '../../types.js';
import { zipSingleton } from './zip.js';

export class ZipSimple<M extends Mime> implements Checker {
  readonly name: string;
  readonly after = Object.freeze({
    checker: zipSingleton,
    required: true,
  });

  private constructor(
    readonly mime: M,
    readonly exts: Ext[],
    private filename: StringPattern,
  ) {
    this.name = `ZipSimple(${this.mime})`;
  }

  async check(reader: Reader): Promise<CheckResult> {
    const found = await zipSingleton.findFile(reader, this.filename);
    return found ? Match : NoMatch;
  }

  static of<const M extends MimeString>(mime: M, exts: string[] | string, filename: string) {
    return new ZipSimple(
      mime as unknown as Mime,
      (Array.isArray(exts) ? exts : [exts]) as Ext[],
      matchString(filename, { encoding: 'cp437' }),
    );
  }
}
