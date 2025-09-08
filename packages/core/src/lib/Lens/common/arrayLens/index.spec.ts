import arrayLens from '.';

describe('Test of arrayLens', () => {
  const array = ['a', 'b', 'c', 'd', 'e'];
  const lens = arrayLens(2);

  test('get', () => {
    expect(lens.get(array)).toEqual('c');
  });

  test('set', () => {
    expect(lens.set(array, 'cc')).toEqual(['a', 'b', 'cc', 'd', 'e']);
  });
});
