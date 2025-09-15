import recordLens from '.';

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
  });

  describe('Case: the element already exists', () => {
    const record: Record<string, string> = {
      '7aa9abab-80b6-4f87-bba3-b9e831f1e986': 'Hello, World!',
    };

    const lens = recordLens<string>('7aa9abab-80b6-4f87-bba3-b9e831f1e986');

    test('Get', () => {
      expect(lens.get(record)).toEqual('Hello, World!');
    });

    test('Set', () => {
      expect(lens.set(record, '42')).toEqual({
        '7aa9abab-80b6-4f87-bba3-b9e831f1e986': '42',
      });
    });
  });
});
