import React, {memo} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';

import API from '../api';

const UPDATE_ARTICLE_PERMISSION = 'JetBrains.YouTrack.UPDATE_ARTICLE';

const host = await YTApp.register();
const api = new API(host);

const project = await api.getProject();

const permissions = (await host.fetchYouTrack('permissions/cache?fields=global,permission(key),projects(shortName)')) as
  Array<{
    global: boolean;
    permission: {key: string};
    projects: {shortName: string}[] | null;
  }>;

const canUpdateArticle = permissions.some(it =>
  it.permission.key === UPDATE_ARTICLE_PERMISSION &&
  (it.global ||
    it.projects?.some(pr => pr.shortName === project.projectKey))
);

const stat = canUpdateArticle ? await api.getStat() : undefined;

const AppComponent: FC = () => {
  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <div className="widget">
        {!canUpdateArticle && (
          <p>{'Unfortunately, you are not allowed to access the page you\'ve requested. It seems you don\'t have sufficient permissions.'}</p>
        )}

        {canUpdateArticle && stat && (
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