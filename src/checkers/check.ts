import { Source } from '../source/types.js';

export type Check = {
  test(source: Source, position: number): Promise<boolean>;
};

/**
 * Create a check against the contents of the supplied Uint8Array
 */
export const checku8 = (u8: Uint8Array): Check => {
  if (u8.length === 0) {
    throw new Error('u8 must be non-empty');
  }

  const bl = u8.byteLength;

  return async (source: Source, position: number): Promise<boolean> =>
    source
      .readu8(position, bl) //
      .then(dv => dv && dv.every((v, idx) => u8[idx] === v));
};

/**
 * Create a check against the supplied byte values
 */
export const checkBytes = (bytes: number[]): Check => {
  if (!bytes.every(b => b >= 0 && b <= 255)) {
    throw new Error('bytes must contain values from 0-255');
  }
  return checku8(new Uint8Array(bytes));
};

/**
 * Create a check against the latin1 (ISO 8859-1)-encoded version
 * of the supplied string
 */
export const checkLatin1 = (text: string): Check => {
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

/**
 * Create a check that returns true when at least one of the
 * supplied checks returns true. Runs the checks in the supplied
 * order and early-returns on the first success.
 */
export const anyOf = (checks: Check[]): Check => {
  if (checks.length === 0) throw new Error('checks may not be empty');
  const len = checks.length;

  return async (source: Source, position: number): Promise<boolean> => {
    for (let i = 0; i < len; i++) {
      if (await checks[i](source, position)) return true;
    }
    return false;
  };
};

/**
 * Create a check that returns true when all of the
 * supplied checks returns true. Runs the checks in the supplied
 * order and early-returns on the first failure.
 */
export const allOf = (checks: Check[]): Check => {
  if (checks.length === 0) throw new Error('checks may not be empty');
  const len = checks.length;

  return async (source: Source, position: number): Promise<boolean> => {
    for (let i = 0; i < len; i++) {
      if (!(await checks[i](source, position))) return false;
    }
    return true;
  };
};

/**
 * Perform the given check at a byte position offset by the supplied amount
 */
export const atOffset = (check: Check, offset: number): Check => {
  if (!Number.isInteger(offset) || offset < 0) throw new Error('offset must be a positive integer');
  return (source: Source, position: number) => check(source, position + offset);
};
