import React, {useState, useCallback, useMemo} from 'react';
import Tab from '@jetbrains/ring-ui-built/components/tabs/tab';
import {Tabs} from '@jetbrains/ring-ui-built/components/tabs/tabs';
import {Input, Size} from '@jetbrains/ring-ui-built/components/input/input';
import TabConfiguration from './config-tab';
import ConfigurationForm from '../../hub-widget-ui/configuration-form/configuration-form';
import RefreshPeriod from '../../hub-widget-ui/refresh-period/refresh-period';
import {DocumentListTab, useTabsManager} from '../../hooks/useTabsManager';
import {i18n} from '@jetbrains/youtrack-apps-tools/dist/lib/i18n/i18n';
import httpErrorHandler from '../../hub-widget-ui/http-error-handler/http-error-handler';
import {useWidgetContext} from '../../widget-context.ts';

import styles from './config.module.css';

export interface WidgetConfig {
    title?: string;
    tabs: DocumentListTab[];
    refreshPeriod: number;
}

interface Props extends WidgetConfig {
    isLoading: boolean;
    onSubmit: (config: WidgetConfig) => Promise<void>;
    onCancel: () => void;
}

const Config = (props: Props) => {
    const {title, tabs, refreshPeriod, isLoading, onSubmit, onCancel} = props;

    const {api} = useWidgetContext();

    const [widgetTitle, setWidgetTitle] = useState(title);
    const [widgetRefreshPeriod, setWidgetRefreshPeriod] = useState(refreshPeriod);

    const {
        configTabs,
        activeTab,
        addNewTab,
        deleteTab,
        onTabTitleChange,
        onSearchQueryChange,
        onDocumentTypeChange,
        onTabSelect,
        errorMessage,
        setErrorMessage,
    } = useTabsManager(tabs);

    const onWidgetTitleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setWidgetTitle(event.target.value);
    }, []);

    const onClearWidgetTitle = useCallback(() => {
        setWidgetTitle('');
    }, []);

    const onChangeRefreshPeriod = useCallback((newPeriod: number) => {
        setWidgetRefreshPeriod(newPeriod);
    }, []);

    const isConfigInvalid = useMemo(() => {
        return configTabs.some(tab => !tab.title.trim() || !tab.searchQuery.trim());
    }, [configTabs]);

    const renderRefreshPeriod = <RefreshPeriod seconds={widgetRefreshPeriod} onChange={onChangeRefreshPeriod}/>;

    const onSubmitForm = useCallback(async() => {
      try {
        for (const tab of configTabs) {
          if (tab.documentType === 'Issue') {
            await api.loadIssues(tab.searchQuery, 0, 1)
          } else {
            await api.loadArticles(tab.searchQuery, 0, 1)
          }
        }

        await onSubmit({
          title: widgetTitle,
          tabs: configTabs,
          refreshPeriod: widgetRefreshPeriod,
        });
      } catch (error) {
        setErrorMessage(httpErrorHandler.getMessage(error))
      }
    }, [onSubmit, widgetTitle, configTabs, widgetRefreshPeriod, api, setErrorMessage]);

    return (
      <ConfigurationForm
        warning={errorMessage}
        isInvalid={isConfigInvalid || Boolean(errorMessage)}
        isLoading={isLoading}
        panelControls={renderRefreshPeriod}
        onSave={onSubmitForm}
        onCancel={onCancel}
      >
        <Input
          borderless
          required
          size={Size.L}
          placeholder={i18n('Set a custom title for this widget (optional)')}
          value={widgetTitle}
          onClear={onClearWidgetTitle}
          onChange={onWidgetTitleChange}
        />

        <div className={styles.tabConfig}>
          <Tabs selected={activeTab} onSelect={onTabSelect}>
            {configTabs.map((tab, index) => (
              <Tab key={tab.id} id={tab.id} title={tab.title.trim() || `Tab ${index + 1}`}>
                <TabConfiguration
                  tabTitle={tab.title}
                  searchQuery={tab.searchQuery}
                  documentType={tab.documentType}
                  totalTabsCount={configTabs.length}
                  onAddTab={addNewTab}
                  onDeleteTab={() => deleteTab(tab.id)}
                  onTabTitleChange={e => onTabTitleChange(tab.id, e.target.value)}
                  onTabTitleClear={() => onTabTitleChange(tab.id, '')}
                  onSearchQueryChange={query => onSearchQueryChange(tab.id, query)}
                  onDocumentTypeChange={type => onDocumentTypeChange(tab.id, type)}
                  isLoading={isLoading}
                />
              </Tab>
            ))}
          </Tabs>
        </div>
      </ConfigurationForm>
    );
};

export default Config;
