import React, { memo } from 'react';
import DocumentsListWidget from './components/documents-list-widget';
import {initTranslations} from './init';

// Import .po files as translations using our custom Vite plugin
const translationsModules: Record<string, { default: Record<string, string>; locale: string }> = import.meta.glob('../../../translations/*.po', { eager: true })
initTranslations(YTApp.locale, translationsModules);

export const AppComponent = () => {
  return <DocumentsListWidget/>;
};

export const App = memo(AppComponent);
