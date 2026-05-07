/**
 * Vitest setup file: redirect the YouTrack scripting HTTP API to a local stub
 * so that workflow files can be loaded and tested without the YouTrack runtime.
 *
 * Module._resolveFilename is Node's internal resolution hook.  We patch it
 * once, before any test file is processed, so every CJS require() that asks
 * for '@jetbrains/youtrack-scripting-api/http' gets our stub instead.
 */
import Module from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const YOUTRACK_HTTP_STUB = resolve(__dirname, 'mocks/youtrack-http.cjs');

const _originalResolve = Module._resolveFilename.bind(Module);
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === '@jetbrains/youtrack-scripting-api/http') {
    return YOUTRACK_HTTP_STUB;
  }
  return _originalResolve(request, parent, isMain, options);
};