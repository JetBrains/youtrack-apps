---
to: src/widgets/<%= folderName %>/app.tsx
---
import React, {memo, useCallback} from 'react';
import type {FC} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';

// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

const AppComponent: FC = () => {
  const callBackend = useCallback(async () => {
    const result = await host.fetchApp('backend/debug', {query: {test: '123'}});
    // eslint-disable-next-line no-console
    console.log('request result', result);
  }, []);

  return (
    <div className="widget">
      <Button primary onClick={callBackend}>{'Make HTTP Request'}</Button>
    </div>
  );
};

export const App = memo(AppComponent);
