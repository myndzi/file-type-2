import type { Byteable } from '../encode/bytes.js';
import type { ByteEncoding, ContentEncoding, StringEncoding } from '../encode/encode.js';

export const enum NullTermination {
  REFUSE = 0,
  ALLOW = 1,
  REQUIRE = 2,
}

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type ByteOptions = {
  mask?: Byteable;
};
export type StringOptions = {
  encoding: StringEncoding;
  pad?: {
    to: number;
    with: string;
    nullTermination?: NullTermination;
  };
};

export type ByteMatcher = (actual: Uint8Array) => boolean;

export type AnyPattern<T extends ContentEncoding = ContentEncoding> = {
  encoding: T;
  byteLength: number;
  match: ByteMatcher;
};

export type BytePattern<T extends ByteEncoding = ByteEncoding> = {
  encoding: T;
} & AnyPattern<T>;

export type StringPattern<T extends StringEncoding = StringEncoding> = {
  encoding: T;
} & AnyPattern<T> & {
    asEncoding<U extends StringEncoding>(encoding: U): Pattern<U>;
  };

export type Pattern<T extends ContentEncoding> = Simplify<
  AnyPattern<T> &
    (T extends ByteEncoding ? BytePattern<T> : {}) &
    (T extends StringEncoding ? StringPattern<T> : {})
>;
