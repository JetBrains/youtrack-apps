import {ClientRequest} from 'http';

export interface Config {
  host: string;
  token: string;
  output: string | null;
  overwrite: string | null;
  manifest: string | null;
  schema: string | null;
  open: string | null;
  json: boolean;
  yaml: boolean;
  yes: boolean;
  project: string | null;
  skip: string | null;
  limit: string | null;
  settings: string | null;
  enabled: string | null;
  field: string | null;
  cwd: string;
}

export type RequiredParams = 'host' | 'token';

export interface AppItem {
  id: string;
  name: string;
}

export interface ResponseData extends ClientRequest {
  error_description: string;
  [key: string]: unknown;
}

export interface ErrorWithStatusCodeAndData extends Error {
  statusCode?: number;
  data?: ResponseData;
}
