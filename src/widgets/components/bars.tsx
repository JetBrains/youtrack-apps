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

    const handleClick = (x0: number, x1: number) => () => {
        onClick(x0, x1);
    };

    const handleMouseEnter = (votes: number) => () => {
        onMouseEnter(votes);
    };

    const handleMouseMove = (x0: number, x1: number, votes: number) => (event: React.MouseEvent<SVGRectElement>) => {
        onMouseMove({
            x: event.clientX,
            y: event.clientY,
            votes,
            min: x0,
            max: x1,
        });
    };

    const handleMouseLeave = () => {
        onMouseMove(null);
    };

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
                        onMouseEnter={handleMouseEnter(d.length)}
                        onClick={handleClick(d.x0, d.x1)}
                        onMouseMove={handleMouseMove(d.x0, d.x1, d.length)}
                        onMouseLeave={handleMouseLeave}
                    />
                );
            })}
        </>
    );
};

export const Bars = memo(BarsComponent);