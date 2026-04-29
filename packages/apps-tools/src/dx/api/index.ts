type Logger = {
  debug: (message: string, meta?: Record<string, unknown>, payload?: unknown) => void;
  warn: (message: string, meta?: Record<string, unknown>, payload?: unknown) => void;
  error: (message: string, meta?: Record<string, unknown>, payload?: unknown) => void;
};

type LoggerFactory = (scope: string) => Logger;

type HostRequestOptions = {
  method: string;
  body?: unknown;
  query?: unknown;
  scope?: boolean;
};

type HostAPI = {
  fetchApp: (path: string, options: HostRequestOptions) => Promise<unknown>;
  fetchYouTrack: (path: string, options: HostRequestOptions) => Promise<unknown>;
};

type Validator = {
  parse: (value: unknown) => void;
};

interface SchemaTree {
  [key: string]: SchemaTree | Validator | undefined;
}

type ZodImport = () => Promise<{ schema: SchemaTree }>;

export type ApiCreateOptions = {
  appId: string;
  loggerFactory?: LoggerFactory;
  zodImport?: ZodImport;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSchemaTree = (value: unknown): value is SchemaTree =>
  isRecord(value) && typeof value.parse !== 'function';

const isValidator = (value: unknown): value is Validator =>
  isRecord(value) && typeof value.parse === 'function';

const validate = async (
  routePath: string[],
  method: string,
  data: unknown,
  type: 'Req' | 'Res',
  loggerFactory?: LoggerFactory,
  zodImport?: ZodImport
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

    let current: SchemaTree | undefined = zodSchemas.schema;
    for (const segment of routePath) {
      const next: SchemaTree | Validator | undefined = current?.[segment];
      if (!isSchemaTree(next)) {
        return;
      }
      current = next;
    }

    const methodSchemas: SchemaTree | Validator | undefined = current?.[method];

    if (isSchemaTree(methodSchemas)) {
      const validator = methodSchemas[type];
      if (isValidator(validator)) {
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
  data: unknown
) => {
  const dataRecord = isRecord(data) ? data : undefined;
  const hasProjectId = !!dataRecord && 'projectId' in dataRecord;
  const hasIssueId = !!dataRecord && 'issueId' in dataRecord;

  if (hasProjectId && dataRecord) {
    const { projectId, ...restData } = dataRecord;
    const fetchOptions: HostRequestOptions = { method };

    if (method === 'GET' || method === 'DELETE') {
      fetchOptions.query = restData;
    } else if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = restData;
    }

    return await host.fetchYouTrack(
      `admin/projects/${String(projectId)}/extensionEndpoints/${appId}/${routePath.join('/')}`,
      fetchOptions
    );
  }

  if (hasIssueId && dataRecord) {
    const { issueId, ...restData } = dataRecord;
    const fetchOptions: HostRequestOptions = { method };

    if (method === 'GET' || method === 'DELETE') {
      fetchOptions.query = restData;
    } else if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = restData;
    }

    return await host.fetchYouTrack(
      `issues/${String(issueId)}/extensionEndpoints/${appId}/${routePath.join('/')}`,
      fetchOptions
    );
  }

  const needsScope = routePath[0] !== 'global';
  const fetchOptions: HostRequestOptions = { method };

  if (method === 'GET' || method === 'DELETE') {
    fetchOptions.query = data;
  } else if (method === 'POST' || method === 'PUT') {
    fetchOptions.body = data;
  }

  if (needsScope) {
    fetchOptions.scope = true;
  }

  return await host.fetchApp(routePath.join('/'), fetchOptions);
};

const createApiProxy = (host: HostAPI, appId: string, loggerFactory: LoggerFactory | undefined, zodImport: ZodImport | undefined, routePath: string[]): unknown => {
  return new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === 'GET' || prop === 'POST' || prop === 'PUT' || prop === 'DELETE') {
          const method = prop as 'GET' | 'POST' | 'PUT' | 'DELETE';
          return async (data: unknown) => {
            // GET/DELETE have no body — callers may omit args entirely; normalise to {} so
            // Zod schemas (z.object with all-optional fields) validate correctly.
            const normalizedData = (method === 'GET' || method === 'DELETE') && data === undefined ? {} : data;
            await validate(routePath, method, normalizedData, 'Req', loggerFactory, zodImport);
            const response = await routeApiCall(host, appId, routePath, method, normalizedData);
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
