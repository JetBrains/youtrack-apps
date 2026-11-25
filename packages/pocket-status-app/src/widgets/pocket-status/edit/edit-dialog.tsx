import {FC, memo} from 'react';
import {observer} from 'mobx-react-lite';

import appState from '../app-state.ts';
import {TagButton} from '../../shared/custom-tag.tsx';

const EditComponent: FC = observer(() => {
  const set = appState.selectedSet;
  const {selectedOwner, currentValueName: current} = appState;

  async function select(name: string, backgroundColor: string, textColor: string) {
    await appState.saveConfig({isConfigured: true, key: set?.name, setOwner: selectedOwner, name, backgroundColor, textColor});
    appState.currentWidgetState = 'view';
  }

  return (
    <section className="section appear" style={{animationDelay: '100ms'}}>
      <span className="section-label">{'Pick a status'}</span>
      <div className="tags">
        {set?.values.map(item => (
          <TagButton
            key={item.name}
            name={item.name}
            className={item.name === current ? 'tag-target tag-current' : 'tag-target'}
            backgroundColor={item.color}
            textColor={item.textColor}
            onClick={() => select(item.name, item.color, item.textColor)}
          />
        ))}
      </div>
    </section>
  );
});

export const EditDialog = memo(EditComponent);
