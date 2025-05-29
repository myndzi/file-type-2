import { encodeByteable } from './bytes.js';
import { Encode } from './encode.js';
import { encodeString } from './string.js';

describe('encode', () => {
  it('exports convenience methods', () => {
    expect(Encode.bytes('foo')).toMatchObject(encodeByteable('foo', 'cp1252'));
    expect(Encode.string('foo')).toMatchObject(encodeString('foo', 'cp1252'));
  });
});
