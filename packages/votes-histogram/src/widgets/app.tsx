import React, { memo } from 'react';
import type { FC } from 'react';
import '@jetbrains/ring-ui-built/components/style.css';
import { ControlsHeightContext, ControlsHeight } from '@jetbrains/ring-ui-built/components/global/controls-height';
import { fetchDatePattern } from './api/fetch-date-pattern';
import { Histogram } from './components/histogram';
import { fetchVotes } from './api/fetch-votes';

const host = await YTApp.register();

const issueID = YTApp.entity.id;

// const created = new Date(YTApp.entity.created).getTime();

const { created } = await host.fetchYouTrack(`issues/${issueID}`, {
    query: {
        fields: 'created',
    },
});

const votes = await fetchVotes(host, issueID);

const datePattern = await fetchDatePattern(host);

const AppComponent: FC = () => {
    return (
        <ControlsHeightContext.Provider value={ControlsHeight.S}>
            <Histogram
                data={votes}
                width={630}
                height={360}
                created={created}
                datePattern={datePattern}
            />
        </ControlsHeightContext.Provider>
    );
};

export const App = memo(AppComponent);
