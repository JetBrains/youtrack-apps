import React from 'react';
import CounterLoader from './counter-loader/counter-loader';
import styles from './counter-tab-title.module.css';

interface Props {
    title: string;
    counter: number;
    loading: boolean;
}

const CounterTabTitle = ({title, counter, loading}: Props) => {
    return (
      <span>
        <span>{title}</span>
        <span className={styles.tabCounter}>
          {counter}
          {loading && <CounterLoader className={styles.counterLoader}/>}
        </span>
      </span>
    );
};

export default CounterTabTitle;
