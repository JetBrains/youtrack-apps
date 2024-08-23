import {ClientRequest} from 'http';

export interface Config {
  host: string;
  token: string;
  output: string | null;
  overwrite: string | null;
  cwd: string;
}

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
