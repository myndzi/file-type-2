import { Encoded, StringEncoding } from './encode.js';
import { encodeString } from './string.js';

export const encodeBytes = (vals: ArrayLike<number>): number[] =>
  Array.from(vals, (val: number) => {
    if (!Number.isInteger(val)) throw new Error(`${val} is not a valid integer`);
    if (val < 0 || val > 0xff) throw new RangeError(`${val} must be from 0x00-0xFF`);
    return val;
  });

export type Byteable = string | ArrayLike<number> | Byteable[];

export const encodeByteable = (data: Byteable, encoding: StringEncoding): Encoded<'binary'> => {
  let bytes: number[];
  if (typeof data === 'string') {
    // encodeByteable('foo')
    bytes = encodeString(data, encoding);
  } else if (Array.prototype.every.call(data, v => typeof v === 'number')) {
    // encodeByteable([1, 2, 3]);
    bytes = encodeBytes(data as ArrayLike<number>);
  } else {
    // encodeByteable(['foo', [1, 2, 3]])
    bytes = (data as (string | ArrayLike<number>)[]).flatMap(v =>
      typeof v === 'string' ? encodeString(v, encoding) : encodeBytes(v),
    );
  }

  return Object.assign(bytes, { encoding: 'binary' as const });
};
