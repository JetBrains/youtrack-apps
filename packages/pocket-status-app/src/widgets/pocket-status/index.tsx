import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@jetbrains/ring-ui-built/components/style.css';
import {ControlsHeight, ControlsHeightContext} from '@jetbrains/ring-ui-built/components/global/controls-height';

import {App} from './app';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <App/>
    </ControlsHeightContext.Provider>
  </StrictMode>
);
