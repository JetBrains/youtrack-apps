import React, {useState, useCallback, useEffect} from 'react';
import {Tabs} from '@jetbrains/ring-ui-built/components/tabs/tabs';
import Tab from '@jetbrains/ring-ui-built/components/tabs/tab';
import ArticleList from '../article-list/article-list';
import IssueList from '../issue-list/issue-list';
import CounterTabTitle from '../counter-tab-title/counter-tab-title';
import {DocumentListTab, useTabsManager} from '../../hooks/useTabsManager';
import {DOCUMENTS_PACK_SIZE, SINGLE_VIEW_PACK_SIZE} from '../../api';
import {useWidgetContext} from '../../widget-context';

import styles from './content.module.css';

export const COUNTER_DELAY_MS = 30000;

interface Props {
  tabs: DocumentListTab[];
  editable: boolean;
  onTabEdit: (tabId: string) => void;
}

const Content = ({tabs, editable, onTabEdit}: Props) => {
  const {api} = useWidgetContext();
  const {activeTab, onTabSelect} = useTabsManager(tabs);

  const [tabCounters, setTabCounters] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateTabCounter = useCallback((tabId: string, count: number) => {
    setTabCounters(prev => ({...prev, [tabId]: count}));
  }, []);

  useEffect(() => {
    if (tabs.length === 1) {
      return;
    }

    const fetchCount = async (tab: DocumentListTab) => {
      return tab.documentType === 'Issue'
        ? await api.loadIssuesCount(tab.searchQuery)
        : await api.loadArticlesCount(tab.searchQuery);
    };

    const loadTabCounters = async () => {
      setIsLoading(true);

      const promises = tabs.slice(1).map(async tab => {
        const fetchedCount = await fetchCount(tab);
        updateTabCounter(tab.id, fetchedCount);

        if (fetchedCount === -1) {
          setTimeout(async () => {
            const retryCount = await fetchCount(tab);
            updateTabCounter(tab.id, retryCount);
          }, COUNTER_DELAY_MS);
        }
      });

      await Promise.all(promises);
      setIsLoading(false);
    };

    loadTabCounters();
  }, [tabs, api, updateTabCounter]);

  const packSize = tabs.length === 1 ? SINGLE_VIEW_PACK_SIZE : DOCUMENTS_PACK_SIZE;

  const renderDocumentsList = (tab: DocumentListTab) => {
    const commonProps = {
      tabId: tab.id,
      searchQuery: tab.searchQuery,
      onCountUpdate: updateTabCounter,
      editable,
      onTabEdit: () => onTabEdit(tab.id),
      packSize,
    };

    return tab.documentType === 'Issue' ? <IssueList {...commonProps}/> : <ArticleList {...commonProps}/>;
  };

  return (
    <div className={styles.tabsContainer}>
      {tabs.length === 1 ? (
        renderDocumentsList(tabs[0])
      ) : (
        <Tabs selected={activeTab} onSelect={onTabSelect}>
          {tabs.map(tab => {
            const counter = tabCounters[tab.id] || 0;
            const loading = tabCounters[tab.id] === -1 || isLoading;

            return (
              <Tab
                key={tab.id}
                id={tab.id}
                title={<CounterTabTitle title={tab.title} counter={counter} loading={loading}/>}
              >
                {activeTab === tab.id && renderDocumentsList(tab)}
              </Tab>
            );
          })}
        </Tabs>
      )}
    </div>
  );
};

export default Content;
