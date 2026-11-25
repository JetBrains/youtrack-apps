import {FC} from 'react';
import {observer} from 'mobx-react-lite';
import Select from '@jetbrains/ring-ui-built/components/select/select';
import {Size} from '@jetbrains/ring-ui-built/components/input/input';
import {Type} from '@jetbrains/ring-ui-built/components/list/consts';

import appState from '../app-state.ts';
import {StatesSet} from '../../shared/types.ts';

const group = (title: string, sets: StatesSet[], owner?: string) => (sets.length === 0
  ? []
  : [
    {key: `group:${title}`, rgItemType: Type.SEPARATOR, description: title},
    ...sets.map(set => ({key: `${owner ?? 'project'}:${set.name}`, label: set.name, name: set.name, owner}))
  ]);

export const SetSelect: FC = observer(() => {
  const me = YTApp.me.id;
  const owner = appState.config?.setOwner;
  const data = [
    ...group('Project sets', appState.sets),
    ...group('My sets', appState.userSets, me),
    // A widget set up by someone else with a personal set keeps showing that set
    ...(owner && owner !== me ? group('Personal sets of another user', appState.ownerSets, owner) : [])
  ];
  const selectedKey = appState.selectedSet && `${appState.selectedOwner ?? 'project'}:${appState.selectedSet.name}`;
  const selected = data.find(item => item.key === selectedKey) ?? null;

  return (
    <Select
      label="Status set"
      size={Size.FULL}
      className="grow"
      data={data}
      // Without a filter the select keeps the group headers; a filter drops a header that comes first
      filter={false}
      selected={selected}
      onSelect={item => {
        if (item && 'name' in item) {
          appState.selectSet(item.name, item.owner);
        }
      }}
    />
  );
});
