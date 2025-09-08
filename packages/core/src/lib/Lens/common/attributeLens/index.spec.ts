import attributeLens from '.';

describe('Test of attributeLens', () => {
  type Speed = {
    value: number;
    unit: 'km/h';
  };

  const speed: Speed = {
    value: 17,
    unit: 'km/h',
  };

  const lens = attributeLens<Speed, 'value'>('value');

  test('get', () => {
    expect(lens.get(speed)).toEqual(17);
  });

  test('set', () => {
    expect(lens.set(speed, 17.5)).toEqual({
      value: 17.5,
      unit: 'km/h',
    });
  });
});
