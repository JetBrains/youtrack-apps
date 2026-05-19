import type { PermissionKey } from '../types/index.js';

type HandlerWithPermissions<T> = T & { permissions: readonly PermissionKey[] };

/**
 * Optionally decorate an HTTP handler with a permissions list.
 * If you don't need permissions, export the handler function directly without this wrapper.
 */
export function withPermissions<T extends (...args: never[]) => unknown>(
  fn: T,
  permissions: readonly PermissionKey[]
): HandlerWithPermissions<T> {
  try {
    Object.defineProperty(fn, 'permissions', {
      value: permissions as readonly PermissionKey[],
      configurable: false,
      enumerable: false,
      writable: false
    });
  } catch {
    // Fallback in rare environments where defineProperty fails
    (fn as HandlerWithPermissions<T>).permissions = permissions as readonly PermissionKey[];
  }
  return fn as HandlerWithPermissions<T>;
}
