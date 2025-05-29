import { CheckResult, PartialChecker } from '../lib/checker.js';
import { add, Integer } from '../lib/integer.js';
import { matchString } from '../lib/matcher/pattern.js';
import { Reader } from '../lib/reader/reader.js';
import { NoMatch } from '../lib/runner.js';
import { Struct } from '../lib/struct.js';

const decodeSizeHeader = (val: number): number => {
  return (
    (val & 0x0000007f) |
    ((val & 0x00007f00) >>> 1) |
    ((val & 0x007f0000) >>> 2) |
    ((val & 0x7f000000) >>> 3)
  );
};

const MAGIC = matchString('ID3', { encoding: 'cp1252' });
const HEADER = Struct.create()
  .field('major', 'uint8')
  .field('minor', 'uint8')
  // todo: assert masks
  .field('flags', 'uint8')
  .field('size', 'uint32be')
  .build();

class ID3v2_3_Impl implements PartialChecker {
  readonly name: string = 'ID3';
  readonly after: undefined;

  async check(reader: Reader, pos: Integer): Promise<CheckResult> {
    const headerBytes = reader.request(pos, 10) ?? (await reader.demand(pos, 10));
    if (!MAGIC.match(headerBytes.subarray(0, 3))) return NoMatch;

    const header = HEADER.request(reader, 3);

    if (!header) return NoMatch;

    // validate header: https://id3.org/id3v2.3.0#ID3v2_header
    if (
      (header.flags & 0b00011111) > 0 ||
      header.major > 0x7f ||
      header.minor > 0x7f ||
      (header.size & 0x80808080) > 0
    ) {
      return NoMatch;
    }

    const metaSize = decodeSizeHeader(header.size);
    return {
      match: true,
      continueAt: add(pos, 10 + metaSize),
    };
  }
}

export const ID3v2_3 = new ID3v2_3_Impl();
