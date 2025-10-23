import React from 'react';
import classNames from 'classnames';
import styles from './counter-loader.module.css';

interface Props {
    className?: string;
}

const CounterLoader = ({className}: Props) => {
    return <div className={classNames(styles.loader, className)}/>;
};

export default CounterLoader;
