import React, { memo } from 'react';
import type { FC } from 'react';

interface Props {
    width: number;
    height: number;
}

const BackgroundComponent: FC<Props> = props => {
    const { width, height } = props;

    return (
        <rect
            x={0}
            y={0}
            width={width}
            height={height}
            className={'background'}
        />
    );
};

export const Background = memo(BackgroundComponent);
