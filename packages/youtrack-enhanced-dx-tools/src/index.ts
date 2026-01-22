export { default as youtrackApiGenerator } from './plugins/vite-plugin-youtrack-api-generator.js';
export { default as youtrackRouter } from './plugins/vite-plugin-youtrack-router.js';
export { default as youtrackExtensionProperties } from './plugins/vite-plugin-youtrack-extension-properties.js';
export { default as youtrackAppSettings } from './plugins/vite-plugin-youtrack-app-settings.js';
export { default as youtrackAutoUpload, type AutoUploadOptions } from './plugins/vite-plugin-youtrack-auto-upload.js';
export { default as youtrackDevHtml, type DevHtmlOptions } from './plugins/vite-plugin-youtrack-dev-html.js';
export { default as backendReloadPlugin } from './plugins/vite-plugin-backend-reload.js';

// Types public surface
export * from './types/index.js';

// Utilities
export { withPermissions } from './utility/withPermissions.js';
