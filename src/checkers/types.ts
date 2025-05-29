import { Source } from '../source/types.js';

export interface Checker {
  parent?: Checker;
  isMatch(source: Source): Promise<boolean>;
}
