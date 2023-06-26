import React, { memo, useCallback } from 'react';
import type { FC } from 'react';
import DatePicker from '@jetbrains/ring-ui/dist/date-picker/date-picker';
import Button from '@jetbrains/ring-ui/dist/button/button';
import { Size } from '@jetbrains/ring-ui/dist/input/input';

interface Props {
    min: number;
    max: number;
    onSetDefault: () => void;
    onSetMin: (timestamp: number) => void;
    onSetMax: (timestamp: number) => void;
}

const ToolbarComponent: FC<Props> = props => {
    const { min, max, onSetDefault, onSetMin, onSetMax } = props;

    const handleSetDefault = useCallback((): void => {
        onSetDefault();
    }, [onSetDefault]);

    const handleSetMin = useCallback((date: Date | null | undefined): void => {
        if (date !== null && date !== undefined) {
            onSetMin(date.getTime());
        }
    }, [onSetMin]);

    const handleSetMax = useCallback((date: Date | null | undefined): void => {
        if (date !== null && date !== undefined) {
            onSetMax(date.getTime());
        }
    }, [onSetMax]);

    return (
        <div className={'toolbar'}>
            <Button onClick={handleSetDefault}>All time</Button>
            <DatePicker
                size={Size.AUTO}
                className={'picker'}
                onChange={handleSetMin}
                date={new Date(min)}
            />
            <span className={'dash'}>{'—'}</span>
            <DatePicker
                size={Size.AUTO}
                onChange={handleSetMax}
                date={new Date(max)}
            />
        </div>
    );
};

export const Toolbar = memo(ToolbarComponent);
