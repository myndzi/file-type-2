import { encodeString } from './string.js';

describe('encodeString', () => {
  describe('cp1252', () => {
    it('encodes', () => {
      expect(encodeString('p€', 'cp1252')).toMatchObject(
        Object.assign([0x70, 0x80], { encoding: 'cp1252' }),
      );
    });
    it('rejects undefined code page characters', () => {
      expect(() => {
        encodeString('\x90', 'cp1252');
      }).toThrowErrorMatchingInlineSnapshot(`[Error: \\x90 is undefined in cp1252]`);
    });
    it('rejects unmapped code page characters', () => {
      // BMP
      expect(() => {
        encodeString('☃️', 'cp1252');
      }).toThrowErrorMatchingInlineSnapshot(`[Error: \\u2603 has no mapping to cp1252]`);
      // surrogate pair encodings
      expect(() => {
        encodeString('𐐷', 'cp1252');
      }).toThrowErrorMatchingInlineSnapshot(`[Error: \\u{10437} has no mapping to cp1252]`);
    });
  });
  it('encodes utf-8', () => {
    expect(encodeString('☃️', 'utf8')).toMatchObject(
      Object.assign([0xe2, 0x98, 0x83, 0xef, 0xb8, 0x8f], { encoding: 'utf8' }),
    );
    expect(encodeString('𐐷', 'utf8')).toMatchObject(
      Object.assign([0xf0, 0x90, 0x90, 0xb7], { encoding: 'utf8' }),
    );
  });
  it('encodes utf-16 little-endian', () => {
    expect(encodeString('☃️', 'utf16le')).toMatchObject(
      Object.assign([0x03, 0x26, 0x0f, 0xfe], { encoding: 'utf16le' }),
    );
    expect(encodeString('𐐷', 'utf16le')).toMatchObject(
      Object.assign([0x01, 0xd8, 0x37, 0xdc], { encoding: 'utf16le' }),
    );
  });
  it('encodes utf-16 big-endian', () => {
    expect(encodeString('☃️', 'utf16be')).toMatchObject(
      Object.assign([0x26, 0x03, 0xfe, 0x0f], { encoding: 'utf16be' }),
    );
    expect(encodeString('𐐷', 'utf16be')).toMatchObject(
      Object.assign([0xd8, 0x01, 0xdc, 0x37], { encoding: 'utf16be' }),
    );
  });
});
