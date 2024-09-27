import {i18n} from 'hub-dashboard-addons/dist/localization';
import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import classNames from 'classnames';

import SpentTimeValue from '../spent-time-value/spent-time-value';

import './spent-time-progress.scss';

const DEFAULT_PROGRESS_BAR_WIDTH = 100;


const SpentTimeProgressTooltipContent = ({spent, estimated, overdue}) => (
  <table>
    <tbody>
      <tr>
        <td>
          <div
            className="spent-time-progress__mark spent-time-progress__mark_estimated"
          />
        </td>
        <td>{i18n('estimation')}</td>
        <td>
          <SpentTimeValue value={estimated} showZero={true}/>
        </td>
      </tr>
      <tr>
        <td>
          <div
            className="spent-time-progress__mark spent-time-progress__mark_spent"
          />
        </td>
        <td>{i18n('total spent time')}</td>
        <td>
          <SpentTimeValue value={spent} showZero={true}/>
        </td>
      </tr>
      {
        overdue && overdue.value > 0 &&
        <tr>
          <td>
            <div
              className="spent-time-progress__mark spent-time-progress__mark_overdue"
            />
          </td>
          <td>{i18n('overdue')}</td>
          <td>
            <SpentTimeValue value={overdue}/>
          </td>
        </tr>
      }
    </tbody>
  </table>
);

SpentTimeProgressTooltipContent.propTypes = {
  spent: PropTypes.object.isRequired,
  estimated: PropTypes.object,
  overdue: PropTypes.object
};

const SpentTimeProgressInPlaceDetails = (
  {spent, estimated, hasOverdue, overdue}
) => (
  <div className="spent-time-progress__label-details">
    <span className="spent-time-progress__label-detail spent-time-progress__label-detail_spent">
      <SpentTimeValue value={spent}/>
    </span>
    <span className="spent-time-progress__label-detail spent-time-progress__label-detail_estimated">
      <SpentTimeValue value={estimated}/>
    </span>
    {
      hasOverdue &&
      <span className="spent-time-progress__label-detail spent-time-progress__label-detail_overdue">
        <SpentTimeValue value={overdue}/>
      </span>
    }
  </div>
);

SpentTimeProgressInPlaceDetails.propTypes = {
  spent: PropTypes.object.isRequired,
  estimated: PropTypes.object,
  overdue: PropTypes.object,
  hasOverdue: PropTypes.bool
};


const SpentTimeProgress = ({spent, estimated, children}) => {

  const progressValue = spent && spent.value || 0;
  const estimationValue = estimated && estimated.value || 0;
  const hasOverdue = progressValue > estimationValue;

  const overdue = {value: progressValue - estimationValue};

  const total = Math.max(progressValue, estimationValue);
  const green = Math.min(progressValue, estimationValue);

  const totalWidth = DEFAULT_PROGRESS_BAR_WIDTH;
  const filledWidth = (total && total > 0)
    ? Math.ceil(DEFAULT_PROGRESS_BAR_WIDTH * (green / total))
    : 0;


  return (
    <span className="spent-time-progress">
      <Tooltip
        title={
          <SpentTimeProgressTooltipContent
            estimated={estimated}
            spent={spent}
            overdue={overdue}
          />
        }
      >
        <div className="spent-time-progress__labels">
          <SpentTimeProgressInPlaceDetails
            spent={spent}
            estimated={estimated}
            overdue={overdue}
            hasOverdue={hasOverdue}
          />
          <div className="spent-time-progress__label-sum">
            {children}
          </div>
        </div>
        <div className="spent-time-progress__wrapper">
          <div
            className={
              classNames('spent-time-progress__placeholder', {'spent-time-progress__placeholder_overdue': hasOverdue})
            }
            style={{width: `${totalWidth}%`}}
          >
            <div
              className="spent-time-progress__bar"
              style={{width: `${filledWidth}%`}}
            />
          </div>
        </div>
      </Tooltip>
    </span>
  );
};

SpentTimeProgress.propTypes = {
  spent: PropTypes.object.isRequired,
  estimated: PropTypes.object,
  children: PropTypes.node
};

export default SpentTimeProgress;
