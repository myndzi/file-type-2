import type { CodePageMapping } from './string.js';

// https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1252.TXT
export const cp1252: CodePageMapping<'cp1252'> = {
  codePage: 'cp1252',
  mapping: new Map(
    Object.entries({
      '\u20AC': 0x80,
      '\u201A': 0x82,
      '\u0192': 0x83,
      '\u201E': 0x84,
      '\u2026': 0x85,
      '\u2020': 0x86,
      '\u2021': 0x87,
      '\u02C6': 0x88,
      '\u2030': 0x89,
      '\u0160': 0x8a,
      '\u2039': 0x8b,
      '\u0152': 0x8c,
      '\u017D': 0x8e,
      '\u2018': 0x91,
      '\u2019': 0x92,
      '\u201C': 0x93,
      '\u201D': 0x94,
      '\u2022': 0x95,
      '\u2013': 0x96,
      '\u2014': 0x97,
      '\u02DC': 0x98,
      '\u2122': 0x99,
      '\u0161': 0x9a,
      '\u203A': 0x9b,
      '\u0153': 0x9c,
      '\u017E': 0x9e,
      '\u0178': 0x9f,
    }),
  ),
  undefined: new Set(['\x81', '\x8D', '\x8F', '\x90', '\x9D']),
};
