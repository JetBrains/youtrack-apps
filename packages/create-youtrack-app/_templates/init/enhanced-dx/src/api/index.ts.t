---
to: "src/api/index.ts"
---
import {type HostAPI} from '../../@types/globals';
import {type ApiRouter} from './api';
import {type ZodSchema} from 'zod';
import {appId} from '../app-id';
import {createApiLogger} from '../common/utils/logger';

const validate = async (
    path: string[],
    method: string,
    data: unknown,
    type: 'Req' | 'Res'
) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  const logger = createApiLogger('validation');
  try {
    const zodSchemas = await import('./api.zod') as any;

    // Navigate through the nested schema structure
    let current = zodSchemas.schema;
    for (const segment of path) {
      if (current && current[segment]) {
        current = current[segment];
      } else {
        // Path not found in schema, skip validation
        return;
      }
    }

    // Get the validator for the specific method and type
    const methodSchemas = current?.[method];

    if (methodSchemas && methodSchemas[type]) {
      const validator = methodSchemas[type] as ZodSchema | undefined;
      if (validator) {
        logger.debug('', { action: `${method}-${type}` }, data);
        validator.parse(data);
      } else {
        logger.warn('No validator found', { action: 'validation-missing', path: path.join('/'), method, type });
      }
    } else {
      logger.warn('No method schemas found', { action: 'schema-missing', method, type });
    }
  } catch (e) {
    logger.error('Zod validation failed', { action: 'validation-error', path: path.join('/'), method, type }, e);
  }
};

// Helper function to route API calls based on projectId/issueId presence
const routeApiCall = async (
    host: HostAPI,
    path: string[],
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data: unknown
) => {
  const logger = createApiLogger('routing');

  // Cross-context calls (explicit IDs)
  const hasProjectId = data && typeof data === 'object' && 'projectId' in data;
  const hasIssueId = data && typeof data === 'object' && 'issueId' in data;

  if (hasProjectId) {
    // Route through YouTrack project extension API
    const { projectId, ...restData } = data as any;
    const fetchOptions: any = { method };

    if (method === 'GET' || method === 'DELETE') {
      fetchOptions.query = restData;
    } else if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = restData;
    }

    return await host.fetchYouTrack(
        `admin/projects/${projectId}/extensionEndpoints/${appId}/${path.join('/')}`,
        fetchOptions
    );
  }

  if (hasIssueId) {
    // Route through YouTrack issue extension API
    const { issueId, ...restData } = data as any;
    const fetchOptions: any = { method };

    if (method === 'GET' || method === 'DELETE') {
      fetchOptions.query = restData;
    } else if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = restData;
    }

    return await host.fetchYouTrack(
        `issues/${issueId}/extensionEndpoints/${appId}/${path.join('/')}`,
        fetchOptions
    );
  }

  // Context-aware calls (scope-based)
  const needsScope = path[0] !== 'global';
  const fetchOptions: any = { method };

  if (method === 'GET' || method === 'DELETE') {
    fetchOptions.query = data;
  } else if (method === 'POST' || method === 'PUT') {
    fetchOptions.body = JSON.stringify(data);
  }

  if (needsScope) {
    fetchOptions.scope = true;
  }

  return await host.fetchApp(path.join('/'), fetchOptions);
};

const createApiProxy = (host: HostAPI, path: string[]): unknown => {
  return new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          if (prop === 'GET' || prop === 'POST' || prop === 'PUT' || prop === 'DELETE') {
            const method = prop as 'GET' | 'POST' | 'PUT' | 'DELETE';
            return async (data: unknown) => {
              await validate(path, method, data, 'Req');
              const response = await routeApiCall(host, path, method, data);
              await validate(path, method, response, 'Res');
              return response;
            };
          }
          return createApiProxy(host, [...path, prop]);
        }
      }
  );
};


export const createApi = <T extends ApiRouter>(host: HostAPI) => {
  return createApiProxy(host, []) as T;
};
