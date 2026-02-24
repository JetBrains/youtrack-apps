---
to: "src/api/index.ts"
---
import {type HostAPI} from '../../@types/globals';
import {type ApiRouter} from './api';
import {appId} from '../app-id';
import {createApiLogger} from '../common/utils/logger';
import {createApi as createApiBase} from '@jetbrains/youtrack-enhanced-dx-tools/api';

export const createApi = <T extends ApiRouter>(host: HostAPI) => {
  return createApiBase<T>(host, {
    appId,
    loggerFactory: (scope) => createApiLogger(scope),
    // Only validate in dev builds — tree-shakes api.zod.ts out of production bundles
    zodImport: import.meta.env.DEV ? () => import('./api.zod') : undefined
  });
};
