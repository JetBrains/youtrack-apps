import {useState, useCallback} from 'react';
import type {DocumentType} from '../components/configuration/config-tab.tsx';

export interface DocumentListTab {
  id: string;
  title: string;
  searchQuery: string;
  documentType: DocumentType;
}

const createNewTab = (index: number): DocumentListTab => ({
  id: `tab-${crypto.randomUUID()}`,
  title: `Tab ${index + 1}`,
  documentType: 'Issue',
  searchQuery: '',
});

const initializeTabs = (tabs: DocumentListTab[]) =>
  tabs.length === 0 ? [createNewTab(0)] : tabs.map(tab => ({...tab}));

export const useTabsManager = (initialTabs: DocumentListTab[], activeEditTab?: string) => {
  const [configTabs, setConfigTabs] = useState<DocumentListTab[]>(() => initializeTabs(initialTabs));
  const [activeTab, setActiveTab] = useState(() => {
    if (activeEditTab && configTabs.some(tab => tab.id === activeEditTab)) {
      return activeEditTab;
    }
    return configTabs[0].id;
  });
  const [errorMessage, setErrorMessage] = useState('');

  const addNewTab = useCallback(() => {
    setErrorMessage('');
    setConfigTabs(prevTabs => {
      const newTab = createNewTab(prevTabs.length);
      setActiveTab(newTab.id);
      return [...prevTabs, newTab]
    });
  }, []);

  const deleteTab = useCallback((tabToDelete: string) => {
    setErrorMessage('');
    setConfigTabs(prevTabs => {
      const updatedTabs = prevTabs.filter(tab => tab.id !== tabToDelete);

      const deletedTabIdx = prevTabs.findIndex(tab => tab.id === tabToDelete);
      const newActiveTabIdx = deletedTabIdx === prevTabs.length - 1 ? deletedTabIdx - 1 : deletedTabIdx;
      setActiveTab(updatedTabs[newActiveTabIdx].id);

      return updatedTabs;
    });
  }, []);

  const updateTab = useCallback((tabId: string, update: Partial<DocumentListTab>) => {
    setErrorMessage('');
    setConfigTabs(prevTabs => prevTabs.map(tab => (tab.id === tabId ? {...tab, ...update} : tab)));
  }, []);

  const onTabTitleChange = useCallback(
    (tabId: string, newTitle: string) => {
      updateTab(tabId, {title: newTitle});
    },
    [updateTab],
  );

  const onSearchQueryChange = useCallback(
    (tabId: string, newQuery: string) => {
      updateTab(tabId, {searchQuery: newQuery});
    },
    [updateTab],
  );

  const onDocumentTypeChange = useCallback(
    (tabId: string, newType: DocumentType) => {
      updateTab(tabId, {documentType: newType});
    },
    [updateTab],
  );

  const onTabSelect = useCallback((selectedTab: string) => {
    setActiveTab(selectedTab);
  }, []);

  return {
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
  };
};
