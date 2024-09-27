import React from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import './spent-time-value.scss';

const MINUTES_IN_HOUR = 60;
const MINUTES_IN_MINUTES_DECADE = 10;

const SpentTimeValue = ({value, showZero}) => {
  const minutes = value && (value.value || value.minutes) || 0;
  if (!minutes && !showZero) {
    return '';
  }

  const minutesPresentation = [
    Math.floor((minutes % MINUTES_IN_HOUR) / MINUTES_IN_MINUTES_DECADE),
    (minutes % MINUTES_IN_HOUR) % MINUTES_IN_MINUTES_DECADE,
    i18n('m')
  ].join('');
  const hours = Math.floor(minutes / MINUTES_IN_HOUR);

  return (
    <span className="spent-time-value">
      {
        (hours > 0) &&
        <span className="spent-time-value__hours">
          {`${hours}${i18n('h')}`}
        </span>
      }
      <span className="spent-time-value__minutes">
        {minutesPresentation}
      </span>
    </span>
  );
};

SpentTimeValue.propTypes = {
  value: PropTypes.object,
  showZero: PropTypes.bool
};

export default SpentTimeValue;
