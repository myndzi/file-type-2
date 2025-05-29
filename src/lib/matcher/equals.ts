import { ByteMatcher, NullTermination } from './matcher.js';

const byteEqualsUnmasked = (expected: Uint8Array): ByteMatcher => {
  return (actual: Uint8Array): boolean => {
    if (expected.length !== actual.length) return false;

    for (let i = 0; i < expected.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;
  };
};

const byteEqualsMasked = (expected: Uint8Array, mask: Uint8Array): ByteMatcher => {
  if (expected.length !== mask.length) {
    throw new Error('expected.length !== mask.length');
  }

  for (let i = 0; i < expected.length; i++) {
    if ((expected[i] & mask[i]) !== expected[i]) {
      throw new Error('expected does not match its own mask');
    }
  }

  return (actual: Uint8Array): boolean => {
    if (expected.length !== actual.length) return false;

    for (let i = 0; i < expected.length; i++) {
      if ((actual[i] & mask[i]) !== expected[i]) return false;
    }
    return true;
  };
};
export const byteEquals = (expected: Uint8Array, mask?: Uint8Array): ByteMatcher => {
  return mask === undefined ? byteEqualsUnmasked(expected) : byteEqualsMasked(expected, mask);
};

const paddedEqualsRefuseNull = (
  expected: Uint8Array,
  length: number,
  padding: number,
): ByteMatcher => {
  const expectedLength = expected.length;

  return (actual: Uint8Array): boolean => {
    if (actual.length < length) return false;
    for (let i = 0; i < expectedLength; i++) {
      if (actual[i] !== expected[i]) return false;
    }
    for (let i = expectedLength; i < length; i++) {
      if (actual[i] !== padding) return false;
    }
    return true;
  };
};

const paddedEqualsAllowNull = (
  expected: Uint8Array,
  length: number,
  padding: number,
): ByteMatcher => {
  const expectedLength = expected.length;
  const paddingLength = length - 1;

  return (actual: Uint8Array): boolean => {
    if (actual.length < length) return false;
    for (let i = 0; i < expectedLength; i++) {
      if (actual[i] !== expected[i]) return false;
    }
    for (let i = expectedLength; i < paddingLength; i++) {
      if (actual[i] !== padding) return false;
    }
    return actual[paddingLength] === 0 || actual[paddingLength] === padding;
  };
};

const paddedEqualsRequireNull = (
  expected: Uint8Array,
  length: number,
  padding: number,
): ByteMatcher => {
  const expectedLength = expected.length;
  const paddingLength = length - 1;

  return (actual: Uint8Array): boolean => {
    if (actual.length < length) return false;
    for (let i = 0; i < expectedLength; i++) {
      if (actual[i] !== expected[i]) return false;
    }
    for (let i = expectedLength; i < paddingLength; i++) {
      if (actual[i] !== padding) return false;
    }
    return actual[paddingLength] === 0;
  };
};

export const paddedEquals = (
  expected: Uint8Array,
  length: number,
  padding: number,
  nullTermination: NullTermination,
): ByteMatcher => {
  if (length <= expected.length) {
    throw new Error('padding is <= expected.length');
  }
  switch (nullTermination) {
    case NullTermination.REFUSE:
      return paddedEqualsRefuseNull(expected, length, padding);
    case NullTermination.ALLOW:
      return paddedEqualsAllowNull(expected, length, padding);
    case NullTermination.REQUIRE:
      return paddedEqualsRequireNull(expected, length, padding);
  }
};
