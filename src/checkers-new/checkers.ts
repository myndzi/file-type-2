import { ID3v2_3 } from './id3.js';
import { Simple, allOf, anyOf, bytes, stringf, stringp } from './simple.js';
export * from './odf.js';

export const bmp = Simple.of('image/bmp', 'bmp', bytes([0x42, 0x4d]));
export const ac3 = Simple.of('audio/vnd.dolby.dd-raw', 'ac3', bytes([0x0b, 0x77]));
export const dmg = Simple.of('application/x-apple-diskimage', 'dmg', bytes([0x78, 0x01]));
export const exe = Simple.of('application/x-msdownload', 'exe', bytes([0x4d, 0x5a]));
export const Z = Simple.of(
  'application/x-compress',
  'Z',
  // TODO: there's only a fixture for one of these?
  anyOf([
    //
    bytes([0x1f, 0xa0]),
    bytes([0x1f, 0x9d]),
  ]),
);
export const cpio = Simple.of(
  'application/x-cpio',
  'cpio',
  anyOf([bytes([0xc7, 0x71]), stringf('070707')]),
);
export const arj = Simple.of('application/x-arj', 'arj', bytes([0x60, 0xea]));

// export const ps = Simple.of('application/postscript', 'ps', bytes([0x25, 0x21]));

// export const eps = Simple.childOf(
//   ps,
//   'application/eps',
//   'eps',
//   allOf([
//     //
//     Latin1('PS', 2),
//     Latin1(' EPSF-', 14),
//   ]),
// );

export const gif = Simple.of('image/gif', 'gif', bytes([0x47, 0x49, 0x46]));
export const jxr = Simple.of('image/vnd.ms-photo', 'jxr', bytes([0x49, 0x49, 0xbc]));
export const gz = Simple.of('application/gzip', 'gz', bytes([0x1f, 0x8b, 0x8]));
export const bz2 = Simple.of('application/x-bzip2', 'bz2', bytes([0x42, 0x5a, 0x68]));
export const mpc = Simple.of(
  'audio/x-musepack',
  'mpc',
  anyOf([
    stringf('MP+'), // SV7
    stringf('MPCK'), // SV8
  ]),
);
export const swf = Simple.of(
  'application/x-shockwave-flash',
  'swf',
  anyOf([
    //
    bytes([0x43, 0x57, 0x53]),
    bytes([0x46, 0x57, 0x53]),
  ]),
);

export const jpg = Simple.of('image/jpeg', ['jpg' /*, 'jpeg'*/], bytes([0xff, 0xd8, 0xff]));
export const jls = Simple.childOf(jpg, 'image/jls', 'jls', bytes([0xf7]));
export const avro = Simple.of('application/avro', 'avro', bytes([0x4f, 0x62, 0x6a, 0x01]));
export const flif = Simple.of('image/flif', 'flif', stringf('FLIF'));
export const psd = Simple.of('image/vnd.adobe.photoshop', 'psd', stringf('8BPS'));
export const aif = Simple.of('audio/aiff', 'aif', stringf('FORM'));
export const icns = Simple.of('image/icns', 'icns', stringf('icns'));
export const mid = Simple.of('audio/midi', 'mid', stringf('MThd'));
export const woff = Simple.of(
  'font/woff',
  'woff',
  allOf([
    stringf('wOFF'),
    anyOf([
      //
      bytes([0x00, 0x01, 0x00, 0x00], 4),
      stringf('OTTO', 4),
    ]),
  ]),
);
export const woff2 = Simple.of(
  'font/woff2',
  'woff2',
  allOf([
    //
    stringf('wOF2'),
    anyOf([
      //
      bytes([0x00, 0x01, 0x00, 0x00], 4),
      stringf('OTTO', 4),
    ]),
  ]),
);
export const pcap = Simple.of(
  'application/vnd.tcpdump.pcap',
  'pcap',
  anyOf([bytes([0xd4, 0xc3, 0xb2, 0xa1]), bytes([0xa1, 0xb2, 0xc3, 0xd4])]),
);

export const dsf = Simple.of('audio/x-dsf', 'dsf', stringf('DSD '));
export const lz = Simple.of('application/x-lzip', 'lz', stringf('LZIP'));
// flac with id3 failing
export const flac = Simple.childOf(ID3v2_3, 'audio/x-flac', 'flac', stringf('fLaC'), false);
export const bpg = Simple.of('image/bpg', 'bpg', bytes([0x42, 0x50, 0x47, 0xfb]));
export const wv = Simple.of('audio/wavpack', 'wv', stringf('wvpk'));

export const wasm = Simple.of('application/wasm', 'wasm', bytes([0x00, 0x61, 0x73, 0x6d]));
export const ape = Simple.of('audio/ape', 'ape', stringf('MAC '));

export const sqlite = Simple.of('application/x-sqlite3', 'sqlite', stringf('SQLi'));
export const nes = Simple.of(
  'application/x-nintendo-nes-rom',
  'nes',
  bytes([0x4e, 0x45, 0x53, 0x1a]),
);
export const crx = Simple.of('application/x-google-chrome-extension', 'crx', stringf('Cr24'));
export const cab = Simple.of(
  'application/vnd.ms-cab-compressed',
  'cab',
  anyOf([
    //
    stringf('MSCF'),
    stringf('ISc('),
  ]),
);
export const rpm = Simple.of('application/x-rpm', 'rpm', bytes([0xed, 0xab, 0xee, 0xdb]));
// https://www.fileformat.info/format/eps/egff.htm see this later
// export const eps = Simple.of('application/eps', 'eps', bytes([0xc5, 0xd0, 0xd3, 0xc6]));
export const zst = Simple.of('application/zstd', 'zst', bytes([0x28, 0xb5, 0x2f, 0xfd]));
export const elf = Simple.of('application/x-elf', 'elf', bytes([0x7f, 0x45, 0x4c, 0x46]));
export const pst = Simple.of('application/vnd.ms-outlook', 'pst', bytes([0x21, 0x42, 0x44, 0x4e]));
export const parquet = Simple.of('application/x-parquet', 'parquet', stringf('PAR1'));
export const ttc = Simple.of('font/collection', 'ttc', stringf('ttcf'));
export const macho = Simple.of(
  'application/x-mach-binary',
  'macho',
  bytes([0xcf, 0xfa, 0xed, 0xfe]),
);
export const lz4 = Simple.of(
  'application/x-lz4', // non-standard
  'lz4',
  bytes([0x04, 0x22, 0x4d, 0x18]),
);

export const otf = Simple.of('font/otf', 'otf', bytes([0x4f, 0x54, 0x54, 0x4f, 0x00]));
export const amr = Simple.of('audio/amr', 'amr', stringf('#!AMR'));
export const rtf = Simple.of('application/rtf', 'rtf', stringf('{\\rtf'));
export const flv = Simple.of('video/x-flv', 'flv', bytes([0x46, 0x4c, 0x56, 0x01]));
export const it = Simple.of('audio/x-it', 'it', stringf('IMPM'));

export const lzh = Simple.of(
  'application/x-lzh-compressed',
  'lzh',
  anyOf([
    stringf('-lh0-', 2),
    stringf('-lh1-', 2),
    stringf('-lh2-', 2),
    stringf('-lh3-', 2),
    stringf('-lh4-', 2),
    stringf('-lh5-', 2),
    stringf('-lh6-', 2),
    stringf('-lh7-', 2),
    stringf('-lzs-', 2),
    stringf('-lz4-', 2),
    stringf('-lz5-', 2),
    stringf('-lhd-', 2),
  ]),
);

export const chm = Simple.of('application/vnd.ms-htmlhelp', 'chm', stringf('ITSF'));
export const _class = Simple.of('application/java-vm', 'class', bytes([0xca, 0xfe, 0xba, 0xbe]));
export const rm = Simple.of('application/vnd.rn-realmedia', 'rm', stringf('.RMF'));
export const drc = Simple.of(
  'application/vnd.google.draco', // non-standard
  'drc',
  stringf('DRACO'),
);

export const xz = Simple.of('application/x-xz', 'xz', bytes([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00]));
export const xml = Simple.of(
  'application/xml',
  'xml',
  anyOf([
    //
    stringf('<?xml '),
    // TODO: deal with endianness and text streams differently
    // (e.g. by swapping the comparison function instead of comparing
    // against every permutation)
    allOf([
      bytes([0xfe, 0xff]), // UTF-16-BOM-LE *** error? this is BE?
      bytes([0, 60, 0, 63, 0, 120, 0, 109, 0, 108], 2), // '<?xml' in utf-16 big-endian
    ]),
    allOf([
      bytes([0xff, 0xfe]), // UTF-16-BOM-BE *** error? this is LE?
      bytes([60, 0, 63, 0, 120, 0, 109, 0, 108, 0], 2), // '<?xml' in utf-16 little-endian
    ]),
    allOf([
      bytes([0xef, 0xbb, 0xbf]), // UTF-8 BOM
      stringf('<?xml ', 3),
    ]),
  ]),
);

export const _7z = Simple.of(
  'application/x-7z-compressed',
  '7z',
  bytes([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]),
);

export const rar = Simple.of(
  'application/x-rar-compressed',
  'rar',
  allOf([
    //
    bytes([0x52, 0x61, 0x72, 0x21, 0x1a, 0x7]),
    anyOf([
      //
      bytes([0x0], 6),
      bytes([0x1], 6),
    ]),
  ]),
);

export const stl = Simple.of('model/stl', 'stl', stringf('solid '));
export const blend = Simple.of('application/x-blender', 'blend', stringf('BLENDER'));

export const ar = Simple.of('application/x-unix-archive', 'ar', stringf('!<arch>\n'));
export const deb = Simple.childOf(ar, 'application/x-deb', 'deb', stringf('debian-binary'));

export const arrow = Simple.of(
  'application/x-apache-arrow',
  'arrow',
  bytes([0x41, 0x52, 0x52, 0x4f, 0x57, 0x31, 0x00, 0x00]),
);
export const glb = Simple.of(
  'model/gltf-binary',
  'glb',
  bytes([0x67, 0x6c, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00]),
);
export const mov = Simple.of(
  'video/quicktime',
  'mov',
  anyOf([
    stringf('free', 4),
    stringf('mdat', 4), // MJPEG
    stringf('moov', 4),
    stringf('wide', 4),
  ]),
);

// File Type Box (https://en.wikipedia.org/wiki/ISO_base_media_file_format)
// It's not required to be first, but it's recommended to be. Almost all ISO base media files start with `ftyp` box.
// `ftyp` box must contain a brand major identifier, which must consist of ISO 8859-1 printable characters.
// Here we check for 8859-1 printable characters (for simplicity, it's a mask which also catches one non-printable character).
export const mp4 = Simple.of('video/mp4', 'mp4', stringf('ftyp', 4));
export const avif = Simple.childOf(
  mp4,
  'image/avif',
  'avif',
  anyOf(
    //
    [stringf('avif'), stringf('avis')],
  ),
);
export const heif = Simple.childOf(mp4, 'image/heif', 'heif', stringf('mif1'));
export const heif_s = Simple.childOf(mp4, 'image/heif-sequence', 'heif', stringf('msf1'));
export const heic = Simple.childOf(
  mp4,
  'image/heic',
  'heic',
  anyOf([
    //
    stringf('heic'),
    stringf('heix'),
  ]),
);
export const heic_s = Simple.childOf(
  mp4,
  'image/heic-sequence',
  'heic',
  anyOf([
    //
    stringf('hevc'),
    stringf('hevx'),
  ]),
);
export const qt = Simple.childOf(mp4, 'video/quicktime', 'mov', stringp('qt', 4));
export const m4v = Simple.childOf(
  mp4,
  'video/x-m4v',
  'm4v',
  anyOf([
    //
    stringp('M4V', 4),
    stringf('M4VH'),
    stringf('M4VP'),
  ]),
);
export const m4p = Simple.childOf(mp4, 'video/mp4', 'm4p', stringp('M4P', 4));
export const m4b = Simple.childOf(mp4, 'audio/mp4', 'm4b', stringp('M4B', 4));
export const m4a = Simple.childOf(mp4, 'audio/x-m4a', 'm4a', stringp('M4A', 4));
export const f4v = Simple.childOf(mp4, 'video/mp4', 'f4v', stringp('F4V', 4));
export const f4p = Simple.childOf(mp4, 'video/mp4', 'f4p', stringp('F4P', 4));
export const f4a = Simple.childOf(mp4, 'audio/mp4', 'f4a', stringp('F4A', 4));
export const f4b = Simple.childOf(mp4, 'audio/mp4', 'f4b', stringp('F4B', 4));
export const cr3 = Simple.childOf(mp4, 'image/x-canon-cr3', 'cr3', stringp('crx', 4));
export const _3gp = Simple.childOf(mp4, 'video/3gpp', '3gp', stringf('3g'));
export const _3g2 = Simple.childOf(_3gp, 'video/3gpp2', '3g2', stringf('2'));

export const orf = Simple.of(
  'image/x-olympus-orf',
  'orf',
  bytes([0x49, 0x49, 0x52, 0x4f, 0x08, 0x00, 0x00, 0x00, 0x18]),
);
export const xcf = Simple.of('image/x-xcf', 'xcf', stringf('gimp xcf'));

export const riff = Simple.of('/', [], stringf('RIFF'));
export const webp = Simple.childOf(riff, 'image/webp', 'webp', stringf('WEBP', 4));
export const avi = Simple.childOf(riff, 'video/vnd.avi', 'avi', stringf('AVI', 4));
export const wav = Simple.childOf(riff, 'audio/wav', 'wav', stringf('WAVE', 4));
export const qcp = Simple.childOf(riff, 'audio/qcelp', 'qcp', stringf('QLCM', 4));

export const rw2 = Simple.of(
  'image/x-panasonic-rw2',
  'rw2',
  bytes([0x49, 0x49, 0x55, 0x00, 0x18, 0x00, 0x00, 0x00, 0x88, 0xe7, 0x74, 0xd8]),
);

export const ktx = Simple.of(
  'image/ktx',
  'ktx',
  bytes([0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]),
);
export const mie = Simple.of(
  'application/x-mie',
  'mie',
  allOf([
    anyOf([bytes([0x7e, 0x10, 0x04]), bytes([0x7e, 0x18, 0x04])]),
    bytes([0x30, 0x4d, 0x49, 0x45], 4),
  ]),
);

export const shp = Simple.of(
  'application/x-esri-shape',
  'shp',
  bytes([0x27, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], 2),
);
export const j2c = Simple.of('image/j2c', 'j2c', bytes([0xff, 0x4f, 0xff, 0x51]));

// JPEG-2000 family
// TODO: allow parents that can't match on their own (?)
export const jpeg2000 = Simple.of(
  '/',
  [],
  bytes([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a]),
);
export const jp2 = Simple.childOf(jpeg2000, 'image/jp2', 'jp2', stringf('jp2 ', 8));
export const jpx = Simple.childOf(jpeg2000, 'image/jpx', 'jpx', stringf('jpx ', 8));
export const jpm = Simple.childOf(jpeg2000, 'image/jpm', 'jpm', stringf('jpm ', 8));
export const mj2 = Simple.childOf(jpeg2000, 'image/mj2', 'mj2', stringf('mjp2', 8));

export const jxl = Simple.of(
  'image/jxl',
  'jxl',
  anyOf([
    bytes([0xff, 0x0a]),
    bytes([0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a]),
  ]),
);

export const cfb = Simple.of(
  'application/x-cfb',
  'cfb',
  bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
);

export const icc = Simple.of(
  'application/vnd.iccprofile',
  'icc',
  bytes([0x61, 0x63, 0x73, 0x70], 36),
);

export const ace = Simple.of(
  'application/x-ace-compressed',
  'ace',
  allOf([
    //
    stringf('**ACE', 7),
    stringf('**', 12),
  ]),
);

export const __vc = Simple.of('/', [], stringf('BEGIN:'));
export const vcf = Simple.childOf(__vc, 'text/vcard', 'vcf', stringf('VCARD'));
export const ics = Simple.childOf(__vc, 'text/calendar', 'ics', stringf('VCALENDAR'));

export const raf = Simple.of('image/x-fujifilm-raf', 'raf', stringf('FUJIFILMCCD-RAW'));
export const xm = Simple.of('audio/x-xm', 'xm', stringf('Extended Module:'));
export const voc = Simple.of('audio/x-voc', 'voc', stringf('Creative Voice File'));

export const mxf = Simple.of(
  'application/mxf',
  'mxf',
  bytes([0x06, 0x0e, 0x2b, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0d, 0x01, 0x02, 0x01, 0x01, 0x02]),
);

export const s3m = Simple.of('audio/x-s3m', 's3m', stringf('SCRM', 44));

export const mts = Simple.of(
  'video/mp2t',
  'mts',
  anyOf([
    allOf([
      // Raw MPEG-2 transport stream (188-byte packets)
      bytes([0x47]),
      bytes([0x47], 188),
    ]),
    allOf([
      // Blu-ray Disc Audio-Video (BDAV) MPEG-2 transport stream has 4-byte TP_extra_header before each 188-byte packet
      bytes([0x47], 4),
      bytes([0x47], 196),
    ]),
  ]),
);

export const mobi = Simple.of(
  'application/x-mobipocket-ebook',
  'mobi',
  bytes([0x42, 0x4f, 0x4f, 0x4b, 0x4d, 0x4f, 0x42, 0x49], 60),
);

export const dcm = Simple.of('application/dicom', 'dcm', bytes([0x44, 0x49, 0x43, 0x4d], 128));
export const lnk = Simple.of(
  'application/x.ms.shortcut', // non-standard
  'lnk',
  bytes([
    0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc0, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x46,
  ]),
);

export const alias = Simple.of(
  'application/x.apple.alias', // non-standard
  'alias',
  bytes([
    0x62, 0x6f, 0x6f, 0x6b, 0x00, 0x00, 0x00, 0x00, 0x6d, 0x61, 0x72, 0x6b, 0x00, 0x00, 0x00, 0x00,
  ]),
);
export const fbx = Simple.of(
  'application/x.autodesk.fbx', // non-standard
  'fbx',
  allOf([
    // TODO: better way to combine strings and binary data
    stringf('Kaydara FBX Binary  '),
    bytes([0], 20),
  ]),
);

export const eot = Simple.of(
  'application/vnd.ms-fontobject',
  'eot',
  allOf([
    //
    bytes([0x4c, 0x50], 34),
    anyOf([
      bytes([0x00, 0x00, 0x01], 8),
      bytes([0x01, 0x00, 0x02], 8),
      bytes([0x02, 0x00, 0x02], 8),
    ]),
  ]),
);

export const indd = Simple.of(
  'application/x-indesign',
  'indd',
  bytes([
    0x06, 0x06, 0xed, 0xf5, 0xd8, 0x1d, 0x46, 0xe5, 0xbd, 0x31, 0xef, 0xe7, 0xfe, 0x74, 0xb7, 0x1d,
  ]),
);

export const skp = Simple.of(
  'application/vnd.sketchup.skp',
  'skp',
  bytes([
    0xff, 0xfe, 0xff, 0x0e, 0x53, 0x00, 0x6b, 0x00, 0x65, 0x00, 0x74, 0x00, 0x63, 0x00, 0x68, 0x00,
    0x55, 0x00, 0x70, 0x00, 0x20, 0x00, 0x4d, 0x00, 0x6f, 0x00, 0x64, 0x00, 0x65, 0x00, 0x6c, 0x00,
  ]),
);

export const pgp = Simple.of(
  'application/pgp-encrypted',
  'pgp',
  stringf('-----BEGIN PGP MESSAGE-----'),
);
