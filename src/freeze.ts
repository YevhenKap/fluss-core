/**
 * Perform shallow(_deep_ is `false`) or deep(_deep_ is `true`)
 * freeze of object. By default function does shallow freezing.
 */
export function freeze<T extends object>(
  value: T,
  deep: boolean = false
): Readonly<T> {
  if (deep) {
    Object.getOwnPropertyNames(value).forEach((name) => {
      const innerValue = (value as { [key: string]: any })[name];
      if (typeof innerValue === 'object' || typeof innerValue === 'function') {
        freeze(innerValue);
      }
    });
  }

  return Object.freeze(value);
}
