export type Integer = number | bigint;
export const add = (a: Integer, b: Integer): Integer =>
  typeof a === 'number'
    ? typeof b === 'number'
      ? a + b
      : BigInt(a) + b
    : typeof b === 'number'
      ? a + BigInt(b)
      : a + b;

export const subToNumber = (a: Integer, b: Integer): number =>
  typeof a === 'number'
    ? typeof b === 'number'
      ? a - b
      : Number(BigInt(a) - b)
    : typeof b === 'number'
      ? Number(a - BigInt(b))
      : Number(a - b);

export const mask = (a: Integer, b: Integer): Integer =>
  typeof a === 'number'
    ? typeof b === 'number'
      ? a & b
      : BigInt(a) & b
    : typeof b === 'number'
      ? a & BigInt(b)
      : a & b;

export const min = (...vs: Integer[]) => vs.reduce((a, b) => (a < b ? a : b));
export const max = (...vs: Integer[]) => vs.reduce((a, b) => (a > b ? a : b));
