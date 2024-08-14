import React, { memo } from 'react';
import type { FC } from 'react';
import type * as d3 from 'd3';
import type { BarData } from '../types/bar-data';

interface Props {
    bins: Array<d3.Bin<number, number>>;
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
    onClick: (x0: number, x1: number) => void;
    onMouseMove: (popup: BarData | null) => void;
    onMouseEnter: (votes: number) => void;
}

const BarsComponent: FC<Props> = props => {
    const { bins, x, y, onClick, onMouseMove, onMouseEnter } = props;

    return (
        <>
            {bins.map((d, i) => {
                if (d.x0 === undefined || d.x1 === undefined) {
                    return null;
                }

                return (
                    <rect
                        key={i}
                        x={x(d.x0) + 1}
                        y={y(d.length)}
                        width={Math.max(x(d.x1) - x(d.x0) - 1, 0)}
                        height={y(0) - y(d.length)}
                        className={'bar'}
                        onMouseEnter={() => {
                            onMouseEnter(d.length);
                        }}
                        onMouseLeave={() => {
                            onMouseMove(null);
                        }}
                        onClick={() => {
                            if (d.x0 !== undefined && d.x1 !== undefined) {
                                onClick(d.x0, d.x1);
                            }
                        }}
                        onMouseMove={event => {
                            if (d.x0 !== undefined && d.x1 !== undefined) {
                                onMouseMove({
                                    x: event.clientX,
                                    y: event.clientY,
                                    votes: d.length,
                                    min: d.x0,
                                    max: d.x1,
                                });
                            }
                        }}
                    />
                );
            })}
        </>
    );
};

export const Bars = memo(BarsComponent);
