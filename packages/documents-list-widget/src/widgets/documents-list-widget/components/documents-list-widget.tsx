import React, { useCallback } from 'react';
import Config from './configuration/config';
import Content from './content/content';
import ConfigurableWidget from '../hub-widget-ui/configurable-widget/configurable-widget';
import useRefreshTimer from '../hub-widget-ui/timer/timer/useRefreshTimer';
import { i18n } from '@jetbrains/youtrack-apps-tools/dist/lib/i18n/i18n';
import WidgetContext from '../widget-context';
import {DEFAULT_REFRESH_PERIOD_SEC, useWidget} from '../hooks/useWidget';

const DocumentsListWidget = () => {
    const {
        api,
        appsApi,
        isRegistered,
        isConfiguring,
        setIsConfiguring,
        refreshKey,
        config,
        isLoading,
        forceRefresh,
        onConfigSubmit,
        onConfigCancel
    } = useWidget();

    useRefreshTimer({
        onTick: forceRefresh,
        // eslint-disable-next-line no-magic-numbers
        tickPeriod: (config.refreshPeriod ?? DEFAULT_REFRESH_PERIOD_SEC) * 1000,
    });

    const Configuration = useCallback(
        () => (
          <Config
            title={config.title}
            tabs={config.tabs}
            refreshPeriod={config.refreshPeriod}
            isLoading={isLoading}
            onSubmit={onConfigSubmit}
            onCancel={onConfigCancel}
          />
        ),
        [config, isLoading, onConfigSubmit, onConfigCancel]
    );

    const widgetContent = useCallback(
        () => (
          <Content
            key={refreshKey}
            tabs={config.tabs}
            editable
            onEdit={() => setIsConfiguring(true)}
          />
        ),
        [refreshKey, config.tabs, setIsConfiguring]
    );

    if (!isRegistered || !api || !appsApi) {
        return null;
    }

    const widgetTitle = isConfiguring ? i18n('Documents List') : config.title;

    return (
      <WidgetContext.Provider value={{api, appsApi}}>
        <ConfigurableWidget
          isConfiguring={isConfiguring}
          dashboardApi={appsApi}
          widgetTitle={widgetTitle}
          Configuration={Configuration}
          Content={widgetContent}
        />
      </WidgetContext.Provider>
    );
};

export default DocumentsListWidget;
