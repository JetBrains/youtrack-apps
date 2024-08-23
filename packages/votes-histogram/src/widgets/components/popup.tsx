import React, { memo } from 'react';
import type { FC } from 'react';
import RingPopup from '@jetbrains/ring-ui-built/components/popup/popup';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import { formatVotes } from '../helpers/format-votes';
import { formatDate } from '../helpers/format-date';
import { isSameDay } from '../helpers/is-same-day';
import type { BarData } from '../types/bar-data';

type PopupProps = BarData & {
    datePattern: string;
};

const PopupComponent: FC<PopupProps> = props => {
    const { x, y, votes, min, max, datePattern } = props;
    return (
        <div style={{ position: 'fixed', top: y + 10, left: x + 10 }}>
            <RingPopup className={'popup'}>
                <Text><b>{votes}</b> {formatVotes(votes)}</Text>
                {isSameDay(min, max)
                    ? <Text info>{formatDate(min, datePattern)}</Text>
                    : <Text info>{formatDate(min, datePattern)} – {formatDate(max, datePattern)}</Text>
                }
            </RingPopup>
        </div>
    );
};

export const Popup = memo(PopupComponent);
