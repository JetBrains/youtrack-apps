import React from 'react';
import '@jetbrains/ring-ui/dist/style.css';
import { ControlsHeightContext } from '@jetbrains/ring-ui/dist/global/controls-height';
import { Histogram } from './components/Histogram';
import { ControlsHeight } from '@jetbrains/ring-ui/components/global/controls-height';

// @ts-expect-error
const host = await YTPlugin.register();

// @ts-expect-error
const issueID: string = YTPlugin.entity.id;

// @ts-expect-error
const created = new Date(YTPlugin.entity.created).getTime();

const issue = await host.fetchYouTrack(`issues/${issueID}/activitiesPage`, {
    query: {
        categories: 'VotersCategory',
        fields: 'activities(timestamp)',
        top: 1000,
    },
});

const data = issue.activities.map((activity: { timestamp: number }) => activity.timestamp);

function App(): JSX.Element {
    return (
        <ControlsHeightContext.Provider value={ControlsHeight.S}>
            <Histogram data={data} width={400} height={220} created={created} />
        </ControlsHeightContext.Provider>
    );
}

export default App;
