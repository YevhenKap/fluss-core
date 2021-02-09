import { maybe, Maybe, nothing } from './maybe';
import type { Just } from './utilities';
import type {
  Chain,
  Foldable,
  Filterable,
  Serializable,
  SerializabledObject,
} from './types';

export type IteratorFunction<T> = () => Iterator<T>;

/** Monad that represents lazy Array. */
class List<T>
  implements
    Chain<T>,
    Iterable<T>,
    Foldable<T>,
    Filterable<T>,
    Serializable<ReadonlyArray<T>> {
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
        if (typeof value === 'object' && value !== null) {
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
    const self = this;
    return new List<R>(function* () {
      for (const value of self) {
        yield* fn(value);
      }
    });
  }

  join(...others: ReadonlyArray<ArrayLike<T> | Iterable<T>>): List<T> {
    const iterables = [this, ...others];
    return new List<T>(function* () {
      for (const iterable of iterables) {
        yield* Symbol.iterator in iterable
          ? (iterable as Iterable<T>)
          : Array.from<T>(iterable);
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

  uniqueBy<U>(fn: (item: T) => U): List<T> {
    const self = this;
    return new List<T>(function* () {
      const uniqueValues = new Set<U>();

      for (const value of self) {
        if (!uniqueValues.has(fn(value))) {
          uniqueValues.add(fn(value));
          yield value;
        }
      }
    });
  }

  sort(fn: (first: T, second: T) => number): List<T> {
    const sortedSelf = Array.from<T>(this).sort(fn);
    return new List<T>(function* () {
      for (const item of sortedSelf) {
        yield item;
      }
    });
  }

  /** Get rid of `Nothing` values. */
  compress(): List<Just<T>> {
    const self = this;
    return new List<Just<T>>(function* () {
      for (const item of self) {
        if (item !== null && item !== undefined) {
          yield item as Just<T>;
        }
      }
    });
  }

  take(count: number): List<T> {
    const self = this;
    return new List<T>(function* () {
      for (const item of self) {
        if (0 <= --count) {
          yield item;
        } else {
          // Ends iteration even if in parent list are many
          // values yet. Explicit returning increase
          // method's performance.
          return;
        }
      }
    });
  }

  skip(count: number): List<T> {
    const self = this;
    return new List<T>(function* () {
      for (const item of self) {
        if (0 > --count) {
          yield item;
        }
      }
    });
  }

  find(predicate: (item: T) => boolean): Maybe<T | null> {
    for (const item of this) {
      if (predicate(item)) {
        return maybe<T>(item);
      }
    }

    return nothing<T>();
  }

  forEach(fn: (value: T) => unknown): void {
    for (const value of this) {
      fn(value);
    }
  }

  has(value: T): boolean {
    return this.any((item) => Object.is(item, value));
  }

  size(): number {
    return Array.from<T>(this).length;
  }

  isEmpty(): boolean {
    return this.take(1).size() === 0;
  }

  fold<R>(fn: (accumulator: R, value: T) => R, accumulator: R): R {
    for (const item of this) {
      accumulator = fn(accumulator, item);
    }

    return accumulator;
  }

  /**
   * Check if at least one value of `List` passes _predicate_ function.
   * If list is empty, then method returns `false`.
   */
  any(predicate: (value: T) => boolean): boolean {
    for (const item of this) {
      if (predicate(item)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if all values of `List` pass _predicate_ function.
   * If list is empty, then method returns `true`.
   */
  all(predicate: (value: T) => boolean): boolean {
    for (const item of this) {
      if (!predicate(item)) {
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

  toJSON(): SerializabledObject<ReadonlyArray<T>> {
    return {
      type: 'List',
      value: Array.from<T>(this),
    };
  }
}

export type { List };
export const { list, iterate } = List;

/** Check if _value_ is instance of `List`. */
export const isList = <T>(value: unknown): value is List<T> =>
  value instanceof List;
