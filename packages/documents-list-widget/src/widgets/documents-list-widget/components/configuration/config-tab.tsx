import type {ChangeEvent} from 'react';
import React, {useCallback} from 'react';
import Select from '@jetbrains/ring-ui-built/components/select/select';
import {Input, Size} from '@jetbrains/ring-ui-built/components/input/input';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import QueryAssist from '@jetbrains/ring-ui-built/components/query-assist/query-assist';
import type {
    QueryAssistChange,
    QueryAssistRequestParams,
    QueryAssistResponse,
} from '@jetbrains/ring-ui-built/components/query-assist/query-assist';
import {useDebounce} from '../../hooks/useDebounce';
import {useWidgetContext} from '../../widget-context.ts';
import {i18n} from '@lib/i18n/i18n';
import styles from './config.module.css';


export type DocumentType = 'Issue' | 'Article';

interface DocumentTypeOption {
    key: DocumentType;
    label: string;
}

interface Props {
    tabTitle: string;
    onAddTab: () => void;
    onDeleteTab: () => void;
    onTabTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onTabTitleClear: () => void;
    totalTabsCount: number;

    searchQuery: string;
    onSearchQueryChange: (query: string) => void;

    documentType: DocumentType;
    onDocumentTypeChange: (type: DocumentType) => void;

    isLoading: boolean;
}

const TabConfiguration = (props: Props) => {
    const {
        tabTitle,
        onAddTab,
        onDeleteTab,
        onTabTitleChange,
        onTabTitleClear,
        totalTabsCount,
        searchQuery,
        onSearchQueryChange,
        documentType,
        onDocumentTypeChange,
        isLoading,
    } = props;

    const {api} = useWidgetContext();
    const underlineAndSuggestDebouncer = useDebounce();

    const documentTypes: DocumentTypeOption[] = [
        {key: 'Issue', label: i18n('Issue')},
        {key: 'Article', label: i18n('Article')},
    ];

    const selected = documentTypes.find(it => it.key === documentType) as DocumentTypeOption;

    const onDocumentTypeSelect = useCallback(
        (option: DocumentTypeOption | null) => {
            if (option) {
                onDocumentTypeChange(option.key);
            }
        },
        [onDocumentTypeChange],
    );

    const underlineAndSuggest = useCallback(
        async (query: string, caret: number): Promise<QueryAssistResponse> => {
            return underlineAndSuggestDebouncer(() => api.underlineAndSuggest(query, caret));
        },
        [api, underlineAndSuggestDebouncer],
    );

    const queryAssistDataSource = useCallback(
        async (params: QueryAssistRequestParams): Promise<QueryAssistResponse> => {
            return underlineAndSuggest(params.query, params.caret);
        },
        [underlineAndSuggest],
    );

    const onQueryAssistInputChange = useCallback(
        (change: QueryAssistChange) => {
            onSearchQueryChange(change.query);
        },
        [onSearchQueryChange],
    );

    return (
      <div className={styles.tabConfigItem}>
        <Input
          borderless
          required
          label={i18n('Tab name')}
          placeholder={i18n('Enter a name for this tab')}
          value={tabTitle}
          onClear={onTabTitleClear}
          onChange={onTabTitleChange}
        />

        <div className={styles.documentSearch}>
          <Select
            selectedLabel={i18n('Document type')}
            size={Size.S}
            type={Select.Type.BUTTON}
            data={documentTypes}
            selected={selected}
            onSelect={onDocumentTypeSelect}
          />

          <QueryAssist
            disabled={isLoading}
            query={searchQuery}
            placeholder={i18n('Enter search request')}
            onChange={onQueryAssistInputChange}
            dataSource={queryAssistDataSource}
          />
        </div>

        <div className={styles.btnContainer}>
          <div>
            <Button primary onClick={onAddTab} className={styles.newTabConfig}>
              {i18n('Add another tab')}
            </Button>
          </div>

          {totalTabsCount > 1 && (
            <div>
              <Button onClick={onDeleteTab} danger>
                {i18n('Remove this tab')}
              </Button>
            </div>
                )}
        </div>
      </div>
    );
};

export default TabConfiguration;
