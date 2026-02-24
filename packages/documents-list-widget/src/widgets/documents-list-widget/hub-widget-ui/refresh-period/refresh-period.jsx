import React from 'react';
import PropTypes from 'prop-types';

import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import chevronDownIcon from '@jetbrains/icons/chevron-down';
import chevronUpIcon from '@jetbrains/icons/chevron-up';
import timeIcon from '@jetbrains/icons/time';
import Icon from '@jetbrains/ring-ui/components/icon';

import styles from './refresh-period.module.css';
import {i18n} from '@lib/i18n/i18n';

const REFRESH_PERIOD_MINUTE = 60; // eslint-disable-line no-magic-numbers

const increaseRefreshPeriod = (seconds, onChange) => () => {
  const newSeconds = seconds + REFRESH_PERIOD_MINUTE;
  onChange(newSeconds);
};

const decreaseRefreshPeriod = (seconds, onChange) => () => {
  if (seconds > REFRESH_PERIOD_MINUTE) {
    const newSeconds = seconds - REFRESH_PERIOD_MINUTE;
    onChange(newSeconds);
  }
};

const RefreshPeriod = ({seconds, onChange, label, tooltip}) => {
  const minutesCount = seconds / REFRESH_PERIOD_MINUTE;

  return (
    <span className={styles.refreshPeriod} data-test="refresh-period-control">
      <Tooltip
        delay={1000}
        popupProps={{top: -4}}
        title={tooltip(minutesCount)}
      >
        <Icon
          size={Icon.Size.Size12}
          glyph={timeIcon}
        />&nbsp;<span data-test="refresh-period-label">{label(minutesCount)}</span>
      </Tooltip>
      <Icon
        onClick={increaseRefreshPeriod(seconds, onChange)}
        className={[styles.button, styles.up].join(' ')}
        size={Icon.Size.Size12}
        color={Icon.Color.BLUE}
        data-test="refresh-period-up"
        glyph={chevronUpIcon}
      />
      <Icon
        onClick={decreaseRefreshPeriod(seconds, onChange)}
        className={[styles.button, styles.down].join(' ')}
        size={Icon.Size.Size12}
        color={Icon.Color.BLUE}
        data-test="refresh-period-down"
        glyph={chevronDownIcon}
      />
    </span>
  );
};

RefreshPeriod.propTypes = {
  seconds: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.func,
  tooltip: PropTypes.func
};

RefreshPeriod.defaultProps = {
  label: minutesCount => i18n(
    '{{minutesCount}} min', {minutesCount}, minutesCount
  ),
  tooltip: minutesCount => (
    minutesCount === 1
      ? i18n('Widget refreshes every minute')
      : i18n('Widget refreshes every {{minutesCount}} minutes', {minutesCount}, minutesCount)
  )
};

export default RefreshPeriod;
