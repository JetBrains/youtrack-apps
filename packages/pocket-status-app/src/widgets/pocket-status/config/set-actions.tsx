import {FC} from 'react';
import {observer} from 'mobx-react-lite';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import pencilIcon from '@jetbrains/icons/pencil';
import addIcon from '@jetbrains/icons/add';

import appState from '../app-state.ts';

// Small icon buttons next to the select: they manage the sets and do not confirm the choice.
// Anyone can create a personal set; a set is editable by its owner, or by the team for a project set.
export const SetActions: FC = observer(() => {
  const {selectedSet, selectedOwner} = appState;
  return (
    <div className="set-actions">
      {selectedSet && appState.canEditSet(selectedOwner) && (
        <Button
          icon={pencilIcon}
          title="Edit set"
          aria-label="Edit set"
          onClick={() => appState.openSetForm(selectedSet, selectedOwner)}
        />
      )}
      <Button
        icon={addIcon}
        title="Create new set"
        aria-label="Create new set"
        onClick={() => appState.openSetForm()}
      />
    </div>
  );
});
