import { createCollection } from '.';

describe('Test of Collection', () => {
  test('Collection.append', () => {
    // Given
    const collection = createCollection(0, 1, 2, 3);

    // When
    const actual = collection.append(4).get();

    // Then
    const expected = [0, 1, 2, 3, 4];
    expect(actual).toEqual(expected);
  });

  test('Collection.remove', () => {
    // Given
    const collection = createCollection(0, 1, 2, 3);

    // When
    const actual = collection.remove(1).get();

    // Then
    const expected = [0, 2, 3];
    expect(actual).toEqual(expected);
  });

  test('Collection.forEach', () => {
    // Given
    const collection = createCollection(0, 1, 2, 3);
    const callback = vi.fn();

    // When
    collection.forEach(callback);

    // Then
    expect(callback).toHaveBeenNthCalledWith(1, 0);
    expect(callback).toHaveBeenNthCalledWith(2, 1);
    expect(callback).toHaveBeenNthCalledWith(3, 2);
    expect(callback).toHaveBeenNthCalledWith(4, 3);
  });
});
