/**
 * Strips `readonly` modifiers and widens field types to accept string/number/boolean
 * assignments. Use this in POST/PUT handlers where YouTrack runs a read-write transaction.
 *
 * **POST / PUT handlers only.** Calling `mutable()` in a GET or DELETE handler compiles
 * fine but throws `ReadonlyTransactionException` at runtime when you try to assign a field.
 *
 * @example
 * ```ts
 * export default function handle(ctx: CtxPost<Req, Res, "issue">): void {
 *   const issue = mutable(ctx.issue);
 *   issue.summary = "New title";
 *   issue.State   = "In Progress";  // enum field — accepted by the runtime
 * }
 * ```
 */

/**
 * Removes `readonly` from every key and widens each value to also accept `string`,
 * so that both primitive fields and enum fields can be assigned.
 * An index signature covers arbitrary/extension property names.
 */
export type Mutable<T> = {
  -readonly [K in keyof T]: T[K] | string;
} & Record<string, string | number | boolean | null | undefined>;

/**
 * Type-cast `entity` to its writable counterpart.
 */
export function mutable<T extends object>(entity: T): Mutable<T> {
  return entity as unknown as Mutable<T>;
}
