const EOCD_SIGNATURE = [0x50, 0x4b, 0x05, 0x06];
const CD_SIGNATURE = [0x50, 0x4b, 0x01, 0x02];

// Byte Offset	Length (Bytes)	Field Name	                     Description
// 0            4               Signature                        Always 0x02014b50
// 4            2               Version Made By                  Version of ZIP creator
// 6            2               Version Needed to Extract        Minimum ZIP version to extract
// 8            2               General Purpose Bit Flag         Flags (e.g. encoding, encryption)
// 10           2               Compression Method               Compression algorithm (e.g. deflate)
// 12           2               Last Mod File Time               DOS time format
// 14           2               Last Mod File Date               DOS date format
// 16           4               CRC-32                           CRC-32 checksum of uncompressed data
// 20           4               Compressed Size                  Size of compressed data
// 24           4               Uncompressed Size                Size of original file
// 28           2               File Name Length (n)             Length of filename in bytes
// 30           2               Extra Field Length (m)           Length of extra field
// 32           2               File Comment Length (k)          Length of file comment
// 34           2               Disk Number Start                Disk number where file begins (usually 0)
// 36           2               Internal File Attributes         e.g. ASCII/binary flag
// 38           4               External File Attributes         Includes UNIX/DOS file permissions
// 42           4               Relative Offset of Local Header  Offset to file's local header
// 46           n               File Name                        UTF-8 or other based on flags
// 46 + n       m               Extra Field                      Usually optional metadata
// 46 + n + m   k               File Comment                     Optional human-readable comment

type Intish = number|bigint;
const sum = (...vs: Intish[]) => vs.reduce((acc, cur) => add(acc, cur));
const add = (a: Intish, b: Intish): Intish => 
  typeof a === "number"
    ? typeof b === "number"
      ? a + b
      : BigInt(a) + b
    : typeof b === "number"
    ? a + BigInt(b)
    : a + b;
const sub = (a: Intish, b: Intish): Intish => 
  typeof a === "number"
    ? typeof b === "number"
      ? a - b
      : BigInt(a) - b
    : typeof b === "number"
    ? a - BigInt(b)
    : a - b;

enum AccessMode {
  RANDOM,
  STREAMING,
}

type TypedArrays = {
  'Int8Array': Int8Array,
  'Uint8Array': Uint8Array,
  'Int16Array': Int16Array,
  'Uint16Array': Uint16Array,
  'Int32Array': Int32Array,
  'Uint32Array': Uint32Array,
  'BigInt64Array': BigInt64Array,
  'BigUint64Array': BigUint64Array,
  'DataView': DataView,
}

type CheckAssertion<T extends number=number> = {
  type: 'assertion',
  pos: Intish,
  data: Uint8Array & {byteLength: T},
  mask?: Uint8Array & {byteLength: T},
}
type CheckMatch = {
  type: 'match',
  arms: Uint8Array[],
  pos: Intish
}
type CheckDataRequest<T extends keyof TypedArrays=keyof TypedArrays> = {
  type: 'datarequest',
  dataType: T,
  pos: Intish,
  minBytes: Intish,
  maxBytes: Intish,
}
type CheckDataRequestGenerator<T extends keyof TypedArrays=keyof TypedArrays> = Generator<CheckDataRequest<T>, TypedArrays[T], TypedArrays[T]>;
type CheckDeferTo = {
  type: 'deferto',
  checkers: Checker[],
}
type CheckContinuation = {
  type: 'continuation',
  gen: CheckerChildFn,
}
type CheckFork = {
  type: 'fork',
  gen: CheckerProtocol,
}

const continueWith = (gen: CheckerChildFn): CheckContinuation => ({
  type: 'continuation',
  gen
});

const forkWith = (gen: CheckerProtocol): CheckFork => ({
  type: 'fork',
  gen
});

// TODO: we should be able to constant-ize both the generator and the request object?
const dataRequest = <T extends keyof TypedArrays>(type: T, pos: Intish, minBytes:Intish,maxBytes:Intish=minBytes): CheckDataRequestGenerator<T> =>
  (function*(): CheckDataRequestGenerator<T> {
    return yield {
      type: 'datarequest',
      dataType: type,
      pos,
      minBytes,
      maxBytes,
    };
  })();

const assertBytes = <T extends number>(pos: Intish, data: Uint8Array & {byteLength: T}, mask?: Uint8Array & {byteLength: T}): CheckAssertion<T> => ({
  type: 'assertion',
  pos,
  data,
  mask,
})

const matchBytes = (arms: Uint8Array[], pos: Intish=0): CheckMatch => ({
  type: 'match',
  arms,
  pos
});

const deferTo = (checkers: Checker|Checker[]): CheckDeferTo => ({
  type: 'deferto',
  checkers: Array.isArray(checkers) ? checkers : [checkers]
})


// checker protocol
/*
- we yield:
  - assertions
  - (potential) requests for data
  - one or more checks that will _replace_ us if they succeed
  - a generator that continues the work of the current check (recursion)?
- we receive values depending on the request we yielded:
  - assert() -> position or fail
  - request() -> view or undefined
  - demand() -> view or fail
  - match() -> value or fail
  - scan() -> position or fail
  - scanBackwards() -> position or fail
- we can "call into" some sub-functionality using
  the yield* keyword; this allows that sub-function
  to make its own data requests. when it returns, its
  return value will be 
*/

// when we yield a checker, add it to the queue
// when we yield an arraylike, continue the generator only if it matches
// when we yield a request, continue the generator with the result of the request
// ... question in my mind: should we leave it to the generator to stop itself?
// right now it's a bit unwieldy to request data, and there are a lot of cases
// where we _may_ want to continue whether or not a match happens
type YieldTypes = CheckAssertion|CheckMatch|CheckDataRequest|CheckDataRequestGenerator|CheckDeferTo|CheckContinuation|CheckFork;
type CheckerChildFn<T = any> = Generator<YieldTypes, T>;
type CheckerProtocol = Generator<
  YieldTypes|CheckerChildFn,
  boolean|void
>;
type CheckerFn<T extends [...unknown[]]> = (...args: T) => CheckerProtocol;

type Checker = {
  mime: string;
  exts: [string, ...string[]];
  check: CheckerFn<[meta: SourceMeta]>;
};

// all of these use a weird generator hack to give me proper typed "returns" in typescript
type DataRequest = {
  demand: {
    req: [pos: number, data: ArrayLike<number>];
    res: void;
  };
  dataview: {
    req: [pos: number, len: number];
    res: DataView;
  };
  oneof: {
    req: [pos: number, datas: ArrayLike<number>[]];
    res: number;
  };
  request: {
    req: [pos: number, data: ArrayLike<number>];
    res: boolean;
  };
  match: {
    req: [pos: number, datas: ArrayLike<number>[]];
    res: number;
  };
  deferTo: {
    req: [checkers: [Checker, ...Checker[]]];
    res: void;
  };
  scanBackwards: {
    req: [latest: number, earliest: number, data: ArrayLike<number>];
    res: number;
  }
};

type SourceRequest<T extends keyof DataRequest> = [type: T, ...DataRequest[T]['req']];
type SourceResponse = DataRequest[keyof DataRequest];

function createDataRequester<T extends keyof DataRequest>(type: T) {
  type Req = DataRequest[T]['req'];
  type Res = DataRequest[T]['res'];
  return function (...args: [...Req]): Generator<SourceRequest<T>, Res, Res> {
    return (function* () {
      return yield [type, ...args];
    })();
  };
}
// const assert = makeRequest('assert');
const getdv = createDataRequester('dataview');
const oneof = createDataRequester('oneof');
const demand = createDataRequester('demand');
const request = createDataRequester('request');
const match = createDataRequester('match');
const scanBackwards = createDataRequester('scanBackwards');

const zipBased = [];

const RANDOM_ACCESS = 1;
const STREAMING = 2;

// type StringEncoder = (str: string) => Uint8Array;
declare const asutf8: (str: string) => Uint8Array;
declare const cp437: (str: string) => Uint8Array;

type StringEncodeFn = (str: string) => Uint8Array;
declare const StringEncoders: {
  'utf-8': StringEncodeFn,
  'cp437': StringEncodeFn,
}
type StringEncoder = keyof typeof StringEncoders;

class FileNameMemo {
  private memo = new Map<StringEncoder, Uint8Array>();
  constructor(private filename: string) {}
  as(encoder: StringEncoder): Uint8Array {
    // this might be fairly useless... the strings are likely to be small, so
    // we don't get a "speed" gain, but we should get a garbage collection gain
    // by not constantly creating and destroying objects
    const encoded = this.memo.get(encoder) ?? StringEncoders[encoder](this.filename);
    this.memo.set(encoder, encoded);
    return encoded;
  }
}

const bytes = (...values: (string | number)[]): Uint8Array => {
  const u8s = [];
  // lol
  for (const val of values) {
    if (typeof val === 'number') {
      u8s.push(val);
      continue;
    }

    for (const chr of val) {
      u8s.push(val.charCodeAt(0));
    }
  }

  for (const u8 of u8s) {
    if (!Number.isInteger(u8) || u8 < 0 || u8 > 255) throw new Error('invalid value');
  }

  return new Uint8Array(u8s);
};

const dvMethods = {
  8: {
    signed: ['setInt8', 'getInt8'] as const,
    unsigned: ['setUint8', 'getUint8'] as const,
  },
  16: {
    signed: ['setInt16', 'getInt16'] as const,
    unsigned: ['setUint16', 'getUint16'] as const,
  },
  32: {
    signed: ['setInt32', 'getInt32'] as const,
    unsigned: ['setUint32', 'getUint32'] as const,
  },
  64: {
    signed: ['setBigInt64', 'getBigInt64'] as const,
    unsigned: ['setBigUint64', 'getBigUint64'] as const,
  },
};

const literal =
  (bitsize: 8 | 16 | 32 | 64, signedness: 'signed' | 'unsigned', littleEndian: boolean) =>
  (val: Intish): Uint8Array => {
    const ab = new ArrayBuffer(bitsize / 8);
    const dv = new DataView(ab);

    if (bitsize === 64) {
      const big = BigInt(val);
      const [set, get] = dvMethods[bitsize][signedness];
      dv[set](0, big, littleEndian);

      if (dv[get](0, littleEndian) !== big) {
        throw new Error(`invalid value=${val} for ${signedness} ${bitsize} bit data`);
      }
    } else {
      const smol = Number(val);
      const [set, get] = dvMethods[bitsize][signedness];
      dv[set](0, smol, littleEndian);

      if (dv[get](0, littleEndian) !== smol) {
        throw new Error(`invalid value=${val} for ${signedness} ${bitsize} bit data`);
      }
    }

    return new Uint8Array(ab);
  };

const uint16le = literal(16, 'unsigned', true);

const checkJar = {
  mime: 'application/java-archive',
  exts: ['jar'],
  filename: new FileNameMemo('META-INF/MANIFEST.MF'),
  *check(): CheckerProtocol {},
} satisfies ZipDerived;

type ZipDerived = Checker & { filename: FileNameMemo };
const zipTypes: ZipDerived[] = [checkJar];


const LFH_SIG = bytes(0x04, 0x03, 0x4b, 0x50);
const enum LFH {
  FIXED_SIZE = 30,
  O_GP_BITS = 6,
  O_COMPRESSION_METHOD = 8,
  O_COMPRESSED_SIZE = 18,
  O_UNCOMPRESSED_SIZE = 22,
  O_FILENAME_LEN = 26,
  O_EXTRA_LEN = 28,
}
const enum LFH_GP_BITS {
  UTF8_FILENAME = 0x08,
}

const EOCD_SIG = bytes(0x06, 0x05, 0x4b, 0x50);
const enum EOCD {
  FIXED_SIZE = 22,
  O_DISKNO = 4,
  O_CD_FIRST_DISK = 6,
  O_CD_NUM_RECORDS_THIS_DISK = 8,
  O_CD_NUM_RECORDS_TOTAL = 10,
  O_CD_SIZE = 12,
  O_CD_OFFSET = 16,
  O_CD_COMMENT_SIZE = 20,
}

const Z64_EOCD_SIG = bytes(0x06, 0x06, 0x4b, 0x50);
const Z64_V1 = 45;
const Z64_V2 = 62;
const enum Z64_EOCD {
  FIXED_SIZE = 58,
  O_EOCD_SIZE = 4,
  O_VER_MADEBY = 12,
  O_VER_EXTRACT = 14,
  O_VER_DISKNO = 18,
  O_CD_FIRST_DISK = 22,
  O_CD_NUM_RECORDS_THIS_DISK = 26,
  O_CD_NUM_RECORDS_TOTAL = 34,
  O_CD_SIZE = 42,
  O_CD_OFFSET = 50,
  // version 2
}

const Z64_EOCD_LOCATOR_SIG = bytes(0x07, 0x06, 0x4b, 0x50);
const enum Z64_EOCD_LOCATOR {
  FIXED_SIZE = 20,
  O_CD_FIRST_DISK = 4,
  O_CD_OFFSET = 8,
  O_CD_NUM_DISKS = 16,
}

const EXTRA_FIXED_SIZE = 4;

type SourceMeta = {
  accessMode: number,
  fileSize: Intish,
};

const checkZipRandomAccess = {
  mime: 'application/zip',
  exts: ['zip'],
  *check(meta: SourceMeta): CheckerProtocol {
    // TODO: handle encrypted central directory detection stuff?

    // if this returns, we definitely have a zip file
    let headerType = yield matchBytes([
      bytes('PK', 0x01, 0x02), // 0: CDFH: central directory header
      bytes('PK', 0x03, 0x04), // 1: LFH: local file header
      bytes('PK', 0x05, 0x06), // 2: EOCD: end of central directory
    ]);

    // we hit something other than the local file header; there are
    // no files but it looks like a zip file
    if (headerType !== 1) return true;
    
    // some more-specific file types are packaged in a zip file;
    // read the zip file to see if we have one of those
    if (meta.accessMode === STREAMING) {
      // read forward through the LFH entries
      yield forkWith(this.scanFiles(0));
    } else {
      yield forkWith(this.findCDFH(meta.fileSize))
    }

    return true;
  },

  *readZip64CompressedSize(
    pos: Intish,
    len: Intish,
    meta: { cpSize: Intish },
    update: { sizeRecord: number },
  ): CheckerChildFn<void> {
    const zip64extra = yield* getdv(pos, len);
    meta.cpSize = zip64extra.getBigUint64(update.sizeRecord, true);
  },

  *readInfoZipUnicodeFilename(
    pos: Intish,
    len: Intish,
    meta: { pos: Intish; len: Intish; encoding: string },
  ): CheckerChildFn<void> {
    const infozipExtra = yield* dataRequest('DataView', pos, 1 + 4);
    const ver = infozipExtra.getUint8(0);

    // there's a CRC here to ensure this meta is still valid
    // for the file header it was originally created from,
    // but we're going to ignore it because that's a lot of
    // work and we _probably_ will be getting native utf-8
    // anyway from the general purpose bit flag

    if (ver === 1) {
      meta.encoding = 'utf-8';
      meta.pos = add(pos, 5);
      meta.len = len;
    }
  },

  zipExtra(pos: Intish, len: Intish) {
    
  },
  
  *readZipExtra(
    pos: Intish,
    len: Intish,
    meta: { pos: Intish; len: Intish; encoding: string; cpSize: Intish },
    update: { sizeRecord: number; filename: boolean },
  ): CheckerChildFn<void> {
    for (let read = 0; read < len;) {
      const extra = yield* dataRequest('DataView', pos, 2, len);
      read += extra.byteLength;





    } while (extra)
    if (len < EXTRA_FIXED_SIZE) return;

    const matched = yield matchBytes([
      bytes(0x00, 0x01), // zip64 extension
      bytes(0x70, 0x75), // info-zip unicode filename
    ], pos);
    const recordLength = (yield* dataRequest('DataView', add(pos, 2), 2)).getUint16(0, true);

    if (matched === 0 && update.sizeRecord >= 0) {
      yield continueWith(this.readZip64CompressedSize(add(pos, 4), add(recordLength, -4), meta, update));
    } else if (matched === 1 && update.filename) {
      yield continueWith(this.readInfoZipUnicodeFilename(add(pos, 4), add(pos, - 4), meta));
    }

    yield* this.readZipExtra(sub(pos, recordLength), sub(len, recordLength), meta, update);
  },

  *readLFH(lfhPos: Intish) {
    const dv = yield* dataRequest('DataView', lfhPos, LFH.FIXED_SIZE);
    const unicodeBitSet = dv.getUint16(LFH.O_GP_BITS, true) & LFH_GP_BITS.UTF8_FILENAME;
    const cpSize = dv.getUint32(LFH.O_COMPRESSED_SIZE);
    const filenameLen = dv.getUint16(LFH.O_FILENAME_LEN, true);
    const cpMethod = dv.getUint16(LFH.O_COMPRESSION_METHOD, true); // used _if_ we need to decompress
    const extraLen = dv.getUint16(LFH.O_EXTRA_LEN, true);

    const meta: {
      pos: Intish;
      len: Intish;
      encoding: StringEncoder;
      cpSize: Intish;
      next: Intish;
    } = {
      // filename info
      pos: LFH.FIXED_SIZE,
      len: filenameLen,
      encoding: unicodeBitSet ? 'utf-8' : 'cp437',

      // compressed size
      cpSize,

      // placeholder
      next: sum(lfhPos, filenameLen, extraLen, cpSize),
    };

    if (!unicodeBitSet || cpSize === 0xffffffff) {
      // we have a non-unicode filename, OR we have a max-size file
      // in either case, the extra data may improve the situation so
      // we should read it. otherwise we can ignore it.

      yield* this.readZipExtra(sum(lfhPos, LFH.FIXED_SIZE, meta.len), extraLen, meta, {
        sizeRecord: meta.cpSize === 0xffffffff ? 0 : -1,
        filename: !unicodeBitSet,
      });
    }

    meta.next = sum(lfhPos, filenameLen, extraLen, meta.cpSize);

    return meta;
  },

  // minimum version to extract >= 4.5 - File uses ZIP64 format extensions
  *scanFiles(pos: Intish): CheckerProtocol {
    while (true) {
      // this will never return control to us if we've exceeded the end of the file
      const header = yield* dataRequest('DataView', pos, LFH.FIXED_SIZE);
      const meta = yield* this.readLFH(header, pos);

      // NOTE: it is possible that the filename stored in the zip file is encoded differently
      // than the way we have encoded it for comparison -- for example, different unicode
      // normalization forms exist, or even erroneous (wasteful) encodings are possible.
      // however, since we're seeking _file_ names that are generally just ascii text and
      // are defined by various file formats, we'll assume / expect that they are sane
      // and not attempt to read, decode, normalize, etc.
      const candidates = zipTypes.filter((cand) => cand.filename.as(meta.encoding).length === meta.len);

      yield deferTo(candidates);

      // if there's another header, we'll continue; otherwise
      // we won't be called back
      pos = yield bytes('PK', 0x03, 0x04);
    }
  },

  zip64Records<T extends Record<string, any>>(meta: T, sizes: Record<keyof T, number>): (keyof T)[] {
    return Object.entries(meta).filter(([key, value]) => value === sizes[key]).map(([key]) => key);
  },

  *readEOCD(pos: number) {
    const dv = yield* getdv(pos, EOCD.FIXED_SIZE);
    const meta = {
      disk: dv.getUint16(EOCD.O_DISKNO, true),
      cdFirstDisk: dv.getUint16(EOCD.O_CD_FIRST_DISK, true),
      numRecordsThisDisk: dv.getUint16(EOCD.O_CD_NUM_RECORDS_THIS_DISK, true),
      numRecordsTotal: dv.getUint16(EOCD.O_CD_NUM_RECORDS_TOTAL, true),
      cdSize: dv.getUint32(EOCD.O_CD_SIZE, true),
      cdOffset: dv.getUint32(EOCD.O_CD_OFFSET, true),
    };
    const big = this.zip64Records(meta, {
      disk: 0xFFFF,
      cdFirstDisk: 0xFFFF,
      numRecordsThisDisk: 0xFFFF,
      numRecordsTotal: 0xFFFF,
      cdSize: 0xFFFFFFFF,
      cdOffset: 0xFFFFFFFF,
    });
    if (big.length > 0) {
      yield* this.readZip64EOCD(pos-);


    }


  },

  *findCDFH(fileSize: Intish): CheckerProtocol {
    let loc = fileSize - EOCD.FIXED_SIZE;
    const minPossible = loc - 0xFFFF;

    while (loc > minPossible) {
      const found = yield* scanBackwards(loc, minPossible, bytes('PK', 0x05, 0x06));
      const meta = yield* this.readEOCD(found);

      // if we successfully parsed the EOCD, attempt to use it to locate
      // and scan over the CDFH
      if (meta) {
        // if the checker given to replaceWith completes successfully,
        // no further code in this function is run. if not, we'll continue
        yield* replaceWith(this.scanCDFH(meta.pos));
      }

      // ensure we always progress backwards
      if (found >= loc) return  false;

      // we've found _a_ match, so the next match can't overlap this one
      // move backwards by 4 bytes
      loc = found - 4;
    }
  },

  *checkRandomAccess(pos: number): CheckerProtocol {
    yield expectu8(pos, ['P', 'K', 0x03, 0x04]);

    // for (const hdr of yield* readDirEntry(cdPos)) {

    // if this file is a zip file, i want to push into consideration
    // a set of more-specific file types to be matched.

    // i want the zip handler to be responsible for determining what
    // data to check and what format the checker should expect

    // so i need, here, to either read the EOCD (random access)
    // or begin a skip-forward scan (streaming)

    // when a filename is known, i push a checker based on
    // that filename which takes over at the known position

    // that checker will need to know what kind of data it is dealing
    // with, in case it needs to decompress the data, so i have to
    // give it some amount of information read from the entry header
    // when instantiating it, as well as the position its data begins at

    return true;
  },
};

const checkZipStreaming = {
  mime: 'application/zip',
  exts: ['zip'],
  when: STREAMING,
  *check(pos: number) {
    yield demand(pos, bytes('P', 'K', 0x03, 0x04));
    // for (const hdr of yield* readDirEntry(cdPos)) {

    // if this file is a zip file, i want to push into consideration
    // a set of more-specific file types to be matched.

    // i want the zip handler to be responsible for determining what
    // data to check and what format the checker should expect

    // so i need, here, to either read the EOCD (random access)
    // or begin a skip-forward scan (streaming)

    // when a filename is known, i push a checker based on
    // that filename which takes over at the known position

    // that checker will need to know what kind of data it is dealing
    // with, in case it needs to decompress the data, so i have to
    // give it some amount of information read from the entry header
    // when instantiating it, as well as the position its data begins at
  },
};


