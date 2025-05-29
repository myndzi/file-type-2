import { resolve } from 'node:path';
import { FileSource } from './source/filesource.js';
import { LazySource } from './source/lazysource.js';

type CheckFn = (actual: Uint8Array) => boolean;

const arrayEvery = Array.prototype.every;
const matchesValues = (checkFor: ArrayLike<number>, mask?: ArrayLike<number>) => {
  if (mask && mask.length !== checkFor.length) {
    throw new Error('Mask length does not match data length');
  }

  const check = mask
    ? (value: number, idx: number): boolean => (value & mask[idx]) === checkFor[idx]
    : (value: number, idx: number): boolean => value === checkFor[idx];

  return (actual: ArrayLike<number>): boolean =>
    actual.length === checkFor.length && arrayEvery.call(actual, check);
};

/**
 * Create a check against the contents of the supplied Uint8Array
 */
export const checku8 = (u8: ArrayLike<number>, mask?: ArrayLike<number>): CheckFn => {
  if (u8.length === 0) {
    throw new Error('u8 must be non-empty');
  }

  return matchesValues(u8, mask);
};

/**
 * Create a check against the supplied byte values
 */
export const checkBytes = (bytes: ArrayLike<number>, mask?: ArrayLike<number>): CheckFn => {
  if (!arrayEvery.call(bytes, b => b >= 0 && b <= 255)) {
    throw new Error('bytes must contain values from 0-255');
  }
  return checku8(new Uint8Array(bytes), mask);
};

/**
 * Create a check against the latin1 (ISO 8859-1)-encoded version
 * of the supplied string
 */
export const checkLatin1 = (text: string): CheckFn => {
  const u8 = new Uint8Array(text.length);

  // we don't have to worry about surrogate pairs here, because any
  // value that's part of a surrogate pair will also be outside of
  // the latin1 range (0-255)
  for (let i = 0; i < text.length; i++) {
    const codeUnit = text.charCodeAt(i);
    if (codeUnit > 255) throw new Error('text must consist of only latin1-compatible characters');
    u8[i] = codeUnit;
  }

  return checku8(u8);
};

const json = async (source: LazySource) => {
  await source.check(0, 1, checkLatin1('{'));
  await source.check(4, 1, checkBytes([0x22]));
  console.log('success json');
};

const pjsonName = async (source: LazySource) => {
  await source.check(5, 4, checkLatin1('nAme'));
  console.log('success name');
};

const checks = [json, pjsonName];

(async () => {
  await FileSource.with(resolve(import.meta.dirname, '..', 'package.json'), async file => {
    await LazySource.with(file, async source => {
      const res = await Promise.allSettled(checks.map(check => check(source)));
      for (const [idx, settlement] of res.entries()) {
        if (settlement.status === 'fulfilled') {
          console.log('ok', checks[idx].name);
        } else {
          console.log('fail', checks[idx].name);
        }
      }
    });
  });
})();
