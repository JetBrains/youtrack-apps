import React, { memo } from 'react';
import type { FC } from 'react';
import '@jetbrains/ring-ui/dist/style.css';
import { ControlsHeightContext } from '@jetbrains/ring-ui/dist/global/controls-height';
import { ControlsHeight } from '@jetbrains/ring-ui/components/global/controls-height';
import { fetchDatePattern } from './api/fetch-date-pattern';
import { Histogram } from './components/histogram';
import { fetchVotes } from './api/fetch-votes';

const host = await YTPlugin.register();

const issueID = YTPlugin.entity.id;

const created = new Date(YTPlugin.entity.created).getTime();

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
