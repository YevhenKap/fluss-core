import type { Chain, Filterable, Foldable } from './types';

export type IteratorFunction<T> = () => Iterator<T>;

/** Monad that represents lazy Array. */
class List<T> implements Iterable<T>, Chain<T>, Foldable<T>, Filterable<T> {
  readonly [Symbol.iterator]: IteratorFunction<T>;

  private constructor(fn: IteratorFunction<T>) {
    this[Symbol.iterator] = fn;
  }

  /** Create `List` from values, array-like objects or iterables. */
  static list<T>(
    ...values: ReadonlyArray<T | ArrayLike<T> | Iterable<T>>
  ): List<T> {
    return new List<T>(function* () {
      for (const value of values) {
        if (typeof value === 'object') {
          if (Symbol.iterator in value) {
            yield* value as Iterable<T>;
          } else if ('length' in value) {
            yield* Array.from(value);
          } else {
            yield value as T;
          }
        } else {
          yield value;
        }
      }
    });
  }

  /** Create `List` from function that returns iterator. */
  static iterate<T>(fn: IteratorFunction<T>): List<T> {
    return new List<T>(fn);
  }

  map<R>(fn: (value: T) => R): List<R> {
    const self = this;
    return new List<R>(function* () {
      for (const item of self) {
        yield fn(item);
      }
    });
  }

  chain<R>(fn: (value: T) => List<R>): List<R> {
    const selfMapped = this.map(fn);
    return new List<R>(function* () {
      for (const list of selfMapped) {
        yield* list;
      }
    });
  }

  join(...others: ReadonlyArray<Iterable<T>>): List<T> {
    const iterables = [this, ...others];
    return new List<T>(function* () {
      for (const iterable of iterables) {
        yield* iterable;
      }
    });
  }

  filter(predicate: (value: T) => boolean): List<T> {
    const self = this;
    return new List<T>(function* () {
      for (const item of self) {
        if (predicate(item)) {
          yield item;
        }
      }
    });
  }

  append(...values: ReadonlyArray<T>): List<T> {
    return this.join(values);
  }

  prepend(...values: ReadonlyArray<T>): List<T> {
    const iterables = [values, this];
    return new List<T>(function* () {
      for (const iterable of iterables) {
        yield* iterable;
      }
    });
  }

  unique(): List<T> {
    const self = this;
    return new List<T>(function* () {
      const uniqueValues = new Map<T, boolean>();

      for (const value of self) {
        if (!uniqueValues.has(value)) {
          uniqueValues.set(value, true);
          yield value;
        }
      }
    });
  }

  forEach(fn: (value: T) => unknown): void {
    for (const value of this) {
      fn(value);
    }
  }

  has(value: T): boolean {
    for (const item of this) {
      if (Object.is(value, item)) {
        return true;
      }
    }
    return false;
  }

  size(): number {
    return Array.from(this).length;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  fold<R>(fn: (accumulator: R, value: T) => R, accumulator: R): R {
    if (this.isEmpty()) {
      return accumulator;
    }

    for (const item of this) {
      accumulator = fn(accumulator, item);
    }

    return accumulator;
  }

  /**
   * Checks if at least one value of `List` passes _predicat_ function.
   * If list is empty, then method returns `false`.
   */
  some(predicat: (value: T) => boolean): boolean {
    for (const item of this) {
      if (predicat(item)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if all values of `List` pass _predicat_ function.
   * If list is empty, then method returns `true`.
   */
  every(predicat: (value: T) => boolean): boolean {
    for (const item of this) {
      if (!predicat(item)) {
        return false;
      }
    }
    return true;
  }

  /** Convert `List` to `Array`. */
  asArray(): ReadonlyArray<T> {
    // Here must be freezing array operation,
    // but due to [this Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=980227)
    // it is very slow operation and this action is not performed.
    return Array.from<T>(this);
  }
}

export type { List };
export const { list, iterate } = List;

/** Check if _value_ is instance of `List`. */
export function isList<T>(value: any): value is List<T> {
  return value instanceof List;
}