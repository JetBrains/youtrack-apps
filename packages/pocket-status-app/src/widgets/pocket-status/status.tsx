import {FC, memo} from 'react';
import {observer} from 'mobx-react-lite';
import Button from '@jetbrains/ring-ui-built/components/button/button';

import appState from './app-state.ts';
import {TagButton} from '../shared/custom-tag.tsx';

import {IssueView} from './tracker/issue-view.tsx';

const StatusComponent: FC = observer(() => {
  if (appState.config?.issueId) {
    return <IssueView/>;
  }
  const status = appState.currentStatus;
  if (!status) {
    return (
      <Button
        inline
        onClick={() => appState.openConfig()}
      >
        {'Set status'}
      </Button>
    );
  }
  return (
    <TagButton
      name={status.name}
      backgroundColor={status.color}
      textColor={status.textColor}
      title={appState.canSwitchStatus ? 'Click to switch status' : undefined}
      onClick={appState.canSwitchStatus ? () => appState.switchToNextValue() : undefined}
    />
  );
});

export const PocketStatus = memo(StatusComponent);
