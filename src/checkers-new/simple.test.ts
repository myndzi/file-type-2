import * as allChecks from './checkers.js';

import { getFixtures } from '../_test/test_fixtures.js';

import { FileSource } from '../lib/datasource/filesource.js';
import { Reader } from '../lib/reader/reader.js';
import { Runner } from '../lib/runner.js';
import { Simple } from './simple.js';

describe('simple', async () => {
  const simpleu8checks = Object.values(allChecks).filter(v => v instanceof Simple);

  const allExts = [...new Set(simpleu8checks.flatMap(check => check.exts))];

  const tests = await Promise.all(
    allExts.map(async ext => ({
      ext,
      checkers: simpleu8checks.filter(check => check.exts.includes(ext)),
      fixtures: await getFixtures(ext),
    })),
  );

  // positive checks
  it.for(tests.filter(t => t.fixtures.length > 0))(
    `$ext ($checkers.length/$fixtures.length)`,
    async ({ ext, checkers, fixtures }) => {
      for (const fix of fixtures) {
        const fs = new FileSource(fix);
        try {
          const strategy = (v?: number) => (v ? v * 2 : 8);
          const reader = new Reader(fs, {
            strategy,
            maxRead: 500,
          });
          const runner = new Runner(checkers, true);

          const result = await runner.run(reader).catch(e => {
            expect.fail('expected promise to fulfill, but got', e);
          });

          expect(result.length).toBeGreaterThan(0);
          expect(result[result.length - 1].exts).toContain(ext);
        } finally {
          await fs.close();
        }
      }
    },
  );

  it.for(tests.filter(t => t.fixtures.length === 0))(
    `$ext ($checkers.length/$fixtures.length)`,
    { skip: true },
    async ({ ext, checkers, fixtures }) => {
      expect.fail('no fixture');
    },
  );
});
