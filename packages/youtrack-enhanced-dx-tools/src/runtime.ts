// Backend-safe runtime utilities and types.
// This entry point is free of Node.js-only dependencies (chokidar, fs, etc.)
// and can be safely imported in YouTrack backend handler code bundled by Vite.

export * from './types/index.js';
export { withPermissions } from './utility/withPermissions.js';
export { mutable } from './utility/mutable.js';
export type { Mutable } from './utility/mutable.js';
export { set } from './utility/set.js';
export type { KnownKeys, ExtensionValue } from './utility/set.js';
