---
 to: src/widgets/main/app.tsx
---
import React, {memo, useCallback} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Button from '@jetbrains/ring-ui-built/components/button/button';

// Register widget in YouTrack
const host = await YTApp.register();

const AppComponent: FC = () => {
  const callBackend = useCallback(async () => {
    const result = await host.fetchApp('debug', {query: {test: '123'}});
    // eslint-disable-next-line no-console
    console.log('request result', result);
  }, []);

  return (
    <div className="widget">
      <ControlsHeightContext.Provider value={ControlsHeight.S}>
        <Button primary onClick={callBackend}>{'Make HTTP Request'}</Button>
      </ControlsHeightContext.Provider>
    </div>
  );
};

export const App = memo(AppComponent);
