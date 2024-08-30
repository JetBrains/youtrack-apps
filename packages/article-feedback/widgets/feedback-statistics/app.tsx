import React, {memo} from 'react';
import type {FC} from 'react';
import {format} from 'date-fns';

import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Link from '@jetbrains/ring-ui-built/components/link/link';
import Badge from '@jetbrains/ring-ui-built/components/badge/badge';

import API from '../api';

const host = await YTApp.register();
const api = new API(host);

const [stat, config, profile] = await Promise.all([api.getStat(), api.getYtConfig(), api.getYtUserProfile()]);

const dateTimePattern = profile.profiles.general.dateFieldFormat.pattern;
const usersIds = stat.messages.map(it => it.userId);
const users = await api.getYtUsers(usersIds);
const messages = [...stat.messages, ...stat.guestMessages].sort((a, b) => b.timestamp - a.timestamp);

function getYouTrackUrl(path: string) {
  if (config.contextPath) {
    return `/${config.contextPath}/${path}`;
  }
  return `/${path}`;
}

const AppComponent: FC = () => {
  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <article className="widget">
        {stat && (
          <>
            <p><strong>{'Liked'}</strong>{': '}{stat.likes}</p>
            <p><strong>{'Didn\'t like'}</strong>{': '}{stat.dislikes}</p>

            {messages.length > 0 && (
              <>
                <div className="separator"/>

                <div className="messages">
                  {messages.map(message => {
                    const user = 'userId' in message ? users.find(it => it.ringId === message.userId) : undefined;

                    return (
                      <section key={message.message}>
                        <header className="messageHeader">
                          <strong>
                            {user && (
                              <Link href={getYouTrackUrl(`users/${user.ringId}`)} target="_blank">{user.fullName}</Link>
                            )}

                            {!user && 'name' in message && (
                              <span>{message.name}</span>
                            )}
                          </strong>

                          {!('userId' in message) && (
                            <Badge>{'guest'}</Badge>
                          )}

                          <span className="datetime">{format(message.timestamp, dateTimePattern)}</span>
                        </header>

                        {'email' in message && (
                          <div className="messageSubHeader">{message.email}</div>
                        )}

                        <p className="messageText">{message.message}</p>
                      </section>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </article>
    </ControlsHeightContext.Provider>
  );
};

export const App = memo(AppComponent);
