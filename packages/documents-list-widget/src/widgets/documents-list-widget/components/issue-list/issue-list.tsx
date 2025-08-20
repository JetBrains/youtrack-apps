import React, {useCallback, useEffect, useState} from 'react';
import type {DateFormats, Issue} from './types/issue-types';
import IssueLine from './issue-line/issue-line';
import DocumentList from '../documents-list/document-list';
import {COUNTER_DELAY_MS} from '../content/content';
import {useWidgetContext} from '../../widget-context.ts';
import {i18n} from '@jetbrains/youtrack-apps-tools/dist/lib/i18n/i18n';

interface Props {
    tabId: string;
    searchQuery: string;
    dateFormats?: DateFormats;
    packSize: number;
    onCountUpdate: (tabId: string, count: number) => void;
    editable: boolean;
    onEdit: () => void;
}

const IssueList = (props: Props) => {
    const {
        tabId,
        searchQuery,
        dateFormats: defaultDateFormats = {
            datePattern: 'MMM D, YYYY',
            dateTimePattern: 'MMM D, YYYY h:mm A',
        },
        packSize,
        onCountUpdate,
        editable,
        onEdit,
    } = props;

    const {api} = useWidgetContext();

    const [issues, setIssues] = useState<Issue[]>([]);
    const [issuesCount, setIssuesCount] = useState(0);
    const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
    const [dateFormats, setDateFormats] = useState<DateFormats>(defaultDateFormats);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            try {
                const [fetchedIssues, fetchedCount, fetchedDateFormats] = await Promise.all([
                    api.loadIssues(searchQuery, 0, packSize),
                    api.loadIssuesCount(searchQuery),
                    api.loadDateFormats(),
                ]);

                if (fetchedCount === -1) {
                    setTimeout(async () => {
                        const retryCount = await api.loadIssuesCount(searchQuery);
                        setIssuesCount(retryCount);
                        onCountUpdate(tabId, retryCount);
                    }, COUNTER_DELAY_MS);
                }

                setIssues(fetchedIssues);
                setIssuesCount(fetchedCount);
                setDateFormats({
                    datePattern: fetchedDateFormats.datePattern ?? defaultDateFormats.datePattern,
                    dateTimePattern: fetchedDateFormats.dateTimePattern ?? defaultDateFormats.dateTimePattern,
                });

                onCountUpdate(tabId, fetchedCount);
            } catch {
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [searchQuery, packSize, api, onCountUpdate, tabId, defaultDateFormats.datePattern, defaultDateFormats.dateTimePattern]);

    const onLoadMoreIssues = useCallback(async () => {
        setIsLoadingMore(true);

        const moreIssues = await api.loadIssues(searchQuery, issues.length, packSize);
        setIssues(prev => [...prev, ...moreIssues]);

        setIsLoadingMore(false);
    }, [searchQuery, issues.length, packSize, api]);

    const onExpandIssue = (issueId: string) => () => {
        setExpandedIssueId(prev => (prev === issueId ? null : issueId));
    };

    const renderIssue = useCallback(
        (issue: Issue) => (
          <IssueLine
            issue={issue}
            expanded={expandedIssueId === issue.id}
            dateFormats={dateFormats}
            onClick={onExpandIssue(issue.id)}
          />
        ),
        [expandedIssueId, dateFormats],
    );

    return (
      <DocumentList
        documents={issues}
        totalDocumentCount={issuesCount}
        renderDocuments={renderIssue}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMoreIssues}
        editable={editable}
        onEdit={onEdit}
        error={error}
        emptyMessage={i18n('No issues found')}
      />
    );
};

export default IssueList;
