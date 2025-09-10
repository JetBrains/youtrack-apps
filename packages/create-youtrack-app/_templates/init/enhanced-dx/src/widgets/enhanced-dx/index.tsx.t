---
to: src/widgets/enhanced-dx/index.tsx
---
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@jetbrains/ring-ui-built/components/style.css';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';

import {App} from './app.tsx';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <App/>
    </ControlsHeightContext.Provider>
  </React.StrictMode>
);
