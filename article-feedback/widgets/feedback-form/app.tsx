import React, {memo} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';

const host = await YTApp.register();

const likes = await host.fetchApp('backend/likes', {scope: true});
console.log('likes', likes);

const AppComponent: FC = () => {
  const onLike = async () => {
    const response = await host.fetchApp('backend/like', {scope: true, method: 'post'});
    console.log('onLike', response);
  };

  const onDislike = async () => {
    const response = await host.fetchApp('backend/dislike', {scope: true, method: 'post'});
    console.log('onDislike', response);
  };

  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <p>{'Was this article helpful?'}</p>
      <ButtonSet>
        <Button onClick={onLike}>{'Yes'}</Button>
        <Button onClick={onDislike}>{'No'}</Button>
      </ButtonSet>
    </ControlsHeightContext.Provider>
  );
};

export const App = memo(AppComponent);
