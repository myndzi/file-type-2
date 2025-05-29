import type { Byteable } from '../encode/bytes.js';
import { Encode, type ByteEncoding, type StringEncoding } from '../encode/encode.js';
import { byteEquals, paddedEquals } from './equals.js';
import {
  NullTermination,
  type ByteMatcher,
  type ByteOptions,
  type Pattern,
  type Simplify,
  type StringOptions,
} from './matcher.js';

const ofStringMemo = (
  expect: string,
  options: Partial<StringOptions>,
  memo: Map<StringEncoding, Pattern<StringEncoding>>,
): Pattern<StringEncoding> => {
  const encoding = options.encoding ?? 'cp1252';
  const expectedu8a = new Uint8Array(Encode.string(expect, encoding));
  const pad = options.pad;
  let byteLength: number = expectedu8a.byteLength;

  let match: ByteMatcher;

  if (pad !== undefined) {
    const padWith = Encode.string(pad.with, encoding);
    if (padWith.length > 1) {
      // don't think we need to support more than this, but it
      // could be improved in the future
      throw new Error('padding must encode to a single byte');
    }

    match = paddedEquals(
      expectedu8a,
      pad.to,
      padWith[0],
      pad.nullTermination ?? NullTermination.REFUSE,
    );
    byteLength = pad.to;
  } else {
    match = byteEquals(expectedu8a);
  }

  const asEncoding = <U extends StringEncoding>(encoding: U): Pattern<U> => {
    const memoized = memo.get(encoding) ?? ofStringMemo(expect, { ...options, encoding }, memo);
    memo.set(encoding, memoized);
    return memoized as Pattern<U>;
  };

  const pattern = {
    encoding,
    byteLength,
    match,
    asEncoding,
  };

  memo.set(encoding, pattern);

  return pattern;
};

export const matchBytes = (
  expect: Byteable,
  options: Partial<ByteOptions> = {},
): Pattern<ByteEncoding> => {
  const expectedu8a = new Uint8Array(Encode.bytes(expect));
  const mask = options.mask;
  const byteLength: number = expectedu8a.byteLength;

  let match: ByteMatcher;

  if (mask !== undefined) {
    const masku8a = new Uint8Array(Encode.bytes(mask));
    match = byteEquals(expectedu8a, masku8a);
  } else {
    match = byteEquals(expectedu8a);
  }

  return {
    encoding: 'binary',
    byteLength,
    match,
  };
};

export const matchString = (
  expect: string,
  options: Partial<Simplify<StringOptions>> = {},
): Pattern<StringEncoding> => ofStringMemo(expect, options, new Map());
