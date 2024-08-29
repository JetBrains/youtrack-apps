import React, {memo} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';

import API from '../api';

const host = await YTApp.register();
const api = new API(host);

const stat = await api.getStat();

const AppComponent: FC = () => {
  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <div className="widget">
        {stat && (
          <>
            <p><strong>{'Liked'}</strong>{': '}{stat.likes}</p>
            <p><strong>{'Didn\'t like'}</strong>{': '}{stat.dislikes}</p>

            <div className="messages">
              {[...stat.messages, ...stat.guestMessages].map(message => (
                <div key={message.message}>
                  <p>
                    <strong>
                      {'userId' in message ? message.userId : message.name}
                    </strong>
                  </p>
                  <p>{message.message}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ControlsHeightContext.Provider>
  );
};

export const App = memo(AppComponent);
