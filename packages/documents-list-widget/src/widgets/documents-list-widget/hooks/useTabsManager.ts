import {useState, useCallback} from 'react';
import type {DocumentType} from '../components/configuration/config-tab.tsx';

export interface DocumentListTab {
    id: string;
    title: string;
    searchQuery: string;
    documentType: DocumentType;
}

const createNewTab = (): DocumentListTab => ({
    id: `tab-${crypto.randomUUID()}`,
    title: '',
    documentType: 'Issue',
    searchQuery: '',
});

const initializeTabs = (tabs: DocumentListTab[]) =>
    tabs.length === 0 ? [createNewTab()] : tabs.map(tab => ({...tab}));

export const useTabsManager = (initialTabs: DocumentListTab[]) => {
    const [configTabs, setConfigTabs] = useState<DocumentListTab[]>(() => initializeTabs(initialTabs));
    const [activeTab, setActiveTab] = useState(configTabs[0].id);

    const addNewTab = useCallback(() => {
        const newTab = createNewTab();
        setConfigTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTab(newTab.id);
    }, []);

    const deleteTab = useCallback((tabToDelete: string) => {
        setConfigTabs(prevTabs => {
            const updatedTabs = prevTabs.filter(tab => tab.id !== tabToDelete);

            const deletedTabIdx = prevTabs.findIndex(tab => tab.id === tabToDelete);
            const newActiveTabIdx = deletedTabIdx === prevTabs.length - 1 ? deletedTabIdx - 1 : deletedTabIdx;
            setActiveTab(updatedTabs[newActiveTabIdx].id);

            return updatedTabs;
        });
    }, []);

    const updateTab = useCallback((tabId: string, update: Partial<DocumentListTab>) => {
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
    };
};
