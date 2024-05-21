import React, {memo} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';

const host = await YTApp.register();

const debug = await host.fetchApp('backend/debug', {scope: true});
console.log('debug', debug);

const stat = (await host.fetchApp('backend/stat', {scope: true})) as {
  likes: boolean;
  dislikes: boolean;
  messages: string[];
};

const AppComponent: FC = () => {
  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <div className="widget">
        <p>{`Liked: ${stat.likes}`}</p>
        <p>{`Didn't like: ${stat.dislikes}`}</p>
        {stat.messages.map(message => (
          <p key={message}>{message}</p>
        ))}
      </div>
    </ControlsHeightContext.Provider>
  );
};

export const App = memo(AppComponent);
