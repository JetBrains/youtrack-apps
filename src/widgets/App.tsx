import React from 'react';
import type { FC } from 'react';
import '@jetbrains/ring-ui/dist/style.css';
import { ControlsHeightContext } from '@jetbrains/ring-ui/dist/global/controls-height';
import { Histogram } from './components/Histogram';
import { ControlsHeight } from '@jetbrains/ring-ui/components/global/controls-height';

const host = await YTPlugin.register();

const issueID: string = YTPlugin.entity.id;

const created = new Date(YTPlugin.entity.created).getTime();

const issue = await host.fetchYouTrack(`issues/${issueID}/activitiesPage`, {
    query: {
        categories: 'VotersCategory',
        fields: 'activities(timestamp)',
        top: 1000,
    },
});

const data = issue.activities.map((activity: { timestamp: number }) => activity.timestamp);

const App: FC = () => {
    return (
        <ControlsHeightContext.Provider value={ControlsHeight.S}>
            <Histogram data={data} width={636} height={360} created={created} />
        </ControlsHeightContext.Provider>
    );
};

export default App;
