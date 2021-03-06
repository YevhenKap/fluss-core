import { sequentially } from '../src/sequentially';

describe('sequentially', () => {
  test('sequentially function executes functions with same input value', () => {
    let stringValue = '';
    const concatNumberAsString = sequentially(
      (n: number) => (stringValue += n),
      (b) => (stringValue += b),
      (u) => (stringValue += u)
    );
    concatNumberAsString(0);

    expect(stringValue).toBe('000');
  });

  test('should be able to handle asynchronous functions and return promise', async () => {
    let text = '';
    const s = sequentially(
      async (num: number) => (text += num),
      (num) => (text += num + 1),
      async (num) => (text += num + 2)
    );

    const result = s(1);

    expect(result).toBeInstanceOf(Promise);

    await result;

    expect(text).toBe('123');
  });

  it('should execute asynchronous functions one after another', async () => {
    let text = '';
    const s = sequentially(
      () =>
        new Promise((resolve) =>
          setTimeout(() => ((text += 1), resolve(null)), 200)
        ),
      () =>
        new Promise((resolve) =>
          setTimeout(() => ((text += 2), resolve(null)), 150)
        ),
      () =>
        new Promise((resolve) =>
          setTimeout(() => ((text += 3), resolve(null)), 100)
        )
    );

    await s();

    expect(text).toMatch('123');
  });

  it('should execute synchronous functions one after another', () => {
    let text = '';
    const s = sequentially(
      () => (text += 1),
      () => (text += 2),
      () => (text += 3)
    );

    s();

    expect(text).toMatch('123');
  });

  it('should execute mixed functions one after another', async () => {
    let text = '';
    const s = sequentially(
      () => (text += 1),
      () =>
        new Promise((resolve) =>
          setTimeout(() => ((text += 2), resolve(null)), 100)
        ),
      () => (text += 3)
    );

    await s();

    expect(text).toMatch('123');
  });

  it('should return result of synchronous functions as array', () => {
    const fn = sequentially(
      (n: number) => n,
      (n: number) => n ** 2
    );

    const result = fn(2);

    expect(result).toEqual([2, 4]);
  });

  it('should return result of mixed functions as Promise of array', async () => {
    const fn = sequentially(
      (n: number) => n,
      async (n: number) => n ** 2
    );

    const result = await fn(2);

    expect(result).toEqual([2, 4]);
  });
});
