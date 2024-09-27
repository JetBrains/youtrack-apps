import React, {useCallback, useMemo} from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import DatePicker from '@jetbrains/ring-ui/components/date-picker/date-picker';
import Select from '@jetbrains/ring-ui/components/select/select';

import ReportNamedTimeRanges from '../report-model/report-time-ranges';
import BackendTypes from '../backend-types/backend-types';

const ReportPeriod = ({
  period, disabled, onChange
}) => {
  const namedRange = (period || {}).range;

  const ranges = useMemo(() => ReportNamedTimeRanges.allRanges().
    map(range => ({
      id: range.id,
      label: range.text(),
      description:
      (range.id === ReportNamedTimeRanges.fixedRange().id
        ? i18n('Custom dates interval') : undefined)
    })), []);

  const selected = useMemo(() => ranges.filter(range =>
    range.id === (namedRange || ReportNamedTimeRanges.fixedRange()).id
  )[0], [period]);

  const changeRangeSetting = useCallback(({id}) => {
    const newPeriod = getNewPeriod(id, (period || {}).id);
    onChange(newPeriod);

    function getNewPeriod(selectedId, periodId) {
      if (selectedId === ReportNamedTimeRanges.fixedRange().id) {
        return ({
          id: periodId,
          $type: BackendTypes.get().FixedTimeRange,
          ...ReportNamedTimeRanges.fixedRange().getDefaultTimePeriod()
        });
      }

      return ({
        id: periodId,
        $type: BackendTypes.get().NamedTimeRange,
        range: {id: selectedId}
      });
    }
  }, [period, onChange]);

  const setRangeForFixedPeriod = useCallback(({from, to}) => {
    if (period && !period.range) {
      period.from = from.valueOf();
      period.to = to.valueOf();

      onChange(period);
    }
  }, [period, onChange]);

  return (
    <span>
      <Select
        data={ranges}
        selected={selected}
        onSelect={changeRangeSetting}
        disabled={disabled}
        type={Select.Type.INLINE}
        filter={true}
      />
      {
        !namedRange &&
        <span className="time-report-widget__sub-control">
          <DatePicker
            from={period.from}
            to={period.to}
            onChange={setRangeForFixedPeriod}
            range={true}
            disabled={disabled}
          />
        </span>
      }
    </span>
  );
};

ReportPeriod.propTypes = {
  period: PropTypes.object,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};


export default ReportPeriod;
