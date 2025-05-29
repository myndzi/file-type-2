import { Checker, CheckResult } from '../../lib/checker.js';
import { StringEncoding } from '../../lib/encode/encode.js';
import { add, Integer, subToNumber } from '../../lib/integer.js';
import { StringPattern } from '../../lib/matcher/matcher.js';
import { matchBytes } from '../../lib/matcher/pattern.js';
import { Reader } from '../../lib/reader/reader.js';
import { NoMatch } from '../../lib/runner.js';
import { EndExclusive, StartInclusive, Struct } from '../../lib/struct.js';
import { Ext, Mime } from '../../types.js';

// const LFH_SIG = bytes(0x04, 0x03, 0x4b, 0x50);
// const enum LFH {
//   FIXED_SIZE = 30,
//   O_GP_BITS = 6,
//   O_COMPRESSION_METHOD = 8,
//   O_COMPRESSED_SIZE = 18,
//   O_UNCOMPRESSED_SIZE = 22,
//   O_FILENAME_LEN = 26,
//   O_EXTRA_LEN = 28,
// }
// const enum LFH_GP_BITS {
//   UTF8_FILENAME = 0x08,
// }

// const EOCD_SIG = bytes(0x06, 0x05, 0x4b, 0x50);
// const enum EOCD {
//   FIXED_SIZE = 22,
//   O_DISKNO = 4,
//   O_CD_FIRST_DISK = 6,
//   O_CD_NUM_RECORDS_THIS_DISK = 8,
//   O_CD_NUM_RECORDS_TOTAL = 10,
//   O_CD_SIZE = 12,
//   O_CD_OFFSET = 16,
//   O_CD_COMMENT_SIZE = 20,
// }

// const Z64_EOCD_SIG = bytes(0x06, 0x06, 0x4b, 0x50);
// const Z64_V1 = 45;
// const Z64_V2 = 62;
// const enum Z64_EOCD {
//   FIXED_SIZE = 58,
//   O_EOCD_SIZE = 4,
//   O_VER_MADEBY = 12,
//   O_VER_EXTRACT = 14,
//   O_VER_DISKNO = 18,
//   O_CD_FIRST_DISK = 22,
//   O_CD_NUM_RECORDS_THIS_DISK = 26,
//   O_CD_NUM_RECORDS_TOTAL = 34,
//   O_CD_SIZE = 42,
//   O_CD_OFFSET = 50,
//   // version 2
// }

// const Z64_EOCD_LOCATOR_SIG = bytes(0x07, 0x06, 0x4b, 0x50);
// const enum Z64_EOCD_LOCATOR {
//   FIXED_SIZE = 20,
//   O_CD_FIRST_DISK = 4,
//   O_CD_OFFSET = 8,
//   O_CD_NUM_DISKS = 16,
// }

// const EXTRA_FIXED_SIZE = 4;

const LFH_SIG = matchBytes(['PK', [0x03, 0x04]]);
const LFH = Struct.create()
  .assert('sig', LFH_SIG)
  // in the spec, "version needed to extract" is specified as a
  // two-byte value, but then the contents of that value are
  // basically treated as separate data anyway. unclear why.
  .field('versionNeeded', 'uint8') // 1-decimal fixed-precision value
  .skip(1) // attribute compatibility information
  .field('gpFlags', 'uint16le') // general purpose bit flags
  .field('compressionMethod', 'uint16le')
  .skip(2) // last mod file time
  .skip(2) // last mod file date
  .skip(4) // crc-32
  .field('compressedSize', 'uint32le')
  .field('uncompressedSize', 'uint32le')
  .set('filenamePos', 0)
  .field('filenameLen', 'uint16le')
  .set('filenameEncoding', 'cp437' as Extract<StringEncoding, 'cp437' | 'utf8'>)
  .field('extraLen', 'uint16le')
  .set('startOfData', 0)
  .build();

const enum GP_BITFLAGS {
  UTF8_FILENAME = 1 << 10, // bit 11
}

const enum EXTRA_FIELD_ID {
  ZIP64_EXTENDED = 0x0001,
  // is the byte order correct? it's written in appnote.txt literally
  // as 0x7075, but it's unclear if that should be interpreted as
  // a single hexadecimal value or as literal bytes in the file
  INFOZIP_UNICODE_PATH = 0x7075,
}

const EOCD_SIG = matchBytes(['PK', [0x05, 0x06]]);
const EOCD = Struct.create()
  .assert('sig', EOCD_SIG)
  .field('diskNo', 'uint16le')
  .field('cdFirstDisk', 'uint16le')
  .field('numRecordsThisDisk', 'uint16le')
  .field('numRecordsTotal', 'uint16le')
  .field('cdSize', 'uint32le')
  // offset from the start of content on disk #cdFirstDisk where the
  // first central directory entry resides
  .field('cdOffset', 'uint32le')
  .field('commentLen', 'uint16le')
  .build();

const Z64_EOCD_LOCATOR_SIG = matchBytes(['PK', [0x06, 0x07]]);
const Z64_EOCD_LOCATOR = Struct.create()
  .assert('sig', Z64_EOCD_LOCATOR_SIG)
  .field('cdFirstDisk', 'uint32le')
  .field('eocdAbsoluteOffset', 'uint64le')
  .field('numDisks', 'uint32le')
  .build();

const Z64_EOCD_SIG = matchBytes(['PK', [0x06, 0x06]]);
const Z64_EOCD_BASE = Struct.create()
  .assert('sig', Z64_EOCD_SIG)
  // the "size" field is the size of the WHOLE record excluding
  // the signature and the size field itself. fixed+variable-12
  .field('size', 'uint64le')
  .skip(2) // version made by
  .field('versionNeededToExtract', 'uint8') // 1-decimal fixed-precision value
  .skip(1) // attribute compatibility information
  .field('diskNo', 'uint32le')
  .field('cdFirstDisk', 'uint32le')
  .field('numRecordsThisDisk', 'uint64le')
  .field('numRecordsTotal', 'uint64le')
  .field('cdSize', 'uint64le')
  // offset from the start of content on disk #cdFirstDisk where the
  // first central directory entry resides
  .field('cdOffset', 'uint64le');

const Z64_EOCD_V1 = Z64_EOCD_BASE.field('extraLen', 'uint16le').build();

const Z64_EOCD_V2 = Z64_EOCD_BASE.skip(2) // method used to compress the central directory
  .skip(8) // compressed size
  .skip(8) // original size
  .skip(2) // encryption algorithm id
  .skip(2) // encryption key length
  .skip(2) // encryption flags
  .skip(2) // hash algorithm identifier
  .field('hashLen', 'uint16le') // length of hash data
  .build();

const EXTRA_FIELD = Struct.create()
  .field('id', 'uint16le')
  .field('dataSize', 'uint16le') // size of following data
  .build();

const INFO_ZIP_UNICODE_PATH = Struct.create()
  .field('version', 'uint8')
  .field('nameCrc32', 'uint32le')
  .build();

type Widen<T> = T extends Integer ? Integer : T;
type Intify<T, Ks extends keyof T> = { [K in keyof T]: K extends Ks ? Widen<T[K]> : T[K] } & {};

export interface ZipContext {
  /**
   * Version needed to extract - specifies which
   * features can be expected in order to process
   * the data
   */
  versionNeeded: number;

  /**
   * Zip64 header version
   * 0 = disabled (versionNeeded < 4.5)
   * 1 = v1 (versionNeeded < 6.2)
   * 2 = v2 (versionNeeded >= 6.2)
   */
  z64: 0 | 1 | 2;
}

type LocalFileHeader = Intify<
  (typeof LFH)['static'],
  'filenamePos' | 'compressedSize' | 'startOfData'
>;

export class ZipReader implements Checker {
  readonly name: string = 'Zip';
  readonly mime: Mime = 'application/zip' as Mime;
  readonly exts: Ext[] = ['zip'] as Ext[];

  readonly after: undefined;

  async readZip64UncompressedSize(
    reader: Reader,
    lfh: LocalFileHeader,
    xIdx: number,
    extra: (typeof EXTRA_FIELD)['static'],
  ) {
    const pPos = extra[EndExclusive];
    const pLen = subToNumber(pPos, extra[StartInclusive]);

    // the spec says that the order of the fields here is fixed, but
    // their presence is only at-need. uncompressed comes before compressed,
    // so in sane cases we expect the uncompressed size to always be the
    // second record. however, it's not _impossible_ that a compressed file
    // is larger than the uncompressed one, so we pass in the record index
    // of where we expect to find the data as a 0-indexed value. -1 means skip

    // the position relative to the record start position of the data we want
    const xpos = xIdx * 8;
    const readAt = add(pPos, xpos);

    // be sure that our read is within the stated extra field data size
    if (xpos + 8 >= pLen) {
      throw new Error(`Refusing out-of-bounds read on Zip64 compressed size @ ${readAt}`);
    }

    const u8 = reader.request(readAt, 8) ?? (await reader.demand(readAt, 8));
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    lfh.compressedSize = dv.getBigUint64(0, true);
  }

  async readInfoZipUnicodePath(
    reader: Reader,
    lfh: LocalFileHeader,
    extra: (typeof EXTRA_FIELD)['static'],
  ) {
    const pPos = extra[EndExclusive];
    const pLen = subToNumber(pPos, extra[StartInclusive]);

    // invalid data: there are at least 5 bytes of fixed header data before
    // the unicode filename
    if (pLen < 5) return;

    // read the header to get the version...
    const header =
      INFO_ZIP_UNICODE_PATH.request(reader, pPos) ??
      (await INFO_ZIP_UNICODE_PATH.demand(reader, pPos));

    // ignore data if we don't understand it...
    if (header.version !== 1) return;

    const fixedSize = INFO_ZIP_UNICODE_PATH.size;
    lfh.filenamePos = add(pPos, fixedSize);
    lfh.filenameLen = subToNumber(pPos, fixedSize);
  }

  async readExtra(
    reader: Reader,
    lfh: LocalFileHeader,
    read: { compressedSize: -1 | 0 | 1; infoZipUnicodePath: boolean },
  ) {
    let pos: Integer = add(lfh[EndExclusive], lfh.filenameLen);
    const firstByteAfterExtra = add(pos, lfh.extraLen);
    const lastValidReadableByte = add(firstByteAfterExtra, -EXTRA_FIELD.size);

    while (true) {
      // `demand` here may fail - let a failure bubble up
      const rec = EXTRA_FIELD.request(reader, pos) ?? (await EXTRA_FIELD.demand(reader, pos));

      switch (rec.id) {
        case EXTRA_FIELD_ID.ZIP64_EXTENDED:
          if (read.compressedSize > -1) {
            this.readZip64UncompressedSize(reader, lfh, read.compressedSize, rec);
          }
          break;
        case EXTRA_FIELD_ID.INFOZIP_UNICODE_PATH:
          if (read.infoZipUnicodePath) {
            this.readInfoZipUnicodePath(reader, lfh, rec);
          }
          break;
      }

      if (rec[EndExclusive] <= pos) {
        throw new Error('[BUG]: end of record is <= record start position');
      }

      pos = rec[EndExclusive];
      if (pos === firstByteAfterExtra) {
        // correctly-encoded records will be an exact match here; we're done
        return;
      }

      if (pos > lastValidReadableByte) {
        // technically-invalid extra field data, but seen in practice in e.g.
        // apk files that insert a blank file entry for byte alignment
        return;
        // throw new Error(`insufficient bytes remain at ${pos} to read another record`);
      }
    }
  }

  async readLFH(reader: Reader, pos: Integer): Promise<LocalFileHeader> {
    const header: LocalFileHeader = LFH.request(reader, pos) ?? (await LFH.demand(reader, pos));
    header.filenamePos = add(pos, LFH.size);

    const extraPos = add(header.filenamePos, header.filenameLen);
    header.startOfData = add(extraPos, header.extraLen);

    if ((header.gpFlags & GP_BITFLAGS.UTF8_FILENAME) > 0) {
      header.filenameEncoding = 'utf8';
    }

    const readZ64CompressedSize = header.versionNeeded >= 62 && header.compressedSize === 0xffff;
    const readInfoZipUnicodeFilename = header.filenameEncoding !== 'utf8';

    if (readZ64CompressedSize || readInfoZipUnicodeFilename) {
      await this.readExtra(reader, header, {
        compressedSize: !readZ64CompressedSize ? -1 : header.uncompressedSize === 0xffff ? 0 : 1,
        infoZipUnicodePath: readInfoZipUnicodeFilename,
      });
    }

    return header;
  }

  private consumers = new WeakMap<
    Reader,
    ((lfh: LocalFileHeader, filename: Uint8Array) => void)[]
  >();

  onFile(reader: Reader, cb: (lfh: LocalFileHeader, filename: Uint8Array) => void): () => void {
    const cbs = this.consumers.get(reader) ?? [];
    cbs.push(cb);
    this.consumers.set(reader, cbs);
    return () => {
      const consumers = (this.consumers.get(reader) ?? []).filter(v => v !== cb);
      this.consumers.set(reader, consumers);
    };
  }

  async findFile(reader: Reader, pat: StringPattern): Promise<LocalFileHeader | void> {
    const found = new Promise<LocalFileHeader>(resolve => {
      this.onFile(reader, (lfh: LocalFileHeader, filename: Uint8Array) => {
        if (!pat.asEncoding(lfh.filenameEncoding).match(filename)) return;
        resolve(lfh);
      });
    });

    const done = this.scanFiles(reader);
    return Promise.race([found, done]);
  }

  private scanners = new WeakMap<Reader, Promise<void>>();
  async scanFiles(reader: Reader): Promise<void> {
    const promise =
      this.scanners.get(reader) ??
      new Promise<void>(resolve => {
        setTimeout(async () => {
          await this._scanFiles(reader);
          // we don't delete scanners - we'll only ever have one per reader
          // this.scanners.delete(reader);
          resolve();
        }, 0);
      });
    this.scanners.set(reader, promise);
    return promise;
  }

  private async _scanFiles(reader: Reader): Promise<void> {
    // we only want to read from the source once, but we have dependents that want
    // different file data. we also need to ensure that the file data is available
    // when they receive the result, so that they can register their interest with
    // the underlying Reader.
    //
    // zip-derived formats, then, can register interest in a file with Zip.onFile()
    // and kick the process off with zip.scanFiles()
    //
    // it is important that derived formats register this interest synchronously
    // at the start of their check() function, or at least within the current
    // microtask queue, or they might "miss" files that we encounter
    let pos: Integer = 0;
    while (true) {
      // hold the reader at this position long enough to identify the
      // location of the filename to compare against
      const got = await reader.pin(
        pos,
        async (): Promise<[LocalFileHeader, Uint8Array] | undefined> => {
          let header: LocalFileHeader;
          try {
            header = await this.readLFH(reader, pos);
          } catch (e) {
            return;
          }
          const { filenamePos, filenameLen } = header;

          const filename =
            reader.request(filenamePos, filenameLen) ??
            (await reader.demand(filenamePos, filenameLen));

          return [header, filename];
        },
      );

      if (got === undefined) break;
      const [lfh, filename] = got;

      const consumers = this.consumers.get(reader) ?? [];
      for (const consumer of consumers) {
        try {
          consumer(lfh, filename);
        } catch (e) {
          console.warn('consumer threw', e);
        }
      }

      const endOfHeader = add(lfh[EndExclusive], lfh.filenameLen + lfh.extraLen);
      // todo: data descriptor (optional presence; optionally has a signature; optionally "in zip64 format")
      const startOfNextRecord = add(endOfHeader, lfh.compressedSize);
      if (startOfNextRecord <= pos) {
        throw new Error('[BUG]: next is <= current position');
      }
      pos = startOfNextRecord;
    }
    this.consumers.delete(reader);
  }

  // basic check to identify _whether_ this is a zip64 file.
  // other classes may inherit from this class to utilize the other functionality
  async check(reader: Reader, pos: Integer): Promise<CheckResult> {
    const bytes = reader.request(pos, 4) ?? (await reader.demand(pos, 4));
    if (!LFH_SIG.match(bytes) && !EOCD_SIG.match(bytes)) return NoMatch;

    // any checks that depend on this one will be looking at _contents_
    // of the zip file. therefore they will be starting at the beginning
    // of the file, and we end this check without specifying an offset
    // deeper into the data
    return { match: true, continueAt: 0 };
  }
}

export const zipSingleton = new ZipReader();
