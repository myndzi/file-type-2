import { checkBytes, anyOf, checkLatin1, allOf, atOffset } from './check.js';
import { Simple } from './simple.js';

export const bmp = Simple.of('image/bmp', 'bmp', checkBytes([0x42, 0x4d]));
export const ac3 = Simple.of('audio/vnd.dolby.dd-raw', 'ac3', checkBytes([0x0b, 0x77]));
export const dmg = Simple.of('application/x-apple-diskimage', 'dmg', checkBytes([0x78, 0x01]));
export const exe = Simple.of('application/x-msdownload', 'exe', checkBytes([0x4d, 0x5a]));
export const Z = Simple.of(
  'application/x-compress',
  'Z',
  // TODO: there's only a fixture for one of these?
  anyOf([
    //
    checkBytes([0x1f, 0xa0]),
    checkBytes([0x1f, 0x9d]),
  ]),
);
export const cpio = Simple.of('application/x-cpio', 'cpio', checkBytes([0xc7, 0x71]));
export const arj = Simple.of('application/x-arj', 'arj', checkBytes([0x60, 0xea]));

export const ps = Simple.of('application/postscript', 'ps', checkBytes([0x25, 0x21]));
export const eps = Simple.childOf(
  ps,
  'application/eps',
  'eps',
  allOf([
    //
    atOffset(checkLatin1('PS'), 2),
    atOffset(checkLatin1(' EPSF-'), 14),
  ]),
);
