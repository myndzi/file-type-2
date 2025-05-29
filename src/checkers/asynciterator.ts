export default 0;

const bytesMatch = (
  expected: ArrayLike<number>,
  actual: Uint8Array,
  offset: number = 0,
): boolean => {
  if (expected.length + offset > actual.byteLength) return false;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== actual[i + offset]) return false;
  }
  return true;
};

type Intish = number | bigint;

const add = (a: Intish, b: Intish): Intish =>
  typeof a === 'number'
    ? typeof b === 'number'
      ? a + b
      : BigInt(a) + b
    : typeof b === 'number'
      ? a + BigInt(b)
      : a + b;
const LFH_SIG = 0x04034b50;
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
type ZIP_LFH = {
  versionNeeded: number;
  bitFlags: number;
  compressionMethod: number;
  compressedSize: number | bigint;
  filenamePos: number;
  filenameLen: number;
  extraLen: number;
};

type Source = {
  attempt(pos: Intish, len: Intish): Uint8Array | undefined;
  require(pos: Intish, len: Intish): Promise<Uint8Array>;
  pin(pos: Intish, ref: any): void;
  unpin(ref: any): void;
};

type ReadTypes = {
  uint16le: number;
};
type Compatible<T> = Extract<{ [K in keyof ReadTypes]: [K, ReadTypes[K]] }, [PropertyKey, T]>[0];

type DataRequest = {
  obj: any;
  key: PropertyKey;
  method: keyof DataView & `get${string}`;
  offset: number;
  littleEndian: boolean;
};

class DataReader {
  private maxAssertLen: number = 0;
  private asserts: [offset: number, bytes: ArrayLike<number>][] = [];

  private reqMin: number = 0;
  private reqMax: number = 0;
  private reqs: DataRequest[] = [];

  protected pos: number = 0;
  protected off: number = 0;
  private len: number = 0;

  constructor(private source: Source) {}

  assert(bytes: ArrayLike<number>, offset: number = 0): this {
    this.maxAssertLen = Math.max(this.maxAssertLen, offset + bytes.length);
    this.asserts.push([this.pos + this.off, bytes]);

    return this;
  }

  private assertSync(): boolean | undefined {
    const u8a = this.source.attempt(this.pos, this.maxAssertLen);
    if (u8a === undefined) return undefined;

    return this.testAsserts(u8a);
  }

  private async assertAsync(): Promise<boolean> {
    // this promise might never fulfill. do not keep references to it
    const u8a = await this.source.require(this.pos, this.maxAssertLen);
    return this.testAsserts(u8a);
  }

  private testAsserts(u8a: Uint8Array): boolean {
    let ok = true;
    for (const [offset, bytes] of this.asserts) {
      ok &&= bytesMatch(bytes, u8a, offset);
      if (!ok) break;
    }
    this.asserts.length = 0;
    this.maxAssertLen = 0;

    return ok;
  }

  uint8<T, K extends keyof T>(obj: T, key: K): this {
    this.reqs.push({
      obj,
      key,
      method: 'getUint8',
      littleEndian: true,
      offset: this.off,
    });
    this.off += 2;
    this.len += 2;
    return this;
  }

  uint16le<T, K extends keyof T>(obj: T, key: K): this {
    this.reqs.push({
      obj,
      key,
      method: 'getUint16',
      littleEndian: true,
      offset: this.off,
    });
    this.off += 2;
    this.len += 2;
    return this;
  }

  uint32le<T, K extends keyof T>(obj: T, key: K): this {
    this.reqs.push({
      obj,
      key,
      method: 'getUint32',
      littleEndian: true,
      offset: this.off,
    });
    this.off += 4;
    this.len += 4;
    return this;
  }

  biguint64le<T, K extends keyof T>(obj: T, key: K): this {
    this.reqs.push({
      obj,
      key,
      method: 'getBigUint64',
      littleEndian: true,
      offset: this.off,
    });
    this.off += 8;
    this.len += 8;
    return this;
  }

  read(): boolean {
    if (this.assertSync() === undefined) return false;

    const u8a = this.source.attempt(this.pos, this.len);
    if (!u8a) return false;

    this.continue(u8a);
    return true;
  }

  private continue(u8a: Uint8Array): void {
    const dv = new DataView(u8a.buffer, u8a.byteOffset, u8a.byteLength);
    for (let i = 0; i < this.reqs.length; i++) {
      const req = this.reqs[i];
      req.obj[req.key] = dv[req.method](req.offset, req.littleEndian);
    }
    this.reqs.length = 0;
    this.pos += this.off;
    this.off = 0;
  }

  async wait(): Promise<void> {
    // important: store no references to these promises, or else
    // we run the risk of memory leaks. we expect this promise
    // to never throw and possibly never resolve
    const ok = await this.assertAsync();
    // push assertions to the source, or else create some kind
    // of deregister
    if (!ok) return new Promise<void>(() => {});

    const u8a = await this.source.require(this.pos, this.len);
    this.continue(u8a);
  }

  skip(numBytes: number): this {
    this.off += numBytes;
    return this;
  }

  advanceTo(pos: number): this {
    pos -= this.pos;
    if (pos < this.off) {
      throw new Error('offset cannot move backwards');
    }
    this.off = pos;
    return this;
  }

  get absolute(): number {
    return this.pos + this.off;
  }

  get relative(): number {
    return this.off;
  }

  isBefore(pos: number) {
    return pos < this.pos;
  }
}

interface ZipFileLFH {
  readonly versionNeeded: number;
  readonly bitFlags: number;
  readonly compressionMethod: number;
  readonly compressedSize: number;
  readonly filenamePos: number;
  readonly filenameLen: number;
  readonly extraLen: number;
}
class ZipFileLFHReader {
  versionNeeded: number = 0;
  bitFlags: number = 0;
  compressionMethod: number = 0;
  compressedSize: number = 0;
  filenamePos: number = 30;
  filenameLen: number = 0;
  extraLen: number = 0;

  tagId: number = 0;
  tagLen: number = 0;
  infozipExtraVersion: number = 0;

  constructor(private data: DataReader) {}

  readAt(pos: number) {
    this.data.advanceTo(pos);

    this.data
      .assert([0x04, 0x03, 0x4b, 0x50])
      .uint16le(this, 'versionNeeded')
      .uint16le(this, 'bitFlags')
      .uint16le(this, 'compressionMethod')
      .skip(8)
      .uint16le(this, 'compressedSize')
      .skip(4)
      .uint16le(this, 'filenameLen')
      .uint16le(this, 'extraLen');
  }

  private readExtraAt(pos: number, sizeRecord: number, readFilename: boolean): boolean {
    const data = this.data;

    let here = this.data.absolute;
    const end = here + this.extraLen;

    while (here < end) {
      data.advanceTo(here).uint16le(this, 'tagId').uint16le(this, 'tagLen');

      data.read() || (await data.wait());

      if (extra.tag === 0x0100 && sizeRecord >= 0) {
        data.skip(sizeRecord * 8).biguint64le(header, 'compressedSize');
      } else if (extra.tag === 0x7570 && readFilename) {
        data.uint8(extra, 'infozipVersion');
      }

      data.read() || (await data.wait());

      if (extra.infozipVersion === 1) {
        header.filenamePos = data.absolute + 4;
        header.filenameLen = extra.len - 9;
        extra.infozipVersion = 0;
      }

      here += extra.len;
      data.advanceTo(here);
    }
  }

  read(): boolean {
    if (!this.data.read()) return false;
    if (this.extraLen) return this.readExtra();
    return true;
  }

  //   data.read() || await data.wait();

  // }
}

async function readExtra(
  data: DataReader,
  header: ZIP_LFH,
  sizeRecord: number,
  readFilename: boolean,
) {
  const extra: {
    tag: number;
    len: number;
    infozipVersion: number;
  } = {
    tag: 0,
    len: 0,
    infozipVersion: 0,
  };

  let here = data.absolute;
  const end = here + header.extraLen;

  while (here < end) {
    data.uint16le(extra, 'tag').uint16le(extra, 'len');

    data.read() || (await data.wait());

    if (extra.tag === 0x0100 && sizeRecord >= 0) {
      data.skip(sizeRecord * 8).biguint64le(header, 'compressedSize');
    } else if (extra.tag === 0x7570 && readFilename) {
      data.uint8(extra, 'infozipVersion');
    }

    data.read() || (await data.wait());

    if (extra.infozipVersion === 1) {
      header.filenamePos = data.absolute + 4;
      header.filenameLen = extra.len - 9;
      extra.infozipVersion = 0;
    }

    here += extra.len;
    data.advanceTo(here);
  }
}

async function readlfh(data: DataReader) {
  const header: ZIP_LFH = {
    versionNeeded: 0,
    bitFlags: 0,
    compressionMethod: 0,
    compressedSize: 0,
    filenamePos: 30,
    filenameLen: 0,
    extraLen: 0,
  };

  data
    .assert([0x04, 0x03, 0x4b, 0x50])
    .uint16le(header, 'versionNeeded')
    .uint16le(header, 'bitFlags')
    .uint16le(header, 'compressionMethod')
    .skip(8)
    .uint16le(header, 'compressedSize')
    .skip(4)
    .uint16le(header, 'filenameLen')
    .uint16le(header, 'extraLen');

  data.read() || (await data.wait());

  if (header.extraLen) {
    await readExtra(
      data,
      header,
      header.compressedSize === 0xffffffff ? 0 : -1,
      (header.bitFlags & LFH_GP_BITS.UTF8_FILENAME) > 0,
    );
  }

  return header;
}
