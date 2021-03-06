import { tuple, isTuple, TUPLE_OBJECT_TYPE } from '../src/tuple';

describe('tuple', () => {
  test('should create tuple from set of values', () => {
    expect(typeof tuple(8, 'number')).toBe('object');
  });

  test('isTuple should return true if value is a Tuple', () => {
    expect(isTuple(tuple(8, 'number'))).toBe(true);
    expect(isTuple(8)).toBe(false);
  });

  test('should return item from tuple', () => {
    expect(tuple(1).item(0)).toBe(1);
  });

  test('should transform value of a tuple', () => {
    const newValue = 'transformed';
    expect(
      tuple(8)
        .transform(0, () => newValue)
        .item(0)
    ).toBe(newValue);
  });

  test('should get position of a given element or -1 of element is not in tuple', () => {
    expect(tuple(false).position(true)).toBe(-1);
    expect(tuple(false).position(false)).toBe(0);
  });

  test('should append value to tuple', () => {
    expect(tuple(1).append('').size()).toBe(2);
    expect(tuple(false).append(5).item(1)).toBe(5);
  });

  test('should prepend value to tuple', () => {
    expect(tuple(4).prepend(true).size()).toBe(2);
    expect(tuple(5).prepend('').item(0)).toBe('');
  });

  test('should remove first element from tuple', () => {
    expect(tuple(6).shift().size()).toBe(0);
    expect(tuple(6, 8, 9).shift().item(0)).toBe(8);
  });

  test('should remove element from end of tuple', () => {
    expect(tuple(6).pop().size()).toBe(0);
  });

  test('should get length of tuple', () => {
    expect(tuple().size()).toBe(0);
  });

  test('should be iterable and convertible to array', () => {
    expect(Symbol.iterator in tuple()).toBe(true);
    expect(Array.from(tuple(4))).toEqual([4]);
  });

  test('should be serializable', () => {
    expect(tuple(6).toJSON()).toEqual({ type: TUPLE_OBJECT_TYPE, value: [6] });
  });

  test('should concat another tuple', () => {
    expect(tuple(1).concat(tuple(2)).size()).toBe(2);
  });

  test('asArray method should return values of tuple', () => {
    expect(tuple(4).asArray()).toEqual([4]);
  });
});
