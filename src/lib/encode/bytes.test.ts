import { encodeByteable, encodeBytes } from './bytes.js';

describe('encodeBytes', () => {
  it('accepts empty array', () => {
    expect(encodeBytes([])).toEqual([]);
  });

  it('accepts array of valid values', () => {
    const valid = new Array(256).fill(0).map(idx => idx);
    expect(encodeBytes(valid)).toEqual(valid);
  });

  it('accepts typed arrays', () => {
    const valid = new Uint8Array(new Array(256).fill(0).map(idx => idx));
    expect(encodeBytes(valid)).toMatchObject(valid);
  });

  it('accepts non-u8 typed arrays', () => {
    const valid = new Uint16Array(new Array(256).fill(0).map(idx => idx));
    expect(encodeBytes(valid)).toMatchObject(valid);
  });

  test.for([
    //
    ['foo'],
    [Infinity],
    [new Date(12345)],
    [null],
    [true],
    [false],
    [1.2],
    [1n],
  ])('rejects invalid values ($0)', val => {
    expect(() => {
      encodeBytes(val as any);
    }).toThrowError(/not a valid integer/);
  });

  it('rejects out-of-range values', val => {
    expect(() => {
      encodeBytes([256]);
    }).toThrow(RangeError);
  });
});

describe('encodeByteable', () => {
  it('encodes plain strings', () => {
    expect(encodeByteable('hi', 'cp1252')).toMatchObject(
      Object.assign(['h'.charCodeAt(0), 'i'.charCodeAt(0)], { encoding: 'binary' }),
    );
  });
  it('encodes numeric arrays', () => {
    expect(encodeByteable([1, 2, 3], 'cp1252')).toMatchObject(
      Object.assign([1, 2, 3], { encoding: 'binary' }),
    );
  });
  it('encodes a mix', () => {
    expect(encodeByteable(['hi', [1, 2, 3]], 'cp1252')).toMatchObject(
      Object.assign(['h'.charCodeAt(0), 'i'.charCodeAt(0), 1, 2, 3], { encoding: 'binary' }),
    );
  });
});
