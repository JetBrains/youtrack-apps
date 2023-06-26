import React, { memo } from 'react';
import type { FC } from 'react';
import RingPopup from '@jetbrains/ring-ui/dist/popup/popup';
import Text from '@jetbrains/ring-ui/dist/text/text';
import { isSameDay } from '../helpers/isSameDay';
import { formatVotes } from '../helpers/formatVotes';
import { formatDate } from '../helpers/formatDate';

export interface PopupProps {
    x: number;
    y: number;
    votes: number;
    min: number;
    max: number;
}

const PopupComponent: FC<PopupProps> = props => {
    const { x, y, votes, min, max } = props;
    return (
        <div style={{ position: 'fixed', top: y + 10, left: x + 10 }}>
            <RingPopup className={'popup'}>
                <Text><b>{votes}</b> {formatVotes(votes)}</Text>
                {isSameDay(min, max)
                    ? <Text info>{formatDate(min)}</Text>
                    : <Text info>{formatDate(min)} – {formatDate(max)}</Text>
                }
            </RingPopup>
        </div>
    );
};

export const Popup = memo(PopupComponent);
