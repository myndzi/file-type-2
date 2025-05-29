import { byteEquals, paddedEquals } from './equals.js';
import { NullTermination } from './matcher.js';

// https://vitest.dev/api/#test-each

describe('equals', () => {
  describe('byteEquals (no mask)', () => {
    test.for<[expected: number[], actual: number[], result: boolean]>([
      [[], [], true],
      [[1], [], false],
      [[], [1], false],
      [[2], [1], false],
      [[2], [2, 1], false],
      [[2, 1, 3], [2, 1, 3], true],
    ])('byteEquals($0)($1) === $2', ([expected, actual, result]) => {
      expect(byteEquals(new Uint8Array(expected))(new Uint8Array(actual))).toEqual(result);
    });
  });

  describe('byteEquals (masked)', () => {
    test.for<[expected: number[], mask: number[], actual: number[], result: boolean]>([
      [[], [], [], true],
      [[1], [1], [], false],
      [[], [], [1], false],
      [[1], [1], [2], false],
      [[1], [1], [1], true],
      [[1], [1], [3], true],
      [[2, 1, 3], [3, 3, 3], [2, 1, 4], false],
      [[2, 1, 3], [3, 3, 3], [2, 1, 7], true],
    ])('byteEquals($0, $1)($2) === $3', ([expected, mask, actual, result]) => {
      expect(
        byteEquals(new Uint8Array(expected), new Uint8Array(mask))(new Uint8Array(actual)),
      ).toEqual(result);
    });
    it('expected length and mask length must match', () => {
      expect(() => {
        byteEquals(new Uint8Array(0), new Uint8Array(1));
      }).toThrowErrorMatchingInlineSnapshot(`[Error: expected.length !== mask.length]`);
    });
    it('expected value must match its own mask', () => {
      expect(() => {
        byteEquals(new Uint8Array([3]), new Uint8Array([1]));
      }).toThrowErrorMatchingInlineSnapshot(`[Error: expected does not match its own mask]`);
    });
  });

  const ALLOW = NullTermination.ALLOW;
  const REFUSE = NullTermination.REFUSE;
  const REQUIRE = NullTermination.REQUIRE;

  describe('paddedEquals (sanity)', () => {
    it('padding must be larger than expected', () => {
      expect(() => {
        paddedEquals(new Uint8Array(3), 2, 0, ALLOW);
      }).toThrowErrorMatchingInlineSnapshot(`[Error: padding is <= expected.length]`);
      expect(() => {
        paddedEquals(new Uint8Array(3), 3, 0, ALLOW);
      }).toThrowErrorMatchingInlineSnapshot(`[Error: padding is <= expected.length]`);
      expect(() => {
        paddedEquals(new Uint8Array(3), 4, 0, ALLOW);
      }).not.toThrow();
    });
  });
  describe('paddedEquals (refuse null-terminated)', () => {
    test.for<
      [
        expected: number[],
        length: number,
        padding: number,
        nullTermination: NullTermination,
        actual: number[],
        result: boolean,
      ]
    >([
      [[], 1, 0x20, REFUSE, [1], false],
      [[], 2, 0x20, REFUSE, [1], false],
      [[], 1, 0x20, REFUSE, [0x20], true],
      [[], 2, 0x20, REFUSE, [0x20, 1], false],
      [[], 2, 0x20, REFUSE, [0x20, 0], false],
      [[], 2, 0x20, REFUSE, [0x20, 0x20], true],

      [[1], 2, 0x20, REFUSE, [1, 1], false],
      [[1], 3, 0x20, REFUSE, [1, 1], false],
      [[1], 2, 0x20, REFUSE, [1, 0x20], true],
      [[1], 2, 0x20, REFUSE, [2, 0x20], false],
      [[1], 3, 0x20, REFUSE, [1, 0x20, 1], false],
      [[1], 3, 0x20, REFUSE, [1, 0x20, 0], false],
      [[1], 3, 0x20, REFUSE, [1, 0x20, 0x20], true],
    ])(
      'paddedEquals($0, $1, $2, $3) === $4',
      ([expected, length, padding, nulls, actual, result]) => {
        expect(
          paddedEquals(new Uint8Array(expected), length, padding, nulls)(new Uint8Array(actual)),
        ).toEqual(result);
      },
    );
  });
  describe('paddedEquals (allow null-terminated)', () => {
    test.for<
      [
        expected: number[],
        length: number,
        padding: number,
        nullTermination: NullTermination,
        actual: number[],
        result: boolean,
      ]
    >([
      [[], 1, 0x20, ALLOW, [1], false],
      [[], 2, 0x20, ALLOW, [1], false],
      [[], 1, 0x20, ALLOW, [0x20], true],
      [[], 1, 0x20, ALLOW, [0], true],
      [[], 2, 0x20, ALLOW, [0x20, 1], false],
      [[], 2, 0x20, ALLOW, [0x20, 0], true],
      [[], 2, 0x20, ALLOW, [0, 0x20], false], // only last byte may be null
      [[], 2, 0x20, ALLOW, [0x20, 0x20], true],

      [[1], 2, 0x20, ALLOW, [1, 1], false],
      [[1], 3, 0x20, ALLOW, [1, 1], false],
      [[1], 2, 0x20, ALLOW, [1, 0x20], true],
      [[1], 2, 0x20, ALLOW, [1, 0], true],
      [[1], 2, 0x20, ALLOW, [2, 0x20], false],
      [[1], 3, 0x20, ALLOW, [1, 0x20, 1], false],
      [[1], 3, 0x20, ALLOW, [1, 0x20, 0], true],
      [[1], 4, 0x20, ALLOW, [1, 0x20, 0, 0], false], // only last byte may be null
      [[1], 3, 0x20, ALLOW, [1, 0, 0x20], false], // only last byte may be null
      [[1, 2], 3, 0x20, ALLOW, [1, 0, 0x20], false],
      [[1], 3, 0x20, ALLOW, [1, 0x20, 0x20], true],
    ])(
      'paddedEquals($0, $1, $2, $3) === $4',
      ([expected, length, padding, nulls, actual, result]) => {
        expect(
          paddedEquals(new Uint8Array(expected), length, padding, nulls)(new Uint8Array(actual)),
        ).toEqual(result);
      },
    );
  });
  describe('paddedEquals (require null-terminated)', () => {
    test.for<
      [
        expected: number[],
        length: number,
        padding: number,
        nullTermination: NullTermination,
        actual: number[],
        result: boolean,
      ]
    >([
      [[], 1, 0x20, REQUIRE, [1], false],
      [[], 2, 0x20, REQUIRE, [1], false],
      [[], 1, 0x20, REQUIRE, [0], true], // null must be last byte
      [[], 2, 0x20, REQUIRE, [0], false], // null must be last byte
      [[], 1, 0x20, REQUIRE, [0x20], false],
      [[], 2, 0x20, REQUIRE, [0x20, 1], false],
      [[], 2, 0x20, REQUIRE, [0x20, 0], true],
      [[], 3, 0x20, REQUIRE, [0x20, 1, 0], false],
      [[], 2, 0x20, REQUIRE, [0x20, 0x20], false],

      [[1], 2, 0x20, REQUIRE, [1, 1], false],
      [[1], 3, 0x20, REQUIRE, [1, 1], false],
      [[1], 2, 0x20, REQUIRE, [1, 0x20], false],
      [[1], 2, 0x20, REQUIRE, [2, 0x20], false],
      [[1], 3, 0x20, REQUIRE, [1, 0x20, 1], false],
      [[1], 3, 0x20, REQUIRE, [1, 0x20, 0], true],
      [[1], 3, 0x20, REQUIRE, [1, 0x20, 0x20], false],
    ])(
      'paddedEquals($0, $1, $2, $3) === $4',
      ([expected, length, padding, nulls, actual, result]) => {
        expect(
          paddedEquals(new Uint8Array(expected), length, padding, nulls)(new Uint8Array(actual)),
        ).toEqual(result);
      },
    );
  });
});
