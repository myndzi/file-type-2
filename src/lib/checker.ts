import { Ext, Mime } from '../types.js';
import type { Integer } from './integer.js';
import type { Reader } from './reader/reader.js';

export type CheckResult =
  | {
      match: true;
      /** Exclusive */
      continueAt?: Integer;
      context?: string;
    }
  | {
      match: false;
    };

export type CheckFn = (reader: Reader, pos: Integer) => Promise<CheckResult>;

export interface CheckerDependency {
  checker: PartialChecker;
  required: boolean;
}
export interface PartialChecker {
  name: string;
  after: CheckerDependency | undefined;
  check: CheckFn;
}

export interface Checker extends PartialChecker {
  mime: Mime;
  exts: Ext[];
}

export const isLeaf = (checker: Checker | PartialChecker): checker is Checker =>
  Object.prototype.hasOwnProperty.call(checker, 'mime');
