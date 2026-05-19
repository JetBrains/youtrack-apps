/**
 * Type-safe field assignment for YouTrack entities.
 *
 * Preserves the declared type of each field — you cannot accidentally assign
 * a `string` to a `number` field.
 *
 * **POST / PUT handlers only.** Assigning in a GET or DELETE handler compiles
 * fine but throws `ReadonlyTransactionException` at runtime.
 *
 * @example
 * ```ts
 * export default function handle(ctx: CtxPost<Req, Res, "issue">): void {
 *   set(ctx.issue, 'summary', 'New title');        // known field — value must be string
 *   set(ctx.issue, 'State', stateValue);            // extension field — accepts ExtensionValue
 * }
 * ```
 */

/**
 * Extracts explicitly declared keys from `T`, filtering out the
 * `[key: string]: unknown` index signature that every YouTrack entity carries.
 */
export type KnownKeys<T> = keyof {
  [K in keyof T as string extends K
    ? never
    : number extends K
      ? never
      : symbol extends K
        ? never
        : K]: T[K];
};

/** Permissive value type for extension / dynamic properties. */
export type ExtensionValue = string | number | boolean | null | undefined;

/**
 * Assign `value` to `entity[key]`.
 *
 * When `key` is a known (declared) field of `T`, the value is constrained to
 * the field's own type.  For any other key the value may be
 * `string | number | boolean | null | undefined`.
 */
export function set<T extends object, K extends KnownKeys<T> & string>(
  entity: T,
  key: K,
  value: T[K],
): void;
export function set<T extends object>(
  entity: T,
  key: string,
  value: ExtensionValue,
): void;
export function set(
  entity: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  entity[key] = value;
}
