import React, {useCallback, useEffect, useState} from 'react';
import type {Article} from './article-line/article-line';
import ArticleItem from './article-line/article-line';
import DocumentList from '../documents-list/document-list';
import {COUNTER_DELAY_MS} from '../content/content';
import {useWidgetContext} from '../../widget-context';
import {i18n} from '@jetbrains/youtrack-apps-tools/dist/lib/i18n/i18n';

interface Props {
  tabId: string;
  searchQuery: string;
  packSize: number;
  onCountUpdate: (tabId: string, count: number) => void;
  editable: boolean;
  onTabEdit: () => void;
}

const ArticleList = (props: Props) => {
  const {tabId, searchQuery, packSize, onCountUpdate, editable, onTabEdit} = props;

  const {api} = useWidgetContext();

  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesCount, setArticlesCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const [fetchedArticles, fetchedCount] = await Promise.all([
          api.loadArticles(searchQuery, 0, packSize),
          api.loadArticlesCount(searchQuery),
        ]);

        if (fetchedCount === -1) {
          setTimeout(async () => {
            const retryCount = await api.loadArticlesCount(searchQuery);
            setArticlesCount(retryCount);
            onCountUpdate(tabId, retryCount);
          }, COUNTER_DELAY_MS);
        }

        setArticles(fetchedArticles);
        setArticlesCount(fetchedCount);

        onCountUpdate(tabId, fetchedCount);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, packSize, api, onCountUpdate, tabId]);

  const onLoadMoreArticles = useCallback(async () => {
    setIsLoadingMore(true);

    const moreArticles = await api.loadArticles(searchQuery, articles.length, packSize);
    setArticles(prev => [...prev, ...moreArticles]);

    setIsLoadingMore(false);
  }, [searchQuery, articles.length, packSize, api]);

  const renderArticle = useCallback((article: Article) => <ArticleItem article={article}/>, []);

  return (
    <DocumentList
      documents={articles}
      totalDocumentCount={articlesCount}
      renderDocuments={renderArticle}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMoreArticles}
      editable={editable}
      onTabEdit={onTabEdit}
      error={error}
      emptyMessage={i18n('No articles found')}
    />
  );
};

export default ArticleList;
