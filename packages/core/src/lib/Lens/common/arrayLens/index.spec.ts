import arrayLens from '.';

describe('Test of arrayLens', () => {
  test('get', () => {
    const array = ['a', 'b', 'c', 'd', 'e'];
    const lens = arrayLens<string>(2);
    expect(lens.get(array)).toEqual('c');
  });

  test('get (out of boundaries index)', () => {
    const array = ['a', 'b', 'c', 'd', 'e'];
    const lens = arrayLens<string>(5);
    expect(lens.get(array)).toEqual(undefined);
  });

  test('set', () => {
    const array = ['a', 'b', 'c', 'd', 'e'];
    const lens = arrayLens<string>(2);
    expect(lens.set(array, 'z')).toEqual(['a', 'b', 'z', 'd', 'e']);
  });

  test('set (out of boundaries index)', () => {
    const array = ['a', 'b', 'c', 'd', 'e'];
    const lens = arrayLens<string>(5);
    expect(lens.set(array, 'f')).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });
});
