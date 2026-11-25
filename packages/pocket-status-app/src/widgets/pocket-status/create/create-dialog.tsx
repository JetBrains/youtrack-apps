import {FC, memo, useState} from 'react';
import {observer} from 'mobx-react-lite';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';
import Heading, {Levels} from '@jetbrains/ring-ui-built/components/heading/heading';
import Select from '@jetbrains/ring-ui-built/components/select/select';

import appState from '../app-state.ts';
import {TagButton} from '../../shared/custom-tag.tsx';

import {CreateValueForm} from '../../shared/create-value.tsx';
import {DialogStore} from './dialog-store.ts';

const TARGETS = [{key: 'project', label: 'Project sets'}, {key: 'mine', label: 'My sets'}];

// Team members choose where a new set goes; everyone else creates a personal set
const SaveTarget: FC<{owner?: string; onChange: (owner?: string) => void}> = ({owner, onChange}) => (
  // The select hides its label once a value is picked, so the label is a separate text
  <div className="value-form">
    <span className="secondary-text">{'Save to'}</span>
    <Select
      label="Save to"
      data={TARGETS}
      selected={TARGETS[owner ? 1 : 0]}
      onSelect={item => onChange(item?.key === 'mine' ? YTApp.me.id : undefined)}
    />
  </div>
);

interface NameSectionProps {
  store: DialogStore;
  nameTaken: boolean;
  owner?: string;
  onOwnerChange: (owner?: string) => void;
}

// A new set gets a name field; an edited set keeps its name, because widgets refer to a set by its name
const NameSection: FC<NameSectionProps> = observer(({store, nameTaken, owner, onOwnerChange}) => {
  const editing = appState.editingSet;
  if (editing) {
    return <Heading level={Levels.H3} className="dialog-title">{editing.name}</Heading>;
  }
  return (
    <>
      <Input
        label="Set name"
        placeholder="Type a name"
        size={Size.FULL}
        autoFocus
        error={nameTaken ? 'A set with this name already exists' : undefined}
        onChange={e => {
          store.newSet.name = e.currentTarget.value;
        }}
      />
      {appState.canEdit && <SaveTarget owner={owner} onChange={onOwnerChange}/>}
    </>
  );
});

const CreateFormComponent: FC = observer(() => {
  const editing = appState.editingSet;
  const [store] = useState(() => new DialogStore(editing ?? undefined));
  // An edited set stays where it is; a new one goes to the project when the user may change project sets
  const [owner, setOwner] = useState(() => (editing ? appState.editingOwner : appState.newSetOwner));

  const name = store.newSet.name.trim();
  const nameTaken = !editing && appState.isSetNameTaken(name, owner);

  const onSave = async () => {
    if (await appState.saveSet({...store.newSet, name}, owner)) {
      appState.closeSetForm(name, owner);
    }
  };

  return (
    <>
      <section className="section appear">
        <NameSection store={store} nameTaken={nameTaken} owner={owner} onOwnerChange={setOwner}/>
      </section>
      <section className="section appear" style={{animationDelay: '100ms'}}>
        <span className="section-label">{'Values'}</span>
        <div className="tags">
          {store.newSet.values.map((item, index) => (
            <TagButton
              key={item.name}
              name={item.name}
              backgroundColor={item.color}
              textColor={item.textColor}
              onRemove={() => store.newSet.values.splice(index, 1)}
            />
          ))}
        </div>
        {store.addNewValue
          ? (
            <CreateValueForm
              existingNames={store.newSet.values.map(value => value.name)}
              onAdd={value => {
                store.newSet.values.push(value);
              }}
              onCancel={() => {
                store.addNewValue = false;
              }}
            />
          )
          : (
            <div className="row">
              <Button
                inline
                onClick={() => {
                  store.addNewValue = true;
                }}
              >
                {'Add value'}
              </Button>
            </div>
          )}
      </section>
      <footer className="dialog-footer row appear" style={{animationDelay: '200ms'}}>
        <Button
          primary
          disabled={store.newSet.values.length === 0 || name === '' || nameTaken}
          onClick={onSave}
        >
          {'Save'}
        </Button>
        <Button
          onClick={() => appState.closeSetForm()}
        >
          {'Cancel'}
        </Button>
      </footer>
    </>
  );
});

export const CreateForm = memo(CreateFormComponent);
