import {i18n} from 'hub-dashboard-addons/dist/localization';

const ReportTimeRanges = {
  Fixed: {
    id: 'FIXED',
    text: () => i18n('Fixed'),
    getDefaultTimePeriod: () => {
      const date = new Date();

      const weekLength = 7;
      const from = Date.UTC(
        date.getFullYear(), date.getMonth(), date.getDate() - weekLength
      );
      const to = Date.UTC(
        date.getFullYear(), date.getMonth(), date.getDate() + 1
      ) - 1;

      return {from, to};
    }
  },
  Today: {
    id: 'TODAY',
    oneDayPeriod: true,
    text: () => i18n('Today')
  },
  Yesterday: {
    id: 'YESTERDAY',
    oneDayPeriod: true,
    text: () => i18n('Yesterday')
  },
  LastWorkingDay: {
    id: 'LAST_WORKING_DAY',
    oneDayPeriod: true,
    text: () => i18n('Last working day')
  },
  ThisWeek: {
    id: 'THIS_WEEK',
    text: () => i18n('This week')
  },
  ThisMonth: {
    id: 'THIS_MONTH',
    text: () => i18n('This month')
  },
  ThisYear: {
    id: 'THIS_YEAR',
    text: () => i18n('This year')
  },
  LastWeek: {
    id: 'LAST_WEEK',
    text: () => i18n('Last week')
  },
  LastMonth: {
    id: 'LAST_MONTH',
    text: () => i18n('Last month')
  }
};

function allRanges() {
  return Object.keys(ReportTimeRanges).map(
    key => ReportTimeRanges[key]
  );
}

function oneDayRanges() {
  return allRanges().filter(
    range => range.oneDayPeriod
  );
}

function severalDaysRanges() {
  return allRanges().filter(
    range => !range.oneDayPeriod
  );
}

function fixedRange() {
  return ReportTimeRanges.Fixed;
}

export default {
  ...ReportTimeRanges,

  oneDayRanges,
  severalDaysRanges,
  fixedRange,
  allRanges
};
