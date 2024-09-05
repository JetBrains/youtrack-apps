import React, {memo} from 'react';
import type {FC} from 'react';
import {format} from 'date-fns';

import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Link from '@jetbrains/ring-ui-built/components/link/link';
import Badge from '@jetbrains/ring-ui-built/components/badge/badge';

import API, {YTUser} from '../api';

const host = await YTApp.register();
const api = new API(host);

const [stat, config, profile] = await Promise.all([
  api.getStat(),
  api.getYtConfig(),
  api.getYtUserProfile(),
  api.loadProject(),
  api.loadPermissions()
]);

const dateTimePattern = profile.profiles.general.dateFieldFormat.pattern;
const usersIds = [...new Set(stat.messages.map(it => it.userId))];
const users = await api.getYtUsers(usersIds);
const messages = [...stat.messages, ...stat.guestMessages].sort((a, b) => b.timestamp - a.timestamp);
const likesTotal = stat.likes + stat.guestLikes;
const canReadUser = api.canReadUser();

function getYouTrackUrl(path: string) {
  if (config.contextPath) {
    return `/${config.contextPath}/${path}`;
  }
  return `/${path}`;
}

function renderUser(user?: YTUser, guest?: {name: string}) {
  if (user) {
    if (canReadUser) {
      return <Link href={getYouTrackUrl(`users/${user.ringId}`)} target="_blank">{user.fullName}</Link>;
    } else {
      return <span>{user.fullName}</span>;
    }
  }

  if (guest) {
    return <span>{guest.name}</span>;
  }

  return <span>{'Deleted User'}</span>;
}

const AppComponent: FC = () => {
  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <article className="widget">
        {stat && (
          <>
            <div data-test="likes">
              <strong>{'Helpful'}</strong>{': '}{likesTotal}
              {likesTotal > 0 && ` (${stat.likes} from registered users)`}
            </div>

            <div data-test="dislikes" className="dislikes">
              <strong>{'Not helpful'}</strong>{': '}{stat.dislikes}
            </div>

            {messages.length > 0 && (
              <>
                <div className="separator"/>

                <div className="messages">
                  {messages.map(message => {
                    const user = 'userId' in message ? users.find(it => it.ringId === message.userId) : undefined;
                    const guest = 'name' in message ? {name: message.name, email: message.email} : undefined;

                    return (
                      <section key={message.message}>
                        <header className="messageHeader">
                          <strong>
                            {renderUser(user, guest)}
                          </strong>

                          {guest && (
                            <Badge>{'guest'}</Badge>
                          )}

                          <span className="datetime">{format(message.timestamp, dateTimePattern)}</span>
                        </header>

                        {guest && (
                          <div className="messageSubHeader">{guest.email}</div>
                        )}

                        <div className="messageText" data-test="feedback-text">{message.message}</div>
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
