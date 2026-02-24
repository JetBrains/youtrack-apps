import type { PermissionKey } from '../types';

/**
 * Optionally decorate an HTTP handler with a permissions list.
 * If you don't need permissions, export the handler function directly without this wrapper.
 */
export function withPermissions<T extends (...args: any[]) => any>(
  fn: T,
  permissions: readonly PermissionKey[]
): T & { permissions: readonly PermissionKey[] } {
  try {
    Object.defineProperty(fn, 'permissions', {
      value: permissions as readonly PermissionKey[],
      configurable: false,
      enumerable: false,
      writable: false
    });
  } catch {
    // Fallback in rare environments where defineProperty fails
    (fn as any).permissions = permissions as readonly PermissionKey[];
  }
  return fn as T & { permissions: readonly PermissionKey[] };
}
