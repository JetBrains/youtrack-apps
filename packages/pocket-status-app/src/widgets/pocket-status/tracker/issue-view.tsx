import {FC} from 'react';
import {observer} from 'mobx-react-lite';
import Icon from '@jetbrains/ring-ui-built/components/icon/icon';
import lockIcon from '@jetbrains/icons/lock';

import appState from '../app-state.ts';
import {TagButton} from '../../shared/custom-tag.tsx';

import {issueUrl} from './issue-api.ts';

// Shown instead of the issue. A viewer who cannot see the issue gets nothing of it: no ID link, no summary, no value.
const Placeholder: FC = observer(() => (
  <span className="issue-view secondary-text" title={appState.issueHidden ? 'You cannot see this issue' : undefined}>
    {appState.issueHidden && <Icon glyph={lockIcon} className="issue-lock"/>}
    {appState.issueHidden ? 'Restricted issue' : 'Issue tracking is turned off'}
  </span>
));

// ID, summary and the tracked field of the issue; the summary is cut first when the widget is narrow
const IssueLine: FC = observer(() => {
  const {issue, trackedIssueId: id, trackedField: field, canPickTrackedValue} = appState;
  return (
    <span className="issue-view">
      <a className="issue-link" href={issueUrl(id)} target="_blank" rel="noopener noreferrer">{id}</a>
      {issue && <span className="issue-summary" title={issue.summary}>{issue.summary}</span>}
      {field?.value && (
        <TagButton
          name={field.value.name}
          title={canPickTrackedValue ? `${field.name}: click to change` : field.name}
          backgroundColor={field.value.color}
          textColor={field.value.textColor}
          onClick={canPickTrackedValue ? () => appState.openValuePicker() : undefined}
        />
      )}
    </span>
  );
});

export const IssueView: FC = observer(() => (
  !appState.issueTracking || appState.issueHidden ? <Placeholder/> : <IssueLine/>
));
