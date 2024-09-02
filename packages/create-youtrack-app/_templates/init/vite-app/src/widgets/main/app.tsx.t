---
 to: src/widgets/main/app.tsx
---
import {memo} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Button from '@jetbrains/ring-ui-built/components/button/button';

const host = await YTApp.register();


const AppComponent: FC = () => {
  return (
    <div className="widget">
      <ControlsHeightContext.Provider value={ControlsHeight.S}>
        <Button primary>Make HTTP Request</Button>
      </ControlsHeightContext.Provider>
    </div>
  );
};

export const App = memo(AppComponent);


