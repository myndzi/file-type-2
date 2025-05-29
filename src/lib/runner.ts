import { Ext, Mime } from '../types.js';
import { Checker, CheckResult, isLeaf, PartialChecker } from './checker.js';
import { Integer } from './integer.js';
import { Reader } from './reader/reader.js';

export type FileType = { mime: Mime; exts: Ext[]; context: string[] };

export const NoMatch = Object.freeze({ match: false });
export const Match = Object.freeze({ match: true });

type BoundResult = {
  checker: PartialChecker;
  result: CheckResult | Error;
};

const sortCheckers = (input: Checker[]): PartialChecker[] => {
  const all = new Set<PartialChecker>();
  const visited = new Set<PartialChecker>();
  const visiting = new Set<PartialChecker>();
  const result: PartialChecker[] = [];

  // get a set of all checkers: the ones specified, and
  // any that are referenced by them, too
  const collect = (checker: PartialChecker) => {
    if (!all.has(checker)) {
      all.add(checker);
      if (checker.after) collect(checker.after.checker);
    }
  };
  input.forEach(collect);

  // DFS to sort respecting dependencies
  const visit = (checker: PartialChecker) => {
    if (visited.has(checker)) return;
    if (visiting.has(checker)) {
      const cycle = [checker.name];

      for (
        let after = checker.after?.checker;
        after && after !== checker;
        after = checker.after?.checker
      ) {
        cycle.push(after.name);
      }

      throw new Error(`Circular dependency: ${cycle.join(' -> ')}`);
    }

    visiting.add(checker);
    if (checker.after) visit(checker.after.checker);

    visiting.delete(checker);
    visited.add(checker);
    result.push(checker);
  };

  all.forEach(visit);

  return result;
};

export class Runner {
  private sorted: PartialChecker[];
  constructor(
    checkers: Checker[],
    private strict: boolean = false,
  ) {
    // ensure that in the array we run from, all dependencies
    // come before their dependents
    this.sorted = sortCheckers(checkers);
  }

  // kick off all checkers, including resolving their dependencies and
  // adjusting the position of the check according to any dependencies
  private execute(reader: Reader): Promise<BoundResult[]> {
    const checkResults = new Map<PartialChecker, Promise<BoundResult>>();

    for (const checker of this.sorted) {
      const result = (async (): Promise<BoundResult> => {
        let pos: Integer = 0;

        const after = checker.after;
        if (after) {
          const depResult = (await checkResults.get(after.checker)!).result;
          if (depResult instanceof Error) {
            return { checker, result: depResult };
          }
          if (depResult.match) {
            if (depResult.continueAt) pos = depResult.continueAt;
          } else if (after.required) {
            return { checker, result: NoMatch };
          }
        }

        try {
          const result = await checker.check(reader, pos);
          return { checker, result };
        } catch (e) {
          return { checker, result: e instanceof Error ? e : new Error(String(e)) };
        }
      })();

      checkResults.set(checker, result);
    }

    return Promise.all(checkResults.values());
  }

  async run(reader: Reader): Promise<FileType[]> {
    const contexts = new Map<PartialChecker, string>();

    const fileTypes: FileType[] = [];
    for (const { checker, result } of await this.execute(reader)) {
      if (result instanceof Error) {
        if (this.strict) throw result;
        console.warn(`checker ${checker.name} failed`, result);
        continue;
      }

      if (!result.match) continue;

      if (result.context) contexts.set(checker, result.context);

      if (!isLeaf(checker)) continue;

      const context: string[] = [];
      for (let c: PartialChecker | undefined = checker; c !== undefined; c = c.after?.checker) {
        const str = contexts.get(c);
        if (str !== undefined) {
          context.push(str);
        }
      }
      context.reverse();

      fileTypes.push({
        mime: checker.mime,
        exts: checker.exts,
        context,
      });
    }

    return fileTypes;
  }
}
