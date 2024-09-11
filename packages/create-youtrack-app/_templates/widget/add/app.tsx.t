---
to: src/widgets/<%= folderName %>/app.tsx
---
import React, {memo, useCallback} from 'react';
import type {HostAPI} from '../../../@types/globals';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Button from '@jetbrains/ring-ui-built/components/button/button';

interface Props {
  host: HostAPI
}

const AppComponent: React.FunctionComponent<Props> = ({host}) => {
  const callBackend = useCallback(async () => {
    const result = await host.fetchApp('backend/debug', {query: {test: '123'}});
    // eslint-disable-next-line no-console
    console.log('request result', result);
  }, [host]);

  return (
    <div className="widget">
      <ControlsHeightContext.Provider value={ControlsHeight.S}>
        <Button primary onClick={callBackend}>{'Make HTTP Request'}</Button>
      </ControlsHeightContext.Provider>
    </div>
  );
};

export const App = memo(AppComponent);
