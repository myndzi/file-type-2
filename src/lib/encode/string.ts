import { cp1252 } from './cp1252.js';
import { cp437 } from './cp437.js';
import type { Encoded, StringEncoding } from './encode.js';

export type CodePageMapping<T extends string> = {
  codePage: T;
  mapping: Map<string, number>;
  undefined: Set<string>;
};

const CodePages = { cp1252, cp437 } satisfies Partial<
  Record<StringEncoding, CodePageMapping<StringEncoding>>
>;
type CodePage = keyof typeof CodePages;

export type CodePageEncoder<T extends StringEncoding> = (str: string) => Encoded<T>;

const urepr = (codePoint: number) =>
  codePoint <= 0xffff
    ? `\\u${codePoint.toString(16).padStart(4, '0')}`
    : `\\u{${codePoint.toString(16)}}`;

const encodeToCodePage = <T extends CodePage>(codePage: T): CodePageEncoder<T> => {
  const { mapping, undefined: undef } = CodePages[codePage];

  return (str: string): Encoded<T> => {
    const bytes: Encoded<T> = Object.assign([], { encoding: codePage });

    // `for of` with a string enumerates full unicode characters,
    // so we don't have to worry about surrogate pair hassles
    for (const chr of str) {
      // we're always given a valid string, so chr.codePointAt(0) should
      // be unable to be undefined; typescript doesn't know that though.
      const codePoint = chr.codePointAt(0)!;

      // our input is (presumably) a javascript string literal, which is
      // generally in utf-16. however, "binary" strings can be created
      // with e.g. `\xNN` where NN is arbitrary hex, or by functions
      // such as `atob`. in these cases, what we get is a utf-16 code point
      // representing that literal value, so it's unambiguous.
      // if codePointAt returns a value > 0xff, it's an actual character
      // and not utf-16 encoded binary data
      if (codePoint > 0xff) {
        if (!mapping.has(chr)) {
          throw new Error(`${urepr(codePoint)} has no mapping to ${codePage}`);
        }
        bytes.push(mapping.get(chr)!);
        continue;
      }

      // now, we have one of:
      // - a utf-16 character whose code point maps directly into the
      //   range of the requested code page
      // - a literal "binary" value that may or may not be defined in
      //   the requested code page

      if (undef.has(chr)) {
        throw new Error(
          `\\x${codePoint.toString(16).padStart(2, '0')} is undefined in ${codePage}`,
        );
      }

      bytes.push(codePoint);
    }

    return bytes;
  };
};

const encodeCp1252 = encodeToCodePage('cp1252');
const encodeCp437 = encodeToCodePage('cp437');

const te = new TextEncoder();
const encodeUtf8 = (str: string): Encoded<'utf8'> => {
  // https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto#buffer_sizing
  const maxBuffer = new Uint8Array(str.length * 3);
  const res = te.encodeInto(str, maxBuffer);
  return Object.assign(Array.from(maxBuffer.subarray(0, res.written)), {
    encoding: 'utf8' as const,
  });
};

const encodeUtf16le = (str: string): Encoded<'utf16le'> => {
  const buf = new ArrayBuffer(str.length * 2);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    dv.setUint16(i * 2, str.charCodeAt(i), true);
  }
  return Object.assign(Array.from(u8), { encoding: 'utf16le' as const });
};

const encodeUtf16be = (str: string): Encoded<'utf16be'> => {
  const buf = new ArrayBuffer(str.length * 2);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    dv.setUint16(i * 2, str.charCodeAt(i), false);
  }
  return Object.assign(Array.from(u8), { encoding: 'utf16be' as const });
};

export const encodeString = <const T extends StringEncoding>(
  str: string,
  encoding: T,
): Encoded<T> => {
  switch (encoding) {
    case 'cp437':
      return encodeCp437(str) as Encoded<T>;
    case 'cp1252':
      return encodeCp1252(str) as Encoded<T>;
    case 'utf8':
      return encodeUtf8(str) as Encoded<T>;
    case 'utf16le':
      return encodeUtf16le(str) as Encoded<T>;
    case 'utf16be':
      return encodeUtf16be(str) as Encoded<T>;
  }
};
