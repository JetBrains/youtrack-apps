import React from 'react';
import articleIcon from '@jetbrains/icons/article';
import Icon from '@jetbrains/ring-ui-built/components/icon/icon';
import Link from '@jetbrains/ring-ui-built/components/link/link';
import {getArticleLink} from '../../../api';

import styles from './article.module.css';

export interface Article {
    id: string;
    idReadable: string;
    summary: string;
}

interface Props {
    article: Article;
}

const ArticleLine = ({article}: Props) => {
    const articleUrl = getArticleLink(article.idReadable);

    return (
      <div className={styles.articleLine}>
        <div className={styles.icon}>
          <Icon glyph={articleIcon}/>
        </div>
        <Link key={`article-summary-${article.id}`} href={articleUrl} target="_blank">
          {article.summary}
        </Link>
      </div>
    );
};

export default ArticleLine;
