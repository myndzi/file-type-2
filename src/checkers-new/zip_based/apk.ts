import { Checker, CheckResult } from '../../lib/checker.js';
import { Reader } from '../../lib/reader/reader.js';
import { Match, NoMatch } from '../../lib/runner.js';
import { Ext, Mime } from '../../types.js';
import { zipSingleton } from './zip.js';

// TextDecoder doesn't offer cp437, but we don't care here --
// any invalidly decoded characters would be filenames that
// shouldn't match anyway. everything we do want to match is
// in the "safe" range of common characters between utf-8,
// latin1, etc.
const textDecoder = new TextDecoder('utf8');

export class Apk implements Checker {
  readonly name = 'Apk';
  readonly mime = 'application/vnd.android.package-archive' as Mime;
  readonly exts = ['apk'] as Ext[];
  readonly after = Object.freeze({
    checker: zipSingleton,
    required: true,
  });

  private regex = /classes\d*\.dex/;

  async check(reader: Reader): Promise<CheckResult> {
    const found = new Promise<CheckResult>(resolve => {
      const unsubscribe = zipSingleton.onFile(reader, (_, filename) => {
        const str = textDecoder.decode(filename);
        if (!this.regex.test(str)) return;
        resolve(Match);
        unsubscribe();
      });
    });
    const done = zipSingleton.scanFiles(reader).then(() => NoMatch);
    return Promise.race([found, done]);
  }
}

export const apkSingleton = new Apk();
