import {FC, memo, useEffect} from 'react';
import {observer} from 'mobx-react-lite';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import {ControlsHeight, ControlsHeightContext} from '@jetbrains/ring-ui-built/components/global/controls-height';

import {PocketStatus} from './status.tsx';
import appState from './app-state.ts';
import {ConfigDialog} from './config/config-dialog.tsx';
import {CreateForm} from './create/create-dialog.tsx';
import {ValuePicker} from './tracker/value-picker.tsx';

const AppComponent: FC = observer(() => {
  useEffect(() => {
    appState.init();
  }, []);

  // One owner for the host config dialog, so switching between config and create keeps it open
  const isModal = appState.currentWidgetState !== 'view';
  useEffect(() => {
    if (!isModal) {
      return undefined;
    }
    appState.host?.enterConfigMode();
    return () => {
      appState.host?.exitConfigMode();
    };
  }, [isModal]);

  if (appState.loading) {
    return <LoaderInline/>;
  }

  if (!isModal) {
    return (
      <div className="widget-inline">
        <PocketStatus/>
      </div>
    );
  }

  // The host sizes the config dialog, so the content is centered and uses medium controls to fill it
  return (
    <ControlsHeightContext.Provider value={ControlsHeight.M}>
      <div className="widget">
        {appState.currentWidgetState === 'config' && <ConfigDialog/>}
        {appState.currentWidgetState === 'create' && <CreateForm/>}
        {appState.currentWidgetState === 'pick' && <ValuePicker/>}
      </div>
    </ControlsHeightContext.Provider>
  );
});

export const App = memo(AppComponent);
