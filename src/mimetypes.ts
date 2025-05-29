import _mdb from 'mime-db';

type Ext = string & { __brand__: 'ext' };
type Mime = string & { __brand__: 'mime' };
type Codec = string & { __brand__: 'codec' };
type Profile = string & { __brand__: 'profile' };

type CtorParams<T extends { new (...args: any): any }> = T extends { new (...args: infer P): any } ? P : never;



interface Source<T extends unknown> {
  read(offset: number, length: number): DataView;
}

class Simple<T extends Mime> {
  readonly mime: T;
  readonly exts: Ext[];
  constructor(mime: T, exts: Ext[], private offset: number, private bytes: Uint8Array) {
    this.mime = mime;
    this.exts = exts;
  }

  check(source: Source<any>): source is Source<T> {
    const 


  }

}


class Checker {
  private subtypes: Checker[] = [];

  public mime: Mime;
  public exts: Ext[];
  public codecs: Codec[];
  public profiles: Profile[];

  private _preFilter: Uint8Array;
  private _validate: () => boolean;

  public constructor({
    exts,
    mime,
    synthetic,
    codecs,
    profiles,
  }: {
    mime: string;
    exts: string[];
    codecs?: string[];
    profiles?: string[];
    synthetic?: boolean;
  }) {
    this.mime = mime as Mime;
    this.exts = exts as Ext[];
    this._preFilter = new Uint8Array();
    this._validate = () => false;
    this.codecs = (codecs ?? []) as Codec[];
    this.profiles = (profiles ?? []) as Profile[];
  }

  static of(...args: CtorParams<typeof Checker>) {
    return new Checker(...args);
  }

  subtype(checker: Checker): void {
    this.subtypes.push(checker);
    this.exts = { ...this.exts, ...checker.exts };
  }
}

class Inspector {
  private checkers: Checker[] = [];
  private byExt: Record<Ext, Checker[]> = {};
  private byMime: Record<Mime, Checker[]> = {};

  constructor() {}
  add(checker: Checker): void {
    this.checkers.push(checker);

    for (const ext of Object.keys(checker.exts) as Ext[]) {
      this.byExt[ext] ??= [];
      this.byExt[ext].push(checker);
    }

    for (const mime of Object.keys(checker.mime) as Mime[]) {
      this.byMime[mime] ??= [];
      this.byMime[mime].push(checker);
    }
  }
}

const ins = new Inspector();

ins.add(
  Checker.of({
    exts: ['avro'],
    mime: 'application/avro',
  })
);
ins.add(
  Checker.of({
    exts: ['dcm'],
    mime: 'application/dicom',
  })
);
ins.add(
  Checker.of({
    exts: ['eps'],
    mime: 'application/eps',
  })
);
ins.add(
  Checker.of({
    exts: ['epub'],
    mime: 'application/epub+zip',
  })
);
ins.add(
  Checker.of({
    exts: ['gz'],
    mime: 'application/gzip',
  })
);
ins.add(
  Checker.of({
    exts: ['jar'],
    mime: 'application/java-archive',
  })
);
ins.add(
  Checker.of({
    exts: ['class'],
    mime: 'application/java-vm',
  })
);
ins.add(
  Checker.of({
    exts: ['mxf'],
    mime: 'application/mxf',
  })
);
ins.add(
  Checker.of({
    exts: ['ogx'],
    mime: 'application/ogg',
  })
);
ins.add(
  Checker.of({
    exts: ['pdf'],
    mime: 'application/pdf',
  })
);
ins.add(
  Checker.of({
    exts: ['pgp'],
    mime: 'application/pgp-encrypted',
  })
);
ins.add(
  Checker.of({
    exts: ['ai'],
    mime: 'application/postscript',
  })
);
ins.add(
  Checker.of({
    exts: ['ps'],
    mime: 'application/postscript',
  })
);
ins.add(
  Checker.of({
    exts: ['rtf'],
    mime: 'application/rtf',
  })
);
ins.add(
  Checker.of({
    exts: ['apk'],
    mime: 'application/vnd.android.package-archive',
  })
);
ins.add(
  Checker.of({
    exts: ['drc'],
    mime: 'application/vnd.google.draco',
    synthetic: true,
  })
);
ins.add(
  Checker.of({
    exts: ['icc'],
    mime: 'application/vnd.iccprofile',
  })
);
ins.add(
  Checker.of({
    exts: ['asf'],
    mime: 'application/vnd.ms-asf',
  })
);
ins.add(
  Checker.of({
    exts: ['cab'],
    mime: 'application/vnd.ms-cab-compressed',
  })
);
ins.add(
  Checker.of({
    exts: ['xlsm'],
    mime: 'application/vnd.ms-excel.sheet.macroenabled.12',
  })
);
ins.add(
  Checker.of({
    exts: ['xltm'],
    mime: 'application/vnd.ms-excel.template.macroenabled.12',
  })
);
ins.add(
  Checker.of({
    exts: ['eot'],
    mime: 'application/vnd.ms-fontobject',
  })
);
ins.add(
  Checker.of({
    exts: ['chm'],
    mime: 'application/vnd.ms-htmlhelp',
  })
);
ins.add(
  Checker.of({
    exts: ['pst'],
    mime: 'application/vnd.ms-outlook',
  })
);
ins.add(
  Checker.of({
    exts: ['pptm'],
    mime: 'application/vnd.ms-powerpoint.presentation.macroenabled.12',
  })
);
ins.add(
  Checker.of({
    exts: ['ppsm'],
    mime: 'application/vnd.ms-powerpoint.slideshow.macroenabled.12',
  })
);
ins.add(
  Checker.of({
    exts: ['potm'],
    mime: 'application/vnd.ms-powerpoint.template.macroenabled.12',
  })
);
ins.add(
  Checker.of({
    exts: ['docm'],
    mime: 'application/vnd.ms-word.document.macroenabled.12',
  })
);
ins.add(
  Checker.of({
    exts: ['dotm'],
    mime: 'application/vnd.ms-word.template.macroenabled.12',
  })
);
ins.add(
  Checker.of({
    exts: ['otg'],
    mime: 'application/vnd.oasis.opendocument.graphics-template',
  })
);
ins.add(
  Checker.of({
    exts: ['odg'],
    mime: 'application/vnd.oasis.opendocument.graphics',
  })
);
ins.add(
  Checker.of({
    exts: ['otp'],
    mime: 'application/vnd.oasis.opendocument.presentation-template',
  })
);
ins.add(
  Checker.of({
    exts: ['odp'],
    mime: 'application/vnd.oasis.opendocument.presentation',
  })
);
ins.add(
  Checker.of({
    exts: ['ots'],
    mime: 'application/vnd.oasis.opendocument.spreadsheet-template',
  })
);
ins.add(
  Checker.of({
    exts: ['ods'],
    mime: 'application/vnd.oasis.opendocument.spreadsheet',
  })
);
ins.add(
  Checker.of({
    exts: ['ott'],
    mime: 'application/vnd.oasis.opendocument.text-template',
  })
);
ins.add(
  Checker.of({
    exts: ['odt'],
    mime: 'application/vnd.oasis.opendocument.text',
  })
);
ins.add(
  Checker.of({
    exts: ['pptx'],
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
);
ins.add(
  Checker.of({
    exts: ['ppsx'],
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  })
);
ins.add(
  Checker.of({
    exts: ['potx'],
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.template',
  })
);
ins.add(
  Checker.of({
    exts: ['xlsx'],
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
);
ins.add(
  Checker.of({
    exts: ['xltx'],
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  })
);
ins.add(
  Checker.of({
    exts: ['docx'],
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
);
ins.add(
  Checker.of({
    exts: ['dotx'],
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  })
);
ins.add(
  Checker.of({
    exts: ['rm'],
    mime: 'application/vnd.rn-realmedia',
  })
);
ins.add(
  Checker.of({
    exts: ['skp'],
    mime: 'application/vnd.sketchup.skp',
  })
);
ins.add(
  Checker.of({
    exts: ['pcap'],
    mime: 'application/vnd.tcpdump.pcap',
  })
);
ins.add(
  Checker.of({
    exts: ['vsdx'],
    mime: 'application/vnd.visio',
  })
);
ins.add(
  Checker.of({
    exts: ['wasm'],
    mime: 'application/wasm',
  })
);
ins.add(
  Checker.of({
    exts: ['7z'],
    mime: 'application/x-7z-compressed',
  })
);
ins.add(
  Checker.of({
    exts: ['ace'],
    mime: 'application/x-ace-compressed',
  })
);
ins.add(
  Checker.of({
    exts: ['arrow'],
    mime: 'application/x-apache-arrow',
  })
);
ins.add(
  Checker.of({
    exts: ['dmg'],
    mime: 'application/x-apple-diskimage',
  })
);
ins.add(
  Checker.of({
    exts: ['arj'],
    mime: 'application/x-arj',
  })
);
ins.add(
  Checker.of({
    exts: ['asar'],
    mime: 'application/x-asar',
  })
);
ins.add(
  Checker.of({
    exts: ['blend'],
    mime: 'application/x-blender',
  })
);
ins.add(
  Checker.of({
    exts: ['bz2'],
    mime: 'application/x-bzip2',
  })
);
ins.add(
  Checker.of({
    exts: ['cfb'],
    mime: 'application/x-cfb',
  })
);
ins.add(
  Checker.of({
    exts: ['Z'],
    mime: 'application/x-compress',
  })
);
ins.add(
  Checker.of({
    exts: ['cpio'],
    mime: 'application/x-cpio',
  })
);
ins.add(
  Checker.of({
    exts: ['deb'],
    mime: 'application/x-deb',
  })
);
ins.add(
  Checker.of({
    exts: ['elf'],
    mime: 'application/x-elf',
  })
);
ins.add(
  Checker.of({
    exts: ['shp'],
    mime: 'application/x-esri-shape',
  })
);
ins.add(
  Checker.of({
    exts: ['crx'],
    mime: 'application/x-google-chrome-extension',
  })
);
ins.add(
  Checker.of({
    exts: ['indd'],
    mime: 'application/x-indesign',
  })
);
ins.add(
  Checker.of({
    exts: ['lz4'],
    mime: 'application/x-lz4',
    synthetic: true,
  })
);
ins.add(
  Checker.of({
    exts: ['lzh'],
    mime: 'application/x-lzh-compressed',
  })
);
ins.add(
  Checker.of({
    exts: ['lz'],
    mime: 'application/x-lzip',
  })
);
ins.add(
  Checker.of({
    exts: ['macho'],
    mime: 'application/x-mach-binary',
  })
);
ins.add(
  Checker.of({
    exts: ['mie'],
    mime: 'application/x-mie',
  })
);
ins.add(
  Checker.of({
    exts: ['mobi'],
    mime: 'application/x-mobipocket-ebook',
  })
);
ins.add(
  Checker.of({
    exts: ['exe'],
    mime: 'application/x-msdownload',
  })
);
ins.add(
  Checker.of({
    exts: ['nes'],
    mime: 'application/x-nintendo-nes-rom',
  })
);
ins.add(
  Checker.of({
    exts: ['parquet'],
    mime: 'application/x-parquet',
  })
);
ins.add(
  Checker.of({
    exts: ['rar'],
    mime: 'application/x-rar-compressed',
  })
);
ins.add(
  Checker.of({
    exts: ['rpm'],
    mime: 'application/x-rpm',
  })
);
ins.add(
  Checker.of({
    exts: ['swf'],
    mime: 'application/x-shockwave-flash',
  })
);
ins.add(
  Checker.of({
    exts: ['sqlite'],
    mime: 'application/x-sqlite3',
  })
);
ins.add(
  Checker.of({
    exts: ['tar'],
    mime: 'application/x-tar',
  })
);
ins.add(
  Checker.of({
    exts: ['ar'],
    mime: 'application/x-unix-archive',
  })
);
ins.add(
  Checker.of({
    exts: ['xpi'],
    mime: 'application/x-xpinstall',
  })
);
ins.add(
  Checker.of({
    exts: ['xz'],
    mime: 'application/x-xz',
  })
);
ins.add(
  Checker.of({
    exts: ['alias'],
    mime: 'application/x.apple.alias',
    synthetic: true,
  })
);
ins.add(
  Checker.of({
    exts: ['fbx'],
    mime: 'application/x.autodesk.fbx',
    synthetic: true,
  })
);
ins.add(
  Checker.of({
    exts: ['lnk'],
    mime: 'application/x.ms.shortcut',
    synthetic: true,
  })
);
ins.add(
  Checker.of({
    exts: ['xml'],
    mime: 'application/xml',
  })
);
ins.add(
  Checker.of({
    exts: ['zip'],
    mime: 'application/zip',
  })
);
ins.add(
  Checker.of({
    exts: ['zst'],
    mime: 'application/zstd',
  })
);
ins.add(
  Checker.of({
    exts: ['aac'],
    mime: 'audio/aac',
  })
);
ins.add(
  Checker.of({
    exts: ['aif'],
    mime: 'audio/aiff',
  })
);
ins.add(
  Checker.of({
    exts: ['amr'],
    mime: 'audio/amr',
  })
);
ins.add(
  Checker.of({
    exts: ['ape'],
    mime: 'audio/ape',
  })
);
ins.add(
  Checker.of({
    exts: ['mid'],
    mime: 'audio/midi',
  })
);
ins.add(
  Checker.of({
    exts: ['f4a'],
    mime: 'audio/mp4',
  })
);
ins.add(
  Checker.of({
    exts: ['f4b'],
    mime: 'audio/mp4',
  })
);
ins.add(
  Checker.of({
    exts: ['m4b'],
    mime: 'audio/mp4',
  })
);
ins.add(
  Checker.of({
    exts: ['mp1'],
    mime: 'audio/mpeg',
  })
);
ins.add(
  Checker.of({
    exts: ['mp2'],
    mime: 'audio/mpeg',
  })
);
ins.add(
  Checker.of({
    exts: ['mp3'],
    mime: 'audio/mpeg',
  })
);
ins.add(
  Checker.of({
    exts: ['opus'],
    mime: 'audio/ogg',
    codecs: ['opus'],
  })
);
ins.add(
  Checker.of({
    exts: ['oga'],
    mime: 'audio/ogg',
  })
);
ins.add(
  Checker.of({
    exts: ['ogg'],
    mime: 'audio/ogg',
  })
);
ins.add(
  Checker.of({
    exts: ['spx'],
    mime: 'audio/ogg',
  })
);
ins.add(
  Checker.of({
    exts: ['qcp'],
    mime: 'audio/qcelp',
  })
);
ins.add(
  Checker.of({
    exts: ['ac3'],
    mime: 'audio/vnd.dolby.dd-raw',
  })
);
ins.add(
  Checker.of({
    exts: ['wav'],
    mime: 'audio/wav',
  })
);
ins.add(
  Checker.of({
    exts: ['wv'],
    mime: 'audio/wavpack',
  })
);
ins.add(
  Checker.of({
    exts: ['dsf'],
    mime: 'audio/x-dsf',
    synthetic: true,
  })
);
ins.add(
  Checker.of({
    exts: ['flac'],
    mime: 'audio/x-flac',
  })
);
ins.add(
  Checker.of({
    exts: ['it'],
    mime: 'audio/x-it',
  })
);
ins.add(
  Checker.of({
    exts: ['m4a'],
    mime: 'audio/x-m4a',
  })
);
ins.add(
  Checker.of({
    exts: ['asf'],
    mime: 'audio/x-ms-asf',
  })
);
ins.add(
  Checker.of({
    exts: ['mpc'],
    mime: 'audio/x-musepack',
  })
);
ins.add(
  Checker.of({
    exts: ['s3m'],
    mime: 'audio/x-s3m',
  })
);
ins.add(
  Checker.of({
    exts: ['voc'],
    mime: 'audio/x-voc',
  })
);
ins.add(
  Checker.of({
    exts: ['xm'],
    mime: 'audio/x-xm',
  })
);
ins.add(
  Checker.of({
    exts: ['ttc'],
    mime: 'font/collection',
  })
);
ins.add(
  Checker.of({
    exts: ['otf'],
    mime: 'font/otf',
  })
);
ins.add(
  Checker.of({
    exts: ['ttf'],
    mime: 'font/ttf',
  })
);
ins.add(
  Checker.of({
    exts: ['woff'],
    mime: 'font/woff',
  })
);
ins.add(
  Checker.of({
    exts: ['woff2'],
    mime: 'font/woff2',
  })
);
ins.add(
  Checker.of({
    exts: ['apng'],
    mime: 'image/apng',
  })
);
ins.add(
  Checker.of({
    exts: ['avif'],
    mime: 'image/avif',
  })
);
ins.add(
  Checker.of({
    exts: ['bmp'],
    mime: 'image/bmp',
  })
);
ins.add(
  Checker.of({
    exts: ['bpg'],
    mime: 'image/bpg',
  })
);
ins.add(
  Checker.of({
    exts: ['flif'],
    mime: 'image/flif',
  })
);
ins.add(
  Checker.of({
    exts: ['gif'],
    mime: 'image/gif',
  })
);
ins.add(
  Checker.of({
    exts: ['heic'],
    mime: 'image/heic-sequence',
  })
);
ins.add(
  Checker.of({
    exts: ['heic'],
    mime: 'image/heic',
  })
);
ins.add(
  Checker.of({
    exts: ['heic'],
    mime: 'image/heif-sequence',
  })
);
ins.add(
  Checker.of({
    exts: ['heic'],
    mime: 'image/heif',
  })
);
ins.add(
  Checker.of({
    exts: ['icns'],
    mime: 'image/icns',
  })
);
ins.add(
  Checker.of({
    exts: ['j2c'],
    mime: 'image/j2c',
  })
);
ins.add(
  Checker.of({
    exts: ['jls'],
    mime: 'image/jls',
  })
);
ins.add(
  Checker.of({
    exts: ['jp2'],
    mime: 'image/jp2',
  })
);
ins.add(
  Checker.of({
    exts: ['jpg'],
    mime: 'image/jpeg',
  })
);
ins.add(
  Checker.of({
    exts: ['jpm'],
    mime: 'image/jpm',
  })
);
ins.add(
  Checker.of({
    exts: ['jpx'],
    mime: 'image/jpx',
  })
);
ins.add(
  Checker.of({
    exts: ['jxl'],
    mime: 'image/jxl',
  })
);
ins.add(
  Checker.of({
    exts: ['ktx'],
    mime: 'image/ktx',
  })
);
ins.add(
  Checker.of({
    exts: ['mj2'],
    mime: 'image/mj2',
  })
);
ins.add(
  Checker.of({
    exts: ['png'],
    mime: 'image/png',
  })
);
ins.add(
  Checker.of({
    exts: ['tif'],
    mime: 'image/tiff',
  })
);
ins.add(
  Checker.of({
    exts: ['psd'],
    mime: 'image/vnd.adobe.photoshop',
  })
);
ins.add(
  Checker.of({
    exts: ['dwg'],
    mime: 'image/vnd.dwg',
  })
);
ins.add(
  Checker.of({
    exts: ['jxr'],
    mime: 'image/vnd.ms-photo',
  })
);
ins.add(
  Checker.of({
    exts: ['webp'],
    mime: 'image/webp',
  })
);
ins.add(
  Checker.of({
    exts: ['dng'],
    mime: 'image/x-adobe-dng',
  })
);
ins.add(
  Checker.of({
    exts: ['cr2'],
    mime: 'image/x-canon-cr2',
  })
);
ins.add(
  Checker.of({
    exts: ['cr3'],
    mime: 'image/x-canon-cr3',
  })
);
ins.add(
  Checker.of({
    exts: ['raf'],
    mime: 'image/x-fujifilm-raf',
  })
);
ins.add(
  Checker.of({
    exts: ['cur'],
    mime: 'image/x-icon',
  })
);
ins.add(
  Checker.of({
    exts: ['ico'],
    mime: 'image/x-icon',
  })
);
ins.add(
  Checker.of({
    exts: ['nef'],
    mime: 'image/x-nikon-nef',
  })
);
ins.add(
  Checker.of({
    exts: ['orf'],
    mime: 'image/x-olympus-orf',
  })
);
ins.add(
  Checker.of({
    exts: ['rw2'],
    mime: 'image/x-panasonic-rw2',
  })
);
ins.add(
  Checker.of({
    exts: ['arw'],
    mime: 'image/x-sony-arw',
  })
);
ins.add(
  Checker.of({
    exts: ['xcf'],
    mime: 'image/x-xcf',
  })
);
ins.add(
  Checker.of({
    exts: ['3mf'],
    mime: 'model/3mf',
  })
);
ins.add(
  Checker.of({
    exts: ['glb'],
    mime: 'model/gltf-binary',
  })
);
ins.add(
  Checker.of({
    exts: ['stl'],
    mime: 'model/stl',
  })
);
ins.add(
  Checker.of({
    exts: ['ics'],
    mime: 'text/calendar',
  })
);
ins.add(
  Checker.of({
    exts: ['vcf'],
    mime: 'text/vcard',
  })
);
ins.add(
  Checker.of({
    exts: ['vtt'],
    mime: 'text/vtt',
  })
);
ins.add(
  Checker.of({
    exts: ['3gp'],
    mime: 'video/3gpp',
  })
);
ins.add(
  Checker.of({
    exts: ['3g2'],
    mime: 'video/3gpp2',
  })
);
ins.add(
  Checker.of({
    exts: ['mpg', 'ps', 'mpeg'],
    mime: 'video/MP1S',
  })
);
ins.add(
  Checker.of({
    exts: ['mpg', 'm2p', 'vob', 'sub'],
    mime: 'video/MP2P',
  })
);
ins.add(
  Checker.of({
    exts: ['mts'],
    mime: 'video/mp2t',
  })
);
ins.add(
  Checker.of({
    exts: ['f4p'],
    mime: 'video/mp4',
  })
);
ins.add(
  Checker.of({
    exts: ['f4v'],
    mime: 'video/mp4',
  })
);
ins.add(
  Checker.of({
    exts: ['m4p'],
    mime: 'video/mp4',
  })
);
ins.add(
  Checker.of({
    exts: ['mp4'],
    mime: 'video/mp4',
  })
);
ins.add(
  Checker.of({
    exts: ['mpg'],
    mime: 'video/mpeg',
  })
);
ins.add(
  Checker.of({
    exts: ['ogm'],
    mime: 'video/ogg',
  })
);
ins.add(
  Checker.of({
    exts: ['ogv'],
    mime: 'video/ogg',
  })
);
ins.add(
  Checker.of({
    exts: ['mov'],
    mime: 'video/quicktime',
  })
);
ins.add(
  Checker.of({
    exts: ['avi'],
    mime: 'video/vnd.avi',
  })
);
ins.add(
  Checker.of({
    exts: ['webm'],
    mime: 'video/webm',
  })
);
ins.add(
  Checker.of({
    exts: ['flv'],
    mime: 'video/x-flv',
  })
);
ins.add(
  Checker.of({
    exts: ['m4v'],
    mime: 'video/x-m4v',
  })
);
ins.add(
  Checker.of({
    exts: ['mkv'],
    mime: 'video/x-matroska',
  })
);
ins.add(
  Checker.of({
    exts: ['asf'],
    mime: 'video/x-ms-asf',
  })
);
