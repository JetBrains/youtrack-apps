import React, { useState, useCallback, useMemo, memo } from 'react';
import type { FC } from 'react';
import * as d3 from 'd3';
import { numberOfBars, topMargin, bottomMargin } from '../constants';
import { getStartOfDay } from '../helpers/get-start-of-day';
import { getEndOfDay } from '../helpers/get-end-of-day';
import type { BarData } from '../types/bar-data';
import { Background } from './background';
import { Toolbar } from './toolbar';
import { Popup } from './popup';
import { XAxis } from './x-axis';
import { YAxis } from './y-axis';
import { Bars } from './bars';

interface Props {
    data: number[];
    width: number;
    height: number;
    created: number;
    datePattern: string;
}

const HistogramComponent: FC<Props> = props => {
    const { data, width, height, created, datePattern } = props;

    const start = getStartOfDay(created);
    const end = getEndOfDay(Date.now());

    const [min, setMin] = useState(start);
    const [max, setMax] = useState(end);
    const [popup, setPopup] = useState<BarData | null>(null);

    const x = useMemo(() => d3.scaleLinear()
        .domain([min, max])
        .range([25, width])
        .nice(), [min, max, width]);

    const histogram = useMemo(() => d3.bin()
        .value(d => d)
        .domain(x.domain() as [number, number])
        .thresholds(x.ticks(numberOfBars)), [x]);

    const bins = useMemo(() => histogram(data), [data, histogram]);

    const [currentVotes, setCurrentVotes] = useState(Infinity);

    const maxY = d3.max(bins, d => d.length) as number;

    const y = useMemo(() => d3.scaleLinear()
        .domain([0, maxY])
        .range([height - bottomMargin, topMargin]), [maxY, height]);

    const handleSetDefault = useCallback((): void => {
        setMin(start);
        setMax(end);
    }, [start, end]);

    const handleSetMin = useCallback((timestamp: number): void => {
        setMin(timestamp);
    }, []);

    const handleSetMax = useCallback((timestamp: number): void => {
        setMax(timestamp);
    }, []);

    const setDomain = useCallback((x0: number, x1: number) => {
        if (currentVotes > 1) {
            setMin(x0);
            setMax(x1);
        }
    }, [currentVotes]);

    return (
        <div className={'container'}>
            {popup !== null && (
                <Popup
                    x={popup.x}
                    y={popup.y}
                    votes={popup.votes}
                    min={popup.min}
                    max={popup.max}
                    datePattern={datePattern}
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
                    onClick={setDomain}
                    onMouseMove={setPopup}
                    onMouseEnter={setCurrentVotes}
                />
                <YAxis
                    height={height}
                    y={y}
                />
                <XAxis
                    y={y}
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
                datePattern={datePattern}
            />
        </div>
    );
};

export const Histogram = memo(HistogramComponent);
