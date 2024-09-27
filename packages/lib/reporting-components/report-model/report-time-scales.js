import {i18n} from 'hub-dashboard-addons/dist/localization';

const ReportTimeScales = {
  Day: {
    id: 'DAY',
    text: () => i18n('Day')
  },
  Week: {
    id: 'WEEK',
    text: () => i18n('Week')
  },
  Month: {
    id: 'MONTH',
    text: () => i18n('Month')
  }
};


export default ReportTimeScales;
