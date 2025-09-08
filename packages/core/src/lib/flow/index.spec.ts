import { flow } from '.';

describe('Test of flow', () => {
  test('Edge case (no-reducer)', () => {
    expect(flow()(0)).toEqual(0);
  });

  test('flow(fn) = fn', () => {
    const increment = (i: number) => i + 1;
    expect(flow(increment)(0)).toEqual(1);
  });

  test('Regular case', () => {
    const increment = (i: number) => i + 1;
    expect(flow(increment, increment, increment)(0)).toEqual(3);
  });
});
