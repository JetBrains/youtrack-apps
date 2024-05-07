import React, { memo } from 'react';
import type { FC } from 'react';
import type { ScaleLinear } from 'd3-scale';
import { topMargin, bottomMargin, textVerticalShift, getYAxisWidth } from '../constants';

interface Props {
    height: number;
    y: ScaleLinear<number, number>;
}

const YAxisComponent: FC<Props> = props => {
    const { height, y } = props;

    const ticks = y.ticks(10);

    const lastTickLength = String(ticks.at(-1)).length;

    return (
        <>
            {ticks.map((tick) => {
                if (!Number.isInteger(tick)) {
                    return null;
                }

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
                x1={getYAxisWidth(lastTickLength)}
                y1={topMargin}
                x2={getYAxisWidth(lastTickLength)}
                y2={height - bottomMargin}
                className={'y-axis'}
            />
        </>
    );
};

export const YAxis = memo(YAxisComponent);
