import {FC} from 'react';
import {observer} from 'mobx-react-lite';
import Button from '@jetbrains/ring-ui-built/components/button/button';

import appState from '../app-state.ts';
import {TagButton} from '../../shared/custom-tag.tsx';

// The user picks the value: workflows can allow only some transitions, so the widget does not guess the next one
export const ValuePicker: FC = observer(() => {
  const {issue, trackedField: field} = appState;
  if (!issue || !field) {
    return null;
  }
  return (
    <>
      <section className="section appear">
        <span className="section-label">{`${field.name} of ${issue.idReadable}`}</span>
        <div className="tags">
          {field.values.map(value => (
            <TagButton
              key={value.name}
              name={value.name}
              className={value.name === field.value?.name ? 'tag-target tag-current' : 'tag-target'}
              backgroundColor={value.color}
              textColor={value.textColor}
              onClick={() => appState.setTrackedValue(value)}
            />
          ))}
        </div>
      </section>
      <footer className="dialog-footer row appear" style={{animationDelay: '100ms'}}>
        <Button
          onClick={() => {
            appState.currentWidgetState = 'view';
          }}
        >
          {'Cancel'}
        </Button>
      </footer>
    </>
  );
});
