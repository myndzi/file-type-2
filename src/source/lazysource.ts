import { Heap } from 'mnemonist';
import { Source } from './types.js';

type CheckFn = (actual: Uint8Array) => boolean;

type Range = { start: number; length: number };

type DeferredSpan = Range & {
  resolve: (actual: Uint8Array) => void;
};

const NoMatch: unique symbol = Symbol('NoMatch');

const empty = new Uint8Array(0);

export class LazySource {
  private heap: Heap<DeferredSpan>;

  // the buffer holding the data
  private buf: Uint8Array = empty;
  // the absolute position in the source of the first byte in `buf`
  private pos: number = 0;

  // the earliest byte position someone has asked for
  private minInterest: number = -1;
  // the latest byte position someone has asked for
  private maxInterest: number = -1;

  private constructor(private source: Source) {
    // sort the requests that need the fewest bytes to be the earliest
    this.heap = new Heap((a, b) => a.start + a.length - (b.start + b.length));
  }

  private cleanup() {
    this.minInterest = this.maxInterest = -1;
    this.heap.clear();
    this.buf = empty;
  }

  // calls a callback with an instance of LazySource reading from the supplied
  // Source. when the function returns, the LazySource is cleaned up.
  // NOTE: the callback cannot do any asynchronous work other than calling
  // lazySource.check(); if it does, the synchronization will be off and
  // lazySource will clean itself up, perceiving an empty queue. this could
  // be improved, but it's uncertain yet if it is necessary
  static async with(source: Source, cb: (source: LazySource) => Promise<void>) {
    const lazySource = new LazySource(source);
    try {
      setImmediate(() => lazySource.readNext());
      await cb(lazySource);
    } finally {
      lazySource.cleanup();
    }
  }

  private getSpan(start: number, length: number): Uint8Array | null {
    // we might have the data, but we'll refuse to give it to them
    // since we can't guarantee we would always have the data. this
    // should help surface coding errors
    if (start < this.pos) {
      // in the future, we can likely cache chunks on request or something
      // like that, but for now, checkers should do that themselves
      throw new Error('Cannot provide data from earlier in the file');
    }

    // we don't have enough data -- come back later
    if (start + length > this.pos + this.buf.byteLength) return null;

    // should this be immutable? it'd be a lot more copying...
    return this.buf.subarray(start - this.pos, start - this.pos + length);
  }

  // callers register an interest in a span of data which matches some function.
  // they should expect that the promise will only fulfill if the match succeeds.
  // in this case, they will receive a Uint8Array of the data that matched
  async check(start: number, length: number, checker: CheckFn): Promise<Uint8Array> {
    // we intend to only resolve this promise if we get data that matches.
    // we have to take care not to leak memory here; the reference we keep
    // outside of this scope to the Promise constructor's "resolve" function
    // will keep things alive
    return new Promise<Uint8Array>((_resolve, _reject) => {
      // we only want to resolve when the request matches;
      // otherwise, we leave the promise hanging; we discard
      // our references and the continuation never happens /
      // everything should get garbage collected.

      // we avoid performing this work as a "then" or after
      // an "await" because we rely on queueMicrotask to run
      // the next data-fetch after the promises we've created
      // in this method get resolved from the queue
      const resolve = (actual: Uint8Array) => {
        if (checker(actual)) {
          _resolve(actual);
        } else {
          _reject(NoMatch);
        }
      };

      const actual = this.getSpan(start, length);

      // if we can fill it from the data we already have, do that
      if (actual !== null) {
        resolve(actual);
        return;
      }

      // ensure our interest range encompasses the request
      this.minInterest = this.minInterest === -1 ? start : Math.min(this.minInterest, start);
      this.maxInterest = Math.max(this.maxInterest, start + length - 1);

      // defer this check until we have the data
      this.heap.push({
        start,
        length,
        resolve,
      });
    });
  }

  private async readNext(): Promise<void> {
    // nothing left to read
    if (this.minInterest === -1 || this.maxInterest === -1) {
      this.cleanup();
      return;
    }

    const first = this.pos;
    const last = first + this.buf.byteLength - 1;

    const start = Math.max(this.minInterest, last + 1);
    const length = this.maxInterest - start + 1;

    const chunk = await this.source.readu8(start, length);

    if (this.minInterest > last) {
      this.buf = chunk;
      this.pos = this.minInterest;
    } else {
      // there's some overlap, combine the buffers
      const keep = this.buf.subarray(this.minInterest - first);
      const combined = new Uint8Array(keep.byteLength + chunk.byteLength);
      combined.set(keep, 0);
      combined.set(chunk, keep.byteLength);

      this.buf = combined;
      this.pos = this.minInterest;
    }

    this.minInterest = this.maxInterest = -1;

    this.processQueue();
  }

  private processQueue(): void {
    // nothing left to do
    if (this.heap.size === 0) {
      this.cleanup();
      return;
    }

    // as long as we read all the data we wanted, we should be able to entirely consume
    // the heap here. if not, either there's no more data and some checkers will be left
    // dangling, or else we'll get 'em next time (e.g. we read a maximum number of bytes
    // per call)

    // the heap is ordered such that the top of the heap will need the fewest further
    // bytes to do its work, so we can simply pop items off while they can be satisfied
    // and stop when we hit the first one that cannot be

    let cand: DeferredSpan | undefined;
    while ((cand = this.heap.peek()) !== undefined) {
      const u8 = this.getSpan(cand.start, cand.length);
      if (u8 === null) {
        break;
      }
      this.heap.pop();
      cand.resolve(u8);
    }

    // the loop above resolves all the promises that consumers were waiting on;
    // we've ensured there are no chained promises on the promise we return to
    // the consumer. therefore, this queueMicrotask should happen after all
    // synchronous code waiting on the promises we provided has completed.
    // this means that any follow-up data requests will be fully encompassed
    // in our local state by the time we read the next chunk

    // use setImmediate here. even though we resolved the promises, they don't
    // get enqueued into the microtask queue until after this function exits!
    // we want to ensure readNext happens _after_ all awaited promises have
    // reentered their code blocks.
    setImmediate(() => this.readNext());
  }

  // scan(pos: number, needle: Range, maxDistance?: number): Promise<Range> {}
}
