import React, { memo } from 'react';
import type { FC } from 'react';
import { bottomMargin, yAxisWidth } from '../constants';

interface Props {
    width: number;
    height: number;
}

const XAxisComponent: FC<Props> = props => {
    const { width, height } = props;

    return (
        <line
            x1={yAxisWidth}
            y1={height - bottomMargin}
            x2={width}
            y2={height - bottomMargin}
            className={'x-axis'}
        />
    );
};

export const XAxis = memo(XAxisComponent);
