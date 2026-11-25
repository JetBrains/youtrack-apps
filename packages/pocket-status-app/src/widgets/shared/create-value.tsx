import {FC, KeyboardEvent, memo, useRef, useState} from 'react';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';
import Button from '@jetbrains/ring-ui-built/components/button/button';

import {getRandomColorPair} from './colors.ts';
import {TagButton} from './custom-tag.tsx';
import {StatusValue} from './types.ts';
import './shared.css';

interface Props {
  // Names already in the set: tags are keyed by name, so a duplicate is not allowed
  existingNames: string[];
  onAdd: (value: StatusValue) => void;
  // The form stays open after each add, so values go in one after another until the user is done
  onCancel: () => void;
}

const CreateValueComponent: FC<Props> = ({existingNames, onAdd, onCancel}) => {
  const [name, setName] = useState('');
  const [colors, setColors] = useState(getRandomColorPair);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = name.trim();
  const duplicate = existingNames.includes(trimmed);
  const canAdd = trimmed !== '' && !duplicate;

  const add = () => {
    if (canAdd) {
      onAdd({name: trimmed, color: colors.background, textColor: colors.foreground});
      setName('');
      setColors(getRandomColorPair());
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="value-form appear">
      <Input
        placeholder="Value name"
        size={Size.FULL}
        className="grow"
        autoFocus
        inputRef={inputRef}
        value={name}
        error={duplicate ? 'This value already exists' : undefined}
        onChange={e => setName(e.currentTarget.value)}
        onKeyDown={onKeyDown}
      />
      <TagButton
        name={trimmed || 'Preview'}
        title="Click to pick other colors"
        backgroundColor={colors.background}
        textColor={colors.foreground}
        onClick={() => setColors(getRandomColorPair())}
      />
      <Button disabled={!canAdd} onClick={add}>{'Add'}</Button>
      <Button inline onClick={onCancel}>{'Done'}</Button>
    </div>
  );
};

export const CreateValueForm = memo(CreateValueComponent);
