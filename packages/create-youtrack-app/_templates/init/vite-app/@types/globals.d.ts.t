---
 to: '@types/globals.d.ts'
---
type AppAPI = {
  onRefresh?: () => void;
  onConfigure?: () => void;
}

import type AlertService from '@jetbrains/ring-ui-built/components/alert-service/alert-service';
import type {RequestParams} from '@jetbrains/ring-ui-built/components/http/http';

export interface HubService {
  id: string;
  applicationName: string;
  homeUrl: string;
}

interface BaseAPILayer {
  alert: (...args: Parameters<(typeof AlertService)['addAlert']>) => void;
  enterModalMode: () => void;
  exitModalMode: () => void;
  collapse: () => void;
}

/*
 * This layer should allow plugin to call YT endpoints while being sure there is just ONE YouTrack instance
 */
export interface InstanceAwareAPILayer extends BaseAPILayer {
  fetchYouTrack: <T = unknown>(relativeURL: string, requestParams?: RequestParams) => Promise<T>;
}

/*
 * This layer allows plugin to communicate with own backend
 */
export interface PluginEndpointAPILayer extends InstanceAwareAPILayer {
  fetchApp: <T = unknown>(relativeURL: string, requestParams?: RequestParams & {scope?: boolean}) => Promise<T>;
}

/*
 * This layer is only available for MARKDOWN and DASHBOARD_WIDGET extension points
 */
export interface EmbeddableWidgetAPI extends PluginEndpointAPILayer {
  setTitle: (label: string, labelUrl: string) => void;
  setLoadingAnimationEnabled: (isEnabled: boolean) => void;

  enterConfigMode: () => void;
  exitConfigMode: () => void;

  setError: (e: Error) => void;
  clearError: () => void;

  readCache: <T = unknown>() => Promise<T | null>;
  storeCache: (data: unknown) => Promise<void>;

  readConfig: <T = unknown>() => Promise<T | null>;
  storeConfig: (config: unknown) => Promise<void>;

  downloadFile: (serviceID: string, relativeURL: string, requestParams: unknown, fileName?: string) => Promise<void>;
  fetchHub: (relativeURL: string, requestParams: RequestParams) => unknown;

  loadServices: (applicationName: string) => Promise<HubService[]>;

  alert: (...args: Parameters<(typeof AlertService)['addAlert']>) => void;
  removeWidget: () => void;
}

export type HostAPI = PluginEndpointAPILayer;


type YTAppInterface = {
  locale: string;
  entity?: {
    id: string;
    type: 'user' | 'article' | 'ticket' | 'project' | 'app'
  };
  register: (appApi?: AppAPI) => HostAPI | EmbeddableWidgetAPI;
}

declare global {
  const YTApp: YTAppInterface;
}
