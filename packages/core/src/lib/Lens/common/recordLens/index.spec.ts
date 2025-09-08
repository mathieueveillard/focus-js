import recordLens from '.';
import attributeLens from '../attributeLens';

describe('Test of recordLens()', () => {
  describe("Case: the element doesn't exist", () => {
    const record: Record<string, string> = {};

    const lens = recordLens<string>('7aa9abab-80b6-4f87-bba3-b9e831f1e986');

    test('Get', () => {
      expect(lens.get(record)).toEqual(undefined);
    });

    test('Set', () => {
      expect(lens.set(record, 'This is OK!')).toEqual({
        '7aa9abab-80b6-4f87-bba3-b9e831f1e986': 'This is OK!',
      });
    });

    describe('Composition with another lens (upstream)', () => {
      type Upstream = {
        upstream: Record<string, string>;
      };

      const upstreamLens = attributeLens<Upstream, 'upstream'>('upstream');

      const strongerLens = upstreamLens.focus(lens);

      const upstream: Upstream = {
        upstream: record,
      };

      test('Get', () => {
        expect(strongerLens.get(upstream)).toEqual(undefined);
      });

      test('Set', () => {
        expect(strongerLens.set(upstream, 'This is OK!')).toEqual({
          upstream: {
            '7aa9abab-80b6-4f87-bba3-b9e831f1e986': 'This is OK!',
          },
        });
      });
    });
  });
});
