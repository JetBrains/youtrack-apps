import React, { memo } from 'react';
import DocumentsListWidget from './components/documents-list-widget';

export const AppComponent = () => {
  return <DocumentsListWidget/>;
};

export const App = memo(AppComponent);