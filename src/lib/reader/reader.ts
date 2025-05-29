import { Heap } from 'mnemonist';
import type { DataSource } from '../datasource/datasource.js';
import { add, subToNumber, type Integer } from '../integer.js';
import type { ReadStrategy } from '../strategy.js';

type StartByte = Integer & { __brand__: 'startByteInclusive' };
type EndByte = Integer & { __brand__: 'endByteExclusive' };

type Span = { start: StartByte; end: EndByte };
type BufferSpan = Span & {
  bufStart: number;
  bufEnd: number;
};
type DeferredSpan = Span & {
  resolve: (actual: Uint8Array) => void;
  reject: (reason?: any) => void;
};

type Pin = {
  pos: Integer;
  active: boolean;
};

type Promiseable<T> = Promise<T> | (() => Promise<T>);

const maxSpanEnd = (acc: Integer, cur: Span) => (acc > cur.end ? acc : cur.end);

export interface ReaderInit {
  strategy: ReadStrategy;
  maxRead: number;
}

export class Reader {
  private queue: Heap<DeferredSpan>;
  private pins: Heap<Pin>;

  private source: DataSource;

  private strategy: ReadStrategy;
  private buffer: Uint8Array;
  private chunkSpan: BufferSpan;

  private readSize: number;
  private maxRead: number;

  private timer: NodeJS.Timeout | number | undefined = undefined;

  constructor(source: DataSource, init: ReaderInit) {
    // sort by earliest last-byte: these will be fillable first
    this.queue = new Heap((a, b) => (a.end < b.end ? -1 : a.end > b.end ? 1 : 0));
    // sort by lowest first: we cannot drop bytes before the minimum interest
    this.pins = new Heap((a, b) => (a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : 0));

    this.source = source;
    this.strategy = init.strategy;

    this.buffer = new Uint8Array(init.maxRead);

    // this is the absolute position in the data
    // that the arraybuffer contents represents
    this.chunkSpan = {
      start: 0 as StartByte,
      end: 0 as EndByte,
      bufStart: 0,
      bufEnd: 0,
    };

    this.readSize = init.strategy();
    this.maxRead = init.maxRead;
  }

  async pin<T>(pos: Integer, promise: Promise<T>): Promise<T>;
  async pin<T>(pos: Integer, cb: () => Promise<T>): Promise<T>;
  async pin<T>(pos: Integer, arg: Promiseable<T>): Promise<T> {
    const pin: Pin = { pos, active: true };
    this.pins.push(pin);
    try {
      return await (typeof arg === 'function' ? arg() : arg);
    } finally {
      pin.active = false;
    }
  }

  private assertValid(pos: Integer, len: number) {
    if (pos < this.chunkSpan.start) throw new Error('disallowed backwards read');
    if (len > this.maxRead) throw new Error('request exceeds maxRead');
  }

  private getSubarray(reqStart: StartByte, reqEnd: EndByte): Uint8Array | undefined {
    const { start: chunkStart, end: chunkEnd, bufStart } = this.chunkSpan;

    if (reqStart < chunkStart || reqEnd > chunkEnd) return undefined;

    const start = bufStart + subToNumber(reqStart, chunkStart);
    const end = bufStart + subToNumber(reqEnd, chunkStart);
    return this.buffer.subarray(start, end);
  }

  request(pos: Integer, len: number): Uint8Array | undefined {
    this.assertValid(pos, len);
    return this.getSubarray(pos as StartByte, add(pos, len) as EndByte);
  }

  async demand(pos: Integer, len: number): Promise<Uint8Array> {
    this.assertValid(pos, len);

    const start = pos as StartByte;
    const end = add(pos, len) as EndByte;

    return this.pin(
      pos,
      new Promise((resolve, reject) => {
        this.queue.push({ start, end, resolve, reject });
        this.timer ??= setTimeout(() => this.tick(), 0);
      }),
    );
  }

  private minInterest(): Integer {
    while (this.pins.size > 0) {
      const pin = this.pins.peek()!;
      if (pin.active) return pin.pos;
      this.pins.pop();
    }
    throw new Error('[BUG]: no pins active, why are we calling minInterest()?');
  }

  private _fillableRequests(firstByteInclusive: Integer): DeferredSpan[] {
    const lastByteExclusive = add(firstByteInclusive, this.readSize);

    const fillable: DeferredSpan[] = [];

    for (let peeked = this.queue.peek(); peeked !== undefined; peeked = this.queue.peek()) {
      // we're not checking peeked.start because that should be accounted for by `minInterest`
      if (peeked.end > lastByteExclusive) break;
      fillable.push(peeked);
      this.queue.pop();
    }

    return fillable;
  }

  private fillableRequests(firstByteInclusive: Integer): DeferredSpan[] | null {
    while (true) {
      const fillable = this._fillableRequests(firstByteInclusive);
      if (fillable.length > 0) return fillable;

      const success = this.increaseReadSize();
      if (!success) return null;
    }
  }

  private increaseReadSize(): boolean {
    const oldReadSize = this.readSize;
    this.readSize = Math.min(this.maxRead, this.strategy(this.readSize));
    // console.log('increaseReadSize', oldReadSize, this.readSize);
    return this.readSize > oldReadSize;
  }

  private prepareBuffer(startInclusive: StartByte, endExclusive: EndByte): void {
    const { end: chunkEndExclusive, bufEnd: bufEndExclusive } = this.chunkSpan;

    const numBytesRequested = subToNumber(endExclusive, startInclusive);
    if (numBytesRequested <= 0) {
      throw new Error('[BUG]: numBytesRequested <= 0');
    }

    this.chunkSpan.start = startInclusive;
    this.chunkSpan.end = endExclusive;

    const bufEndOffset = subToNumber(startInclusive, chunkEndExclusive);

    // the request is sequential or skipping ahead; just read the full amount into offset 0
    if (bufEndOffset >= 0) {
      this.chunkSpan.bufStart = 0;
      this.chunkSpan.bufEnd = numBytesRequested;
      return;
    }

    // the request at least partially includes data we already have

    const numBytesToKeep = -bufEndOffset;
    const numBytesToRead = numBytesRequested - numBytesToKeep;
    const remainingSpace = this.buffer.byteLength - bufEndExclusive;

    let readToIdx = bufEndExclusive;

    if (numBytesToRead > remainingSpace) {
      // we don't have room to fit the new data after our existing data
      // shift the part we want to keep to the start
      this.buffer.copyWithin(0, bufEndExclusive - numBytesToKeep, bufEndExclusive);
      readToIdx = numBytesToKeep;
    }

    this.chunkSpan.bufEnd = readToIdx + numBytesToRead;
  }

  private async tick() {
    // console.log('tick');
    if (this.queue.size === 0) {
      this.timer = undefined;
      return;
    }

    const firstByteInclusive: StartByte = this.minInterest() as StartByte;

    const fillable = this.fillableRequests(firstByteInclusive);
    // console.log('fillable', fillable);
    if (fillable === null) {
      // something is wrong here: we shouldn't have allowed in
      // any requests that span beyond the max read size. at the
      // very least, whatever is holding the minInterest value
      // should be satisfiable
      this.abort('[BUG]: cannot satisfy data requests: maxRead exceeded');
      return null;
    }

    const lastByteExclusive = fillable.reduce(maxSpanEnd, 0) as EndByte;
    // console.log({ firstByteInclusive, lastByteExclusive });

    this.prepareBuffer(firstByteInclusive, lastByteExclusive);

    const writeAt = this.chunkSpan.bufStart;
    const atMostBytes = this.chunkSpan.bufEnd - writeAt;

    // read new data into the buffer. the amount we read _may_ be less than nextReadSize
    let readBytes: number;
    try {
      readBytes = await this.source.readInto(this.buffer, writeAt, atMostBytes, firstByteInclusive);
    } catch (e) {
      // abort everything

      this.abort(e instanceof Error ? e.message : String(e), fillable);
      return;
    }

    if (readBytes === 0) {
      const e = new Error('End of data reached');
      this.abort(e.message, fillable);
      return;
    }

    if (readBytes > atMostBytes) {
      // the source did not fulfill the contract; we can't rely on the data being
      // correct here
      throw new Error('[BUG]: readBytes > atMostBytes');
    }

    if (readBytes < atMostBytes) {
      const diff = atMostBytes - readBytes;
      // adjust the chunkSpan to match reality
      this.chunkSpan.end = add(this.chunkSpan.end, -diff) as EndByte;
      this.chunkSpan.bufEnd -= diff;
    }

    // fill as many requests as we can. many/most of these will,
    // if they perform only synchronous work between the time that
    // they requested data and the next data request, have logged
    // their new data requests before the next tick runs.
    //
    // if not, they'll get picked up in later rounds
    const remaining = fillable.filter(req => {
      const filled = this.getSubarray(req.start, req.end);
      // console.log('filled', filled);
      if (!filled) return true;

      req.resolve(filled);
      return false;
    });

    // console.log('remaining', remaining);
    // push the rest back into the queue
    for (const remain of remaining) {
      this.queue.push(remain);
    }

    if (this.queue.size > 0) {
      // attempt another read
      this.timer = setTimeout(() => this.tick(), 0);
    } else {
      // idle; allow further reads to queue a new tick
      this.timer = undefined;
    }
  }

  private abort(msg: string, extra: DeferredSpan[] = []) {
    for (const item of [...extra, ...this.queue.consume()]) {
      item.reject(msg);
    }
  }
}
