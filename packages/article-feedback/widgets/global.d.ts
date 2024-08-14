import type {RequestParams} from '@jetbrains/ring-ui/components/http/http';

export {};

declare global {
  interface YTPluginHost {
    fetchYouTrack: (
      relativeURL: string,
      requestParams?: RequestParams
    ) => Promise<unknown>;
    fetchApp: (
      relativeURL: string,
      requestParams: RequestParams & { scope: boolean }
    ) => Promise<unknown>;
  }

  const YTApp: {
    register: () => Promise<YTPluginHost>;
    entity: {id: string};
  };
}
