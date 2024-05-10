import React, {memo} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';

const host = await YTApp.register();
console.log(YTApp, host);

const articleID = YTApp.entity.id;

const AppComponent: FC = () => {
  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <p>{'Was this article helpful?'}</p>
      <ButtonSet>
        <Button>{'Yes'}</Button>
        <Button>{'No'}</Button>
      </ButtonSet>
    </ControlsHeightContext.Provider>
  );
};

export const App = memo(AppComponent);
