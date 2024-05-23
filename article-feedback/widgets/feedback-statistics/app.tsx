import React, {memo} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';

const UPDATE_ARTICLE_PERMISSION = 'JetBrains.YouTrack.UPDATE_ARTICLE';

const host = await YTApp.register();

const debug = await host.fetchApp('backend/debug', {scope: true});
console.log('debug', debug);

const user = (await host.fetchApp('backend/project', {scope: true})) as {
  projectKey: string;
};

const permissions = (await host.fetchYouTrack('permissions/cache?fields=global,permission(key),projects(shortName)')) as
  Array<{
    global: boolean;
    permission: {key: string};
    projects: {shortName: string}[] | null;
  }>;

const canUpdateArticle = permissions.some(it =>
  it.permission.key === UPDATE_ARTICLE_PERMISSION &&
  (it.global ||
    it.projects?.some((project) => project.shortName === user.projectKey))
);

const stat = canUpdateArticle
  ? ((await host.fetchApp('backend/stat', {scope: true})) as {
      likes: boolean;
      dislikes: boolean;
      messages: string[];
    })
  : undefined;

const AppComponent: FC = () => {
  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <div className="widget">
        {!canUpdateArticle && (
          <p>{'Unfortunately, you are not allowed to access the page you\'ve requested. It seems you don\'t have sufficient permissions.'}</p>
        )}

        {canUpdateArticle && stat && (
          <>
            <p>{`Liked: ${stat.likes}`}</p>
            <p>{`Didn't like: ${stat.dislikes}`}</p>
            {stat.messages.map(message => (
              <p key={message}>{message}</p>
            ))}
          </>
        )}
      </div>
    </ControlsHeightContext.Provider>
  );
};

export const App = memo(AppComponent);
