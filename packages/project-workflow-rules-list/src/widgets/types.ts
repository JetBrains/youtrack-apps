export interface Repository {
  url: string;
  isDefault: boolean;
}

export interface GlobalConfig {
  enabled: boolean;
  missingRequiredSettings: boolean;
}

export interface App {
  id: string;
  name: string;
  icon: string | null;
  title: string;
  globalConfig: GlobalConfig;
  $type: string;
}

export interface Configuration {
  isActive: boolean;
  enabled: boolean;
  missingRequiredSettings: boolean;
  app: App;
  $type: string;
}

export interface PluggableObject {
  id: string;
  typeAlias: string;
  name: string;
  title: string;
  $type: string;
}

export interface PluggableObjectUsage {
  id: string;
  isBroken: boolean;
  enabled: boolean;
  priority: number;
  pluggableObject: PluggableObject;
  configuration: Configuration;
  $type: string;
}
