/**
 * Adds a non-enumerable `$set(key, value)` method to an entity, keeping
 * property reads unchanged while providing type-safe assignment.
 *
 * **POST / PUT handlers only.** Assigning in a GET or DELETE handler compiles
 * fine but throws `ReadonlyTransactionException` at runtime.
 *
 * @example
 * ```ts
 * export default function handle(ctx: CtxPost<Req, Res, "issue">): void {
 *   const issue = settable(ctx.issue);
 *   issue.$set('summary', 'New title');
 *   issue.$set('State', stateValue);
 * }
 * ```
 */

import type { KnownKeys, ExtensionValue } from './set.js';

/** Entity augmented with a type-safe `$set` method. */
export type SettableEntity<T> = T & {
  /** Assign a known field — value is constrained to the field's declared type. */
  $set<K extends KnownKeys<T> & string>(key: K, value: T[K]): void;
  /** Assign an extension / dynamic field. */
  $set(key: string, value: ExtensionValue): void;
};

/**
 * Attach a non-enumerable `$set` method to `entity` and return it
 * with the augmented type.
 *
 * Calling `settable()` twice on the same entity is safe (`configurable: true`).
 */
export function settable<T extends object>(entity: T): SettableEntity<T> {
  Object.defineProperty(entity, '$set', {
    value(key: string, val: unknown) {
      (entity as Record<string, unknown>)[key] = val;
    },
    enumerable: false,
    configurable: true,
    writable: false,
  });
  return entity as SettableEntity<T>;
}
