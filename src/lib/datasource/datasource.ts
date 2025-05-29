import { Ext, Mime } from '../../types.js';
import { ContentEncoding } from '../encode/encode.js';
import { Integer } from '../integer.js';

export interface DataSource {
  ext?: Ext;
  mime?: Mime;
  encoding?: ContentEncoding;
  readInto(buf: Uint8Array, offset: number, atMost: number, position: Integer): Promise<number>;
}

export { ByteSource } from './bytesource.js';
export { FileSource } from './filesource.js';
