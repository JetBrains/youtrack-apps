import {FC} from 'react';
import {observer} from 'mobx-react-lite';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';

import appState from '../app-state.ts';
import {EditDialog} from '../edit/edit-dialog.tsx';

import {SetSelect} from './set-select.tsx';
import {SetActions} from './set-actions.tsx';
import {TrackIssueForm} from '../tracker/track-issue-form.tsx';

export const ConfigDialog: FC = observer(() => {
  if (appState.setsLoading) {
    return <div className="row"><LoaderInline/></div>;
  }
  // Sections enter one after another, 100ms apart
  return (
    <>
      <section className="section appear">
        {/* Users edit or add a set right here, without going to the project */}
        <div className="select-row">
          <SetSelect/>
          <SetActions/>
        </div>
      </section>
      {appState.selectedSet && <EditDialog/>}
      {appState.issueTracking && <TrackIssueForm/>}
    </>
  );
});
