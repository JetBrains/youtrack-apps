import React, { useState, useCallback, useMemo, memo } from 'react';
import type { FC } from 'react';
import * as d3 from 'd3';
import { Toolbar } from './Toolbar';
import { Popup } from './Popup';
import type { PopupProps } from './Popup';
import { barAmount, topMargin, bottomMargin, yAxisWidth } from '../constants';
import { XAxis } from './XAxis';
import { YAxis } from './YAxis';
import { Bars } from './Bars';
import { Background } from './Background';
import { isSameDay } from '../helpers/isSameDay';

interface Props {
    data: number[];
    width: number;
    height: number;
    created: number;
}

const HistogramComponent: FC<Props> = ({ data, width, height, created }) => {
    const [min, setMin] = useState(created);
    const [max, setMax] = useState(Date.now());
    const [popup, setPopup] = useState<PopupProps | null>(null);

    const x = useMemo(() => d3.scaleLinear()
        .domain([min, max])
        .range([yAxisWidth, width]), [min, max, width]);

    const histogram = useMemo(() => d3.bin()
        .value(d => d)
        .domain(x.domain() as [number, number])
        .thresholds(x.ticks(barAmount)), [x]);

    const bins = useMemo(() => histogram(data), [data, histogram]);

    const maxY = d3.max(bins, d => d.length) as number;

    const y = useMemo(() => d3.scaleLinear()
        .domain([0, maxY])
        .range([height - bottomMargin, topMargin]), [maxY, height]);

    const handleSetDefault = useCallback((): void => {
        setMin(created);
        setMax(Date.now());
    }, [created]);

    const handleSetMin = useCallback((timestamp: number): void => {
        setMin(timestamp);
    }, []);

    const handleSetMax = useCallback((timestamp: number): void => {
        setMax(timestamp);
    }, []);

    const handleBarClick = useCallback((x0: number, x1: number) => {
        if (!isSameDay(x0, x1)) {
            setMin(x0);
            setMax(x1);
        }
    }, []);

    return (
        <div className="container">
            {popup !== null && (
                <Popup
                    x={popup.x}
                    y={popup.y}
                    votes={popup.votes}
                    min={popup.min}
                    max={popup.max}
                />
            )}
            <svg width={width} height={height}>
                <Background
                    width={width}
                    height={height}
                />
                <Bars
                    bins={bins}
                    x={x}
                    y={y}
                    onBarClick={handleBarClick}
                    onSetPopup={setPopup}
                />
                <YAxis
                    height={height}
                    y={y}
                    maxY={maxY}
                />
                <XAxis
                    width={width}
                    height={height}
                />
            </svg>
            <Toolbar
                min={min}
                max={max}
                onSetDefault={handleSetDefault}
                onSetMin={handleSetMin}
                onSetMax={handleSetMax}
            />
        </div>
    );
};

export const Histogram = memo(HistogramComponent);
