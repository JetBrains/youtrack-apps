import React, { memo } from 'react';
import type { FC } from 'react';
import type { ScaleLinear } from 'd3-scale';
import { topMargin, bottomMargin, yAxisWidth, textVerticalShift } from '../constants';

interface Props {
    height: number;
    y: ScaleLinear<number, number>;
    maxY: number;
}

const YAxisComponent: FC<Props> = props => {
    const { height, y, maxY } = props;

    return (
        <>
            {y.ticks(maxY).map((tick) => {
                return (
                    <text
                        key={tick}
                        x={0}
                        y={y(tick)}
                        transform={`translate(0, ${textVerticalShift})`}
                        className={'text'}
                    >
                        {tick}
                    </text>
                );
            })}
            <line
                x1={yAxisWidth}
                y1={topMargin}
                x2={yAxisWidth}
                y2={height - bottomMargin}
                className={'y-axis'}
            />
        </>
    );
};

export const YAxis = memo(YAxisComponent);
