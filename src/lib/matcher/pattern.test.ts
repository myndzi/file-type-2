import { ByteEncoding, StringEncoding } from '../encode/encode.js';
import { Integer } from '../integer.js';
import { Pattern as MatchPattern } from './matcher.js';
import { matchBytes, matchString } from './pattern.js';

// TODO: add byteLength validation
describe('pattern', () => {
  describe('ofString', () => {
    test.for<[pat: MatchPattern<StringEncoding>, pos: Integer, enc: StringEncoding]>([
      [matchString('hi'), 0, 'cp1252'],
      [matchString('hi', { encoding: 'utf8' }), 0, 'utf8'],
    ])('respects options', ([pat, pos, enc]) => {
      expect(pat.encoding).toEqual(enc);
    });

    test.for<[pat: MatchPattern<StringEncoding>, actual: number[], expected: boolean]>([
      [matchString('hi'), ['h'.charCodeAt(0), 'i'.charCodeAt(0)], true],
      [matchString('hi'), ['h'.charCodeAt(0), 'a'.charCodeAt(0)], false],
      [
        matchString('hi', { pad: { to: 3, with: ' ' } }),
        ['h'.charCodeAt(0), 'i'.charCodeAt(0), ' '.charCodeAt(0)],
        true,
      ],
    ])('matches correctly (with options)', ([pat, actual, expected]) => {
      expect(pat.match(new Uint8Array(actual))).toEqual(expected);
    });

    it('memoizes on-request encoding transitions', () => {
      const pat = matchString('𐐷', { encoding: 'utf8' });

      expect(() => {
        pat.asEncoding('cp1252');
      }).toThrowErrorMatchingInlineSnapshot(`[Error: \\u{10437} has no mapping to cp1252]`);

      // test
      expect({}).toStrictEqual({});

      expect(pat.asEncoding('utf8')).toStrictEqual(pat);
      expect(pat.match(new Uint8Array([0xf0, 0x90, 0x90, 0xb7]))).toEqual(true);

      expect(pat.asEncoding('utf16le').match(new Uint8Array([0x01, 0xd8, 0x37, 0xdc]))).toEqual(
        true,
      );
      expect(pat.asEncoding('utf16be').match(new Uint8Array([0xd8, 0x01, 0xdc, 0x37]))).toEqual(
        true,
      );
    });

    test.for<string>(['foo', '☃', '𐐷'])('rejects multi-byte padding', chr => {
      expect(() => {
        matchString('foo', { encoding: 'utf8', pad: { to: 3, with: chr } });
      }).toThrowError(/must encode to a single byte/);
    });
  });

  describe('ofBytes', () => {
    test.for<[pat: MatchPattern<ByteEncoding>, actual: number[], expected: boolean]>([
      [matchBytes('hi'), ['h'.charCodeAt(0), 'i'.charCodeAt(0)], true],
      [matchBytes('hi'), ['h'.charCodeAt(0), 'a'.charCodeAt(0)], false],
      [
        matchBytes('hi', { mask: [0b01101000, 0b01101001] }),
        ['h'.charCodeAt(0) + 2, 'i'.charCodeAt(0) + 2],
        true,
      ],
      [
        matchBytes('hi', { mask: [0b01101000, 0b01101001] }),
        ['h'.charCodeAt(0) + 1, 'i'.charCodeAt(0) + 1],
        false,
      ],
    ])('matches correctly (with options)', ([pat, actual, expected]) => {
      expect(pat.encoding).toEqual('binary');
      expect(pat.match(new Uint8Array(actual))).toEqual(expected);
    });
  });
});
