---
to: src/widgets/<%= folderName %>/index.tsx
---
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@jetbrains/ring-ui-built/components/style.css';
import {App} from './app';

// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App host={host}/>
  </React.StrictMode>
);
