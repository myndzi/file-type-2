import { add, Integer, mask } from './integer.js';
import { AnyPattern } from './matcher/matcher.js';
import type { Reader } from './reader/reader.js';

type StructReader<T> = [size: number, fn: (dv: DataView, pos: number) => T];
type StructWriter<T> = (dv: DataView, obj: Partial<T>, u8?: Uint8Array) => void;
type StructMatcher<T> = (u8: Uint8Array, obj: Partial<T>) => boolean;
type Simplify<T> = { [K in keyof T]: T[K] } & {};
type StructBuilder<T> = Pick<Struct<T>, 'assert' | 'field' | 'skip' | 'set' | 'build'>;
type StructImpl<T> = Omit<Struct<T>, 'assert' | 'field' | 'skip' | 'set' | 'build'>;

export const StartInclusive: unique symbol = Symbol('struct.StartInclusive');
export const EndExclusive: unique symbol = Symbol('struct.EndExclusive');
export type StructData<T> = T & {
  [StartInclusive]: Integer;
  [EndExclusive]: Integer;
};

type ReaderReturnType = Simplify<{
  [K in keyof typeof StructReaders]: ReturnType<(typeof StructReaders)[K][1]>;
}>;

const StructReaders = {
  uint8: [1, (dv: DataView, pos: number) => dv.getUint8(pos)],
  uint16le: [2, (dv: DataView, pos: number) => dv.getUint16(pos, true)],
  uint16be: [2, (dv: DataView, pos: number) => dv.getUint16(pos, false)],
  uint32le: [4, (dv: DataView, pos: number) => dv.getUint32(pos, true)],
  uint32be: [4, (dv: DataView, pos: number) => dv.getUint32(pos, false)],
  uint64le: [8, (dv: DataView, pos: number) => dv.getBigUint64(pos, true)],
  uint64be: [8, (dv: DataView, pos: number) => dv.getBigUint64(pos, false)],
} satisfies Record<string, StructReader<any>>;

export class Struct<T> {
  static!: StructData<T>; // type-only

  private constructor(
    readonly size: number,
    private assigns: StructWriter<T>[],
    private asserts: StructMatcher<T>[],
  ) {}

  static create(): StructBuilder<{}> {
    return new Struct(0, [], []);
  }

  skip(numBytes: number): StructBuilder<T> {
    return new Struct(this.size + numBytes, this.assigns, this.asserts);
  }

  assert<const K extends string>(
    key: Exclude<K, keyof T>,
    pat: AnyPattern,
  ): StructBuilder<Simplify<T & { [KK in K]: Uint8Array }>> {
    type Shape = { [KK in K]: Uint8Array };

    const offset = this.size;
    const assert = (u8: Uint8Array, obj: Partial<Shape>): boolean => {
      const sub = u8.subarray(offset, pat.byteLength);
      if (!pat.match(sub)) return false;
      obj[key] = sub;
      return true;
    };

    type Combined = T & Shape;

    return new Struct(this.size + pat.byteLength, this.assigns, [
      ...this.asserts,
      assert,
    ] as StructMatcher<Combined>[]);
  }

  // kinda hacky; it'd be more appropriate for us to explicitly pass something in
  // or use some kind of callback
  set<const K extends string, U>(
    key: Exclude<K, keyof T>,
    val: U,
  ): StructBuilder<Simplify<T & { [KK in K]: U }>> {
    type Shape = { [KK in K]: U };
    const assign: StructWriter<Shape> = (_, obj: Partial<Shape>) => {
      obj[key] = val;
    };

    type Combined = T & Shape;

    return new Struct(
      this.size,
      [...this.assigns, assign] as StructWriter<Combined>[],
      this.asserts,
    );
  }

  field<const K extends string, const RT extends keyof typeof StructReaders>(
    key: Exclude<K, keyof T>,
    type: RT,
    bitmask?: ReaderReturnType[RT],
  ): StructBuilder<Simplify<T & { [KK in K]: ReaderReturnType[RT] }>> {
    type RRT = ReaderReturnType[RT];
    const [size, read] = StructReaders[type] as StructReader<RRT>;
    type Shape = { [KK in K]: RRT };

    const pos = this.size;
    const assign: StructWriter<Shape> = (dv: DataView, obj: Partial<Shape>) => {
      const val = read(dv, pos);
      obj[key] = (bitmask !== undefined ? mask(val, bitmask) : val) as RRT;
    };

    type Combined = T & Shape;

    return new Struct(
      pos + size,
      [...this.assigns, assign] as StructWriter<Combined>[],
      this.asserts,
    );
  }

  private record(u8: Uint8Array, pos: Integer): StructData<T> {
    const obj: StructData<T> = {} as any;

    obj[StartInclusive] = pos;
    obj[EndExclusive] = add(pos, this.size);

    for (const assert of this.asserts) {
      if (!assert(u8, obj)) {
        throw new Error(`Struct assertion failed`);
      }
    }

    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    for (const assign of this.assigns) {
      assign(dv, obj);
    }

    return obj;
  }

  request(reader: Reader, pos: Integer): StructData<T> | undefined {
    const u8 = reader.request(pos, this.size);
    return u8 ? this.record(u8, pos) : undefined;
  }

  async demand(reader: Reader, pos: Integer): Promise<StructData<T>> {
    const u8 = await reader.demand(pos, this.size);
    return this.record(u8, pos);
  }

  build(): StructImpl<T> {
    return this;
  }
}
