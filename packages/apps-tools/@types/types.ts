export interface Config {
  host: string;
  token: string;
  output: string | null;
  cwd: string;
}

export interface AppItem {
  id: string;
  name: string;
}
