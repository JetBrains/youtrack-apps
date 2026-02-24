type Logger = {
  debug: (message: string, meta?: Record<string, unknown>, payload?: unknown) => void;
  warn: (message: string, meta?: Record<string, unknown>, payload?: unknown) => void;
  error: (message: string, meta?: Record<string, unknown>, payload?: unknown) => void;
};

type LoggerFactory = (scope: string) => Logger;

type HostAPI = {
  fetchApp: (path: string, options: { method: string; body?: any; query?: any; scope?: boolean }) => Promise<any>;
  fetchYouTrack: (path: string, options: { method: string; body?: any; query?: any }) => Promise<any>;
};

export type ApiCreateOptions = {
  appId: string;
  loggerFactory?: LoggerFactory;
  zodImport?: () => Promise<{ schema: any }>;
};

const validate = async (
  routePath: string[],
  method: string,
  data: unknown,
  type: 'Req' | 'Res',
  loggerFactory?: LoggerFactory,
  zodImport?: () => Promise<{ schema: any }>
) => {
  // if (process.env.NODE_ENV !== 'development') {
  //   return;
  // }
  if (!zodImport) {
    return; // Skip validation if no zod import provided
  }
  const logger = loggerFactory ? loggerFactory('validation') : undefined;
  try {

    const zodSchemas = await zodImport();

    let current = zodSchemas.schema;
    for (const segment of routePath) {
      if (current && current[segment]) {
        current = current[segment];
      } else {
        return;
      }
    }

    const methodSchemas = current?.[method];

    if (methodSchemas && methodSchemas[type]) {
      const validator = methodSchemas[type] as { parse: (v: unknown) => void } | undefined;
      if (validator) {
        logger?.debug('', { action: `${method}-${type}` }, data);
        validator.parse(data);
      } else {
        logger?.warn('No validator found', { action: 'validation-missing', path: routePath.join('/'), method, type });
      }
    } else {
      logger?.warn('No method schemas found', { action: 'schema-missing', method, type });
    }
  } catch (e) {
    const logger = loggerFactory ? loggerFactory('validation') : undefined;
    logger?.error('Zod validation failed', { action: 'validation-error', path: routePath.join('/'), method, type }, e as Error);
  }
};

const routeApiCall = async (
  host: HostAPI,
  appId: string,
  routePath: string[],
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data: unknown,
  loggerFactory?: LoggerFactory
) => {
  const logger = loggerFactory ? loggerFactory('routing') : undefined;

  const hasProjectId = data && typeof data === 'object' && 'projectId' in (data as any);
  const hasIssueId = data && typeof data === 'object' && 'issueId' in (data as any);

  if (hasProjectId) {
    const { projectId, ...restData } = data as any;
    const fetchOptions: any = { method };

    if (method === 'GET' || method === 'DELETE') {
      fetchOptions.query = restData;
    } else if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = restData;
    }

    return await host.fetchYouTrack(
      `admin/projects/${projectId}/extensionEndpoints/${appId}/${routePath.join('/')}`,
      fetchOptions
    );
  }

  if (hasIssueId) {
    const { issueId, ...restData } = data as any;
    const fetchOptions: any = { method };

    if (method === 'GET' || method === 'DELETE') {
      fetchOptions.query = restData;
    } else if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = restData;
    }

    return await host.fetchYouTrack(
      `issues/${issueId}/extensionEndpoints/${appId}/${routePath.join('/')}`,
      fetchOptions
    );
  }

  const needsScope = routePath[0] !== 'global';
  const fetchOptions: any = { method };

  if (method === 'GET' || method === 'DELETE') {
    fetchOptions.query = data;
  } else if (method === 'POST' || method === 'PUT') {
    fetchOptions.body = JSON.stringify(data);
  }

  if (needsScope) {
    fetchOptions.scope = true;
  }

  return await host.fetchApp(routePath.join('/'), fetchOptions);
};

const createApiProxy = (host: HostAPI, appId: string, loggerFactory: LoggerFactory | undefined, zodImport: (() => Promise<{ schema: any }>) | undefined, routePath: string[]): unknown => {
  return new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === 'GET' || prop === 'POST' || prop === 'PUT' || prop === 'DELETE') {
          const method = prop as 'GET' | 'POST' | 'PUT' | 'DELETE';
          return async (data: unknown) => {
            await validate(routePath, method, data, 'Req', loggerFactory, zodImport);
            const response = await routeApiCall(host, appId, routePath, method, data, loggerFactory);
            await validate(routePath, method, response, 'Res', loggerFactory, zodImport);
            return response;
          };
        }
        return createApiProxy(host, appId, loggerFactory, zodImport, [...routePath, prop]);
      }
    }
  );
};

export const createApi = <T>(host: HostAPI, options: ApiCreateOptions) => {
  return createApiProxy(host, options.appId, options.loggerFactory, options.zodImport, []) as T;
};


