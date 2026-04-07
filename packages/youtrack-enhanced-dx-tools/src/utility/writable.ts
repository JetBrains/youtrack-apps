/**
 * Proxy-based wrapper that turns every property access into a
 * `{ value, setValue }` handle, providing the most fluent API for
 * field assignment.
 *
 * **POST / PUT handlers only.** Assigning in a GET or DELETE handler compiles
 * fine but throws `ReadonlyTransactionException` at runtime.
 *
 * @example
 * ```ts
 * export default function handle(ctx: CtxPost<Req, Res, "issue">): void {
 *   const issue = writable(ctx.issue);
 *   issue.summary.setValue('New title');
 *   issue.State.setValue(stateValue);
 *   const current = issue.summary.value; // read the raw value
 * }
 * ```
 */

import type { KnownKeys, ExtensionValue } from './set.js';

/** A lightweight handle exposing the current value and a typed setter. */
export interface FieldHandle<V> {
  /** The current raw value of the field. */
  readonly value: V;
  /** Assign a new value to the underlying entity field. */
  setValue(val: V): void;
}

/**
 * Mapped entity where every property access yields a {@link FieldHandle}.
 *
 * Known (declared) keys produce `FieldHandle<T[K]>`, preserving the
 * field's declared type.  Any other key produces `FieldHandle<ExtensionValue>`.
 */
export type WritableEntity<T> = {
  readonly [K in KnownKeys<T> & string]: FieldHandle<T[K & keyof T]>;
} & {
  readonly [key: string]: FieldHandle<ExtensionValue>;
};

/**
 * Wrap `entity` in a Proxy so that every property access returns a
 * `{ value, setValue }` handle instead of the raw value.
 */
export function writable<T extends object>(entity: T): WritableEntity<T> {
  if (typeof Proxy === 'undefined') {
    throw new Error(
      'writable() requires Proxy support. Use set() or settable() as an alternative.',
    );
  }

  return new Proxy(entity as Record<string, unknown>, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'symbol') return undefined;
      return {
        get value() {
          return target[prop];
        },
        setValue(val: unknown) {
          target[prop] = val;
        },
      };
    },
  }) as unknown as WritableEntity<T>;
}
