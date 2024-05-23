import type {RequestParams} from '@jetbrains/ring-ui/components/http/http';

export {};

declare global {
  interface YTPluginHost {
    fetchYouTrack: (
      relativeURL: string,
      requestParams?: RequestParams
    ) => unknown;
    fetchApp: (
      relativeURL: string,
      requestParams: RequestParams & { scope: boolean }
    ) => unknown;
  }

  const YTApp: {
    register: () => Promise<YTPluginHost>;
    entity: {id: string};
  };
}
