import {FC, KeyboardEvent, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';
import Select from '@jetbrains/ring-ui-built/components/select/select';

import appState from '../app-state.ts';

import {findField, TrackedIssue} from './issue-api.ts';

interface FieldPickerProps {
  issue: TrackedIssue;
  fieldName: string;
  onChange: (fieldName: string) => void;
}

const FieldPicker: FC<FieldPickerProps> = ({issue, fieldName, onChange}) => {
  const data = issue.fields.map(field => ({key: field.name, label: field.name, description: field.value?.name}));
  return (
    <div className="value-form appear">
      <span className="secondary-text issue-found" title={issue.summary}>{`${issue.idReadable} ${issue.summary}`}</span>
      <Select
        label="Field"
        data={data}
        selected={data.find(item => item.key === fieldName) ?? null}
        onSelect={item => item && onChange(item.key)}
      />
      <Button onClick={() => appState.trackIssue(issue, fieldName)}>{'Track'}</Button>
    </div>
  );
};

// Two steps: find the issue, then pick which of its fields the widget shows
export const TrackIssueForm: FC = () => {
  const [issueId, setIssueId] = useState(appState.config?.issueId ?? '');
  // A widget that already tracks an issue opens with that issue and field picked
  const [issue, setIssue] = useState<TrackedIssue | null>(() => appState.issue);
  const [fieldName, setFieldName] = useState(() => appState.trackedField?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const find = async (id: string) => {
    if (!id.trim()) {
      return;
    }
    setBusy(true);
    const result = await appState.findIssue(id.trim());
    setBusy(false);
    if (typeof result === 'string') {
      setError(result);
      return;
    }
    setIssue(result);
    setFieldName((findField(result, appState.config?.fieldName) ?? result.fields[0]).name);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      find(issueId);
    }
  };

  return (
    <section className="section dialog-footer appear" style={{animationDelay: '200ms'}}>
      <span className="section-label">{'Or show a field of an issue'}</span>
      <div className="value-form">
        <Input
          placeholder="Issue ID, for example QA-12"
          size={Size.FULL}
          className="grow"
          value={issueId}
          error={error ?? undefined}
          onChange={e => {
            setIssueId(e.currentTarget.value);
            setIssue(null);
            setError(null);
          }}
          onKeyDown={onKeyDown}
        />
        {!issue && <Button loader={busy} disabled={!issueId.trim()} onClick={() => find(issueId)}>{'Find'}</Button>}
      </div>
      {issue && <FieldPicker issue={issue} fieldName={fieldName} onChange={setFieldName}/>}
    </section>
  );
};
