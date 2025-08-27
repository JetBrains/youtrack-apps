import {useEffect, useRef, useState, useCallback} from 'react';
import API from '../api';
import type {EmbeddableWidgetAPI} from '../../../../@types/globals';
import type {WidgetConfig} from '../components/configuration/config';
import alertService from '@jetbrains/ring-ui-built/components/alert-service/alert-service';
import type {DocumentListTab} from './useTabsManager';

export const DEFAULT_REFRESH_PERIOD_SEC = 600;

interface YTConfig {
  title?: string;
  tabsConfig: string;
  refreshPeriod: number;
}

const toWidgetConfig = (ytConfig: YTConfig): WidgetConfig => ({
  title: ytConfig.title,
  tabs: JSON.parse(ytConfig.tabsConfig) as DocumentListTab[],
  refreshPeriod: ytConfig.refreshPeriod,
});

const toYTConfig = (widgetConfig: WidgetConfig): YTConfig => ({
  title: widgetConfig.title?.trim(),
  tabsConfig: JSON.stringify(widgetConfig.tabs),
  refreshPeriod: widgetConfig.refreshPeriod,
});

export const useWidget = () => {
  const apiRef = useRef<API | null>(null);
  const appsApiRef = useRef<EmbeddableWidgetAPI | null>(null);

  const [isRegistered, setIsRegistered] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>({
    tabs: [],
    refreshPeriod: DEFAULT_REFRESH_PERIOD_SEC,
  });
  const [editTabId, setEditTabId] = useState<string | undefined>(undefined);

  const refresh = () => setRefreshKey(prev => prev + 1);

  const loadConfig = useCallback(async (): Promise<WidgetConfig | null> => {
    if (!appsApiRef.current) {
      return null;
    }

    const storedConfig = await appsApiRef.current.readConfig<YTConfig>();
    if (!storedConfig?.tabsConfig) {
      return null;
    }
    return toWidgetConfig(storedConfig);
  }, []);

  const saveConfig = useCallback(async (widgetConfig: WidgetConfig): Promise<void> => {
    if (!appsApiRef.current) {
      return;
    }

    await appsApiRef.current.storeConfig(toYTConfig(widgetConfig));
    setConfig(widgetConfig);

    if (widgetConfig.title) {
      await appsApiRef.current.setTitle(widgetConfig.title, '');
    }
    setRefreshKey(0);
    setIsConfiguring(false);
  }, []);

  const onConfigSubmit = useCallback(
    async (newConfig: WidgetConfig) => {
      if (!appsApiRef.current) {
        return;
      }

      setIsLoading(true);
      await appsApiRef.current.clearError();
      await saveConfig(newConfig);
      setEditTabId(undefined);
      setIsLoading(false);
    },
    [saveConfig],
  );

  const onConfigCancel = useCallback(async () => {
    if (!appsApiRef.current) {
      return;
    }

    setIsConfiguring(false);
    setEditTabId(undefined);
    const configuration = await loadConfig();
    if (configuration) {
      setConfig(configuration);
    } else {
      appsApiRef.current.removeWidget();
    }
  }, [loadConfig]);

  const onTabEdit = useCallback((tabId: string) => {
    setEditTabId(tabId);
    setIsConfiguring(true);
  }, []);

  useEffect(() => {
    const register = async () => {
      const host = await YTApp.register({
        onConfigure: () => setIsConfiguring(true),
        onRefresh: refresh,
      });

      apiRef.current = new API(host);
      appsApiRef.current = host as EmbeddableWidgetAPI;

      setIsLoading(true);
      try {
        const storedConfig = await appsApiRef.current.readConfig<YTConfig>();

        if (storedConfig?.tabsConfig) {
          const configuration = toWidgetConfig(storedConfig);
          setConfig(configuration);
        } else {
          setIsConfiguring(true);
          appsApiRef.current.enterConfigMode();
        }
      } catch (e: unknown) {
        alertService.error(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }

      setIsRegistered(true);
    };

    register();
  }, []);

  return {
    api: apiRef.current,
    appsApi: appsApiRef.current,
    isRegistered,
    isConfiguring,
    setIsConfiguring,
    refreshKey,
    config,
    isLoading,
    forceRefresh: refresh,
    onConfigSubmit,
    onConfigCancel,
    editTabId,
    onTabEdit,
  };
};
