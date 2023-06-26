import React, { memo, useCallback } from 'react';
import type { FC } from 'react';
import type * as d3 from 'd3';
import type { PopupProps } from './Popup';

interface Props {
    bins: Array<d3.Bin<number, number>>;
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
    onBarClick: (x0: number, x1: number) => void;
    onSetPopup: (popup: PopupProps | null) => void;
}

const BarsComponent: FC<Props> = props => {
    const { bins, x, y, onBarClick, onSetPopup } = props;

    const handleClick = useCallback((x0: number, x1: number) => () => {
        onBarClick(x0, x1);
    }, [onBarClick]);

    const handleMouseMove = useCallback((x0: number, x1: number, votes: number) => (event: React.MouseEvent<SVGRectElement>) => {
        onSetPopup({
            x: event.clientX,
            y: event.clientY,
            votes,
            min: x0,
            max: x1,
        });
    }, [onSetPopup]);

    const handleMouseLeave = useCallback(() => {
        onSetPopup(null);
    }, [onSetPopup]);

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
