import React, { memo } from 'react';
import type { FC } from 'react';
import { bottomMargin, getYAxisWidth } from '../constants';
import type { ScaleLinear } from 'd3-scale';

interface Props {
    width: number;
    height: number;
    y: ScaleLinear<number, number>;
}

const XAxisComponent: FC<Props> = props => {
    const { width, height, y } = props;

    const ticks = y.ticks(10);

    const lastTickLength = String(ticks.at(-1)).length;

    return (
        <line
            x1={getYAxisWidth(lastTickLength)}
            y1={height - bottomMargin}
            x2={width}
            y2={height - bottomMargin}
            className={'x-axis'}
        />
    );
};

export const XAxis = memo(XAxisComponent);
