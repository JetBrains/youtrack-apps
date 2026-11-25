import {FC, memo, useCallback, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Heading, {Levels} from '@jetbrains/ring-ui-built/components/heading/heading';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import {AlertType} from '@jetbrains/ring-ui-built/components/alert/alert';

import {CreateValueForm} from '../shared/create-value.tsx';
import {TagButton} from '../shared/custom-tag.tsx';
import {loadSets, saveSets, SetsScope} from '../shared/sets-api.ts';
import {StatesSet} from '../shared/types.ts';

const host = await YTApp.register();
// One widget for two places: the project tab manages project sets, the profile tab personal ones
const isProfile = YTApp.entity?.type === 'user';
const scope: SetsScope = {kind: isProfile ? 'user' : 'project', id: YTApp.entity?.id ?? ''};
const TEXT = isProfile
  ? {
    title: 'My status sets',
    intro: 'Your own sets. Pocket Status widgets offer them next to the project sets, in every project.',
    readOnly: 'Only the owner can change these sets.',
    empty: 'No sets yet.'
  }
  : {
    title: 'Status sets',
    intro: 'Pocket Status widgets in this project pick their statuses from these sets.',
    readOnly: 'Only members of the project team can change the sets.',
    empty: 'No sets yet. Widgets show the predefined sets until you add one.'
  };

// Widgets refer to a set by its name, so only a set that is not saved yet can get a new name
interface Row {
  uid: string;
  set: StatesSet;
  isNew: boolean;
}

let uidCounter = 0;
const nextUid = () => {
  uidCounter += 1;
  return `set-${uidCounter}`;
};

const toRows = (sets: StatesSet[]): Row[] => sets.map(set => ({uid: nextUid(), set, isNew: false}));
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));
const pluralValues = (count: number) => `${count} ${count === 1 ? 'value' : 'values'}`;

function findProblem(rows: Row[]): string | null {
  const names = rows.map(row => row.set.name.trim());
  if (names.some(name => !name)) {
    return 'Every set needs a name.';
  }
  if (new Set(names).size !== names.length) {
    return 'Set names must be unique.';
  }
  if (rows.some(row => row.set.values.length === 0)) {
    return 'Every set needs at least one value.';
  }
  return null;
}

interface SetCardProps {
  row: Row;
  canEdit: boolean;
  onChange: (set: StatesSet) => void;
  onRemove: () => void;
}

const SetCardComponent: FC<SetCardProps> = ({row, canEdit, onChange, onRemove}) => {
  const [adding, setAdding] = useState(false);
  const {set} = row;

  return (
    <section className={row.isNew ? 'set-card appear' : 'set-card'}>
      <div className="set-head">
        {row.isNew
          ? (
            <Input
              placeholder="Set name"
              size={Size.FULL}
              className="grow"
              autoFocus
              value={set.name}
              onChange={e => onChange({...set, name: e.currentTarget.value})}
            />
          )
          : (
            <div className="set-title grow">
              <Heading level={Levels.H3} className="set-name">{set.name}</Heading>
              <span className="secondary-text">{pluralValues(set.values.length)}</span>
            </div>
          )}
        {canEdit && <Button danger inline onClick={onRemove}>{'Remove set'}</Button>}
      </div>
      <div className="tags">
        {set.values.map((value, index) => (
          <TagButton
            key={value.name}
            name={value.name}
            backgroundColor={value.color}
            textColor={value.textColor}
            onRemove={canEdit ? () => onChange({...set, values: set.values.filter((_, i) => i !== index)}) : undefined}
          />
        ))}
      </div>
      {canEdit && (adding
        ? (
          <CreateValueForm
            existingNames={set.values.map(value => value.name)}
            onAdd={value => onChange({...set, values: [...set.values, value]})}
            onCancel={() => setAdding(false)}
          />
        )
        : (
          <div>
            <Button inline onClick={() => setAdding(true)}>{'Add value'}</Button>
          </div>
        )
      )}
    </section>
  );
};

const SetCard = memo(SetCardComponent);

interface FooterProps {
  dirty: boolean;
  saving: boolean;
  problem: string | null;
  onSave: () => void;
  onDiscard: () => void;
}

const Footer: FC<FooterProps> = ({dirty, saving, problem, onSave, onDiscard}) => (
  <footer className="settings-footer">
    <Button primary loader={saving} disabled={!dirty || Boolean(problem)} onClick={onSave}>{'Save'}</Button>
    <Button disabled={!dirty || saving} onClick={onDiscard}>{'Discard changes'}</Button>
    <Text info className="footer-note">
      {problem ?? 'A saved set keeps its name, because widgets refer to it by name.'}
    </Text>
  </footer>
);

const AppComponent: FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [saved, setSaved] = useState<StatesSet[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSets(host, scope).
      then(result => {
        setRows(toRows(result.sets));
        setSaved(result.sets);
        setCanEdit(result.canEdit);
      }).
      catch(e => host.alert(`Could not load status sets: ${errorMessage(e)}`, AlertType.ERROR)).
      finally(() => setLoading(false));
  }, []);

  const changeSet = useCallback((uid: string, set: StatesSet) => {
    setRows(current => current.map(row => (row.uid === uid ? {...row, set} : row)));
  }, []);

  const removeSet = useCallback((uid: string) => {
    setRows(current => current.filter(row => row.uid !== uid));
  }, []);

  const addSet = () => {
    setRows(current => [...current, {uid: nextUid(), set: {name: '', values: []}, isNew: true}]);
  };

  const save = async () => {
    const sets = rows.map(row => ({...row.set, name: row.set.name.trim()}));
    setSaving(true);
    try {
      await saveSets(host, scope, sets);
      setRows(toRows(sets));
      setSaved(sets);
      host.alert('Status sets saved', AlertType.SUCCESS);
    } catch (e) {
      host.alert(`Could not save status sets: ${errorMessage(e)}`, AlertType.ERROR);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader/>;
  }

  const problem = findProblem(rows);
  const dirty = JSON.stringify(rows.map(row => row.set)) !== JSON.stringify(saved);

  return (
    <div className="settings">
      <header className="settings-header">
        <Heading level={Levels.H2} className="settings-title">{TEXT.title}</Heading>
        <Text info className="pretty">
          {`${TEXT.intro} Click a value preview to pick other colors.`}
        </Text>
        {!canEdit && <Text info>{TEXT.readOnly}</Text>}
      </header>

      <div className="set-list">
        {rows.map(row => (
          <SetCard
            key={row.uid}
            row={row}
            canEdit={canEdit}
            onChange={set => changeSet(row.uid, set)}
            onRemove={() => removeSet(row.uid)}
          />
        ))}
        {rows.length === 0 && <Text info>{TEXT.empty}</Text>}
        {canEdit && (
          <div>
            <Button inline onClick={addSet}>{'Add set'}</Button>
          </div>
        )}
      </div>

      {canEdit && (
        <Footer
          dirty={dirty}
          saving={saving}
          problem={problem}
          onSave={save}
          onDiscard={() => setRows(toRows(saved))}
        />
      )}
    </div>
  );
};

export const App = memo(AppComponent);
