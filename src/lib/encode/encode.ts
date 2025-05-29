import { encodeByteable, type Byteable } from './bytes.js';
import { encodeString } from './string.js';

export type StringEncoding = 'cp437' | 'cp1252' | 'utf8' | 'utf16le' | 'utf16be';
export type ByteEncoding = 'binary';
export type ContentEncoding = ByteEncoding | StringEncoding;
export type Encoded<T extends ContentEncoding> = number[] & { readonly encoding: T };

export namespace Encode {
  export const bytes = (data: Byteable, encoding: StringEncoding = 'cp1252'): Encoded<'binary'> =>
    encodeByteable(data, encoding);

  export const string = <const T extends StringEncoding = 'cp1252'>(
    str: string,
    encoding: T = 'cp1252' as T,
  ): Encoded<T> => encodeString(str, encoding);
}
