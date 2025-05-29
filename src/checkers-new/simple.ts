import {
  CheckerDependency,
  PartialChecker,
  type Checker,
  type CheckResult,
} from '../lib/checker.js';
import { add, Integer } from '../lib/integer.js';
import { NullTermination } from '../lib/matcher/matcher.js';
import { matchBytes, matchString } from '../lib/matcher/pattern.js';
import type { Reader } from '../lib/reader/reader.js';
import { NoMatch } from '../lib/runner.js';
import { Ext, Mime, MimeString } from '../types.js';

type Test = {
  offset: number;
  byteLength: number;
  match: (actual: Uint8Array) => boolean;
};

export const bytes = (expected: ArrayLike<number>, offset: number = 0): Test => {
  const pat = matchBytes(expected);
  return {
    offset,
    ...pat,
  };
};

export const stringp = (text: string, length: number, offset: number = 0): Test => {
  const pat = matchString(text, {
    encoding: 'cp1252',
    pad: {
      to: length,
      with: ' ',
      nullTermination: NullTermination.ALLOW,
    },
  });
  return {
    offset,
    ...pat,
  };
};

export const stringf = (text: string, offset: number = 0): Test => {
  const pat = matchString(text, { encoding: 'cp1252' });

  return {
    offset,
    ...pat,
  };
};

const arrayEvery = Array.prototype.every;
const arraySome = Array.prototype.some;

export const allOf = (tests: [Test, ...Test[]]): Test => {
  const minPos = tests.reduce((acc, cur) => Math.min(acc, cur.offset), tests[0].offset);
  const maxPos = tests.reduce(
    (acc, cur) => Math.max(acc, cur.byteLength + cur.offset),
    tests[0].byteLength + tests[0].offset,
  );
  const test = (actual: Uint8Array) =>
    arrayEvery.call(tests, ({ offset, byteLength, match }: Test) =>
      match(actual.subarray(offset - minPos, offset - minPos + byteLength)),
    );
  return {
    offset: minPos,
    byteLength: maxPos - minPos,
    match: test,
  };
};

export const anyOf = (tests: [Test, ...Test[]]): Test => {
  const minPos = tests.reduce((acc, cur) => Math.min(acc, cur.offset), tests[0].offset);
  const maxPos = tests.reduce(
    (acc, cur) => Math.max(acc, cur.byteLength + cur.offset),
    tests[0].byteLength + tests[0].offset,
  );
  const test = (actual: Uint8Array) =>
    arraySome.call(tests, ({ offset, byteLength, match }: Test) =>
      match(actual.subarray(offset - minPos, offset - minPos + byteLength)),
    );

  return {
    offset: minPos,
    byteLength: maxPos - minPos,
    match: test,
  };
};

export class Simple<M extends Mime> implements Checker {
  readonly name: string;

  private constructor(
    readonly mime: M,
    readonly exts: Ext[],
    readonly test: Test,
    readonly after: CheckerDependency | undefined = undefined,
  ) {
    this.name = `Simple(${this.mime})`;
  }

  static of<const M extends MimeString>(mime: M, exts: string[] | string, test: Test) {
    return new Simple(
      mime as unknown as Mime,
      (Array.isArray(exts) ? exts : [exts]) as Ext[],
      test,
    );
  }

  static childOf<const M extends MimeString>(
    parent: PartialChecker,
    mime: M,
    exts: string[] | string,
    test: Test,
    required: boolean = true,
  ) {
    return new Simple(
      mime as unknown as Mime,
      (Array.isArray(exts) ? exts : [exts]) as Ext[],
      test,
      {
        checker: parent,
        required,
      },
    );
  }

  async check(reader: Reader, pos: Integer): Promise<CheckResult> {
    const { offset, byteLength, match } = this.test;
    const readAt = add(pos, offset);
    const u8 = reader.request(readAt, byteLength) ?? (await reader.demand(readAt, byteLength));

    if (!match(u8)) return NoMatch;

    return {
      match: true,
      continueAt: add(readAt, byteLength),
    };
  }
}
