import React from 'react';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import Link from '@jetbrains/ring-ui-built/components/link/link';
import EmptyWidget, {EmptyWidgetFaces} from '../../hub-widget-ui/empty-widget/empty-widget';
import type {Issue} from '../issue-list/types/issue-types';
import type {Article} from '../article-list/article-line/article-line';
import {i18n} from '@lib/i18n/i18n';
import styles from './documents-list.module.css';


type DocumentType = Issue | Article;

interface Props<T extends DocumentType> {
  documents: T[];
  totalDocumentCount: number;
  renderDocuments: (document: T) => React.ReactElement;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  editable: boolean;
  onTabEdit: () => void;
  error: boolean;
  emptyMessage: string;
}

const DocumentsList = <T extends DocumentType>(props: Props<T>) => {
  const {
    documents,
    totalDocumentCount,
    renderDocuments,
    isLoading,
    isLoadingMore,
    onLoadMore,
    editable,
    onTabEdit,
    error,
    emptyMessage,
  } = props;

  if (error) {
    return <EmptyWidget face={EmptyWidgetFaces.ERROR} message={"Can't load information from service"}/>;
  }

  if (isLoading) {
    return <LoaderInline/>;
  }

  if (documents.length === 0) {
    return (
      <EmptyWidget face={EmptyWidgetFaces.OK} message={emptyMessage}>
        {editable && (
          <Link pseudo onClick={onTabEdit}>
            {i18n('Edit search query')}
          </Link>
        )}
      </EmptyWidget>
    );
  }

  const loadMoreCount = totalDocumentCount - documents.length;

  return (
    <>
      {documents.map(document => renderDocuments(document))}

      {loadMoreCount > 0 &&
        (isLoadingMore ? (
          <LoaderInline/>
        ) : (
          <Link pseudo onClick={onLoadMore} className={styles.loadMore}>
            {i18n('Show more')}
          </Link>
        ))}
    </>
  );
};

export default DocumentsList;
