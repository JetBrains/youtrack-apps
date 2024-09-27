import {observable} from 'mobx';

import {CATEGORIES} from './components/categories';

import DateTime from './date-time';

class ActivitiesFilter {

  static DEFAULT_REFRESH_PERIOD = 240; // eslint-disable-line no-magic-numbers

  static DEFAULT_RECENT_DAYS = 90; // eslint-disable-line no-magic-numbers

  @observable title = null;

  @observable query = null;

  @observable author = null;

  @observable youTrackId = null;

  @observable youTrackUrl = null;

  // eslint-disable-next-line max-len
  @observable categoriesIds = CATEGORIES.filter(it => it.default).map(it => it.id);

  @observable refreshPeriod = ActivitiesFilter.DEFAULT_REFRESH_PERIOD;

  userFormats = null;

  // eslint-disable-next-line max-len
  recentPeriodStart = DateTime.getTimeDaysAgo(ActivitiesFilter.DEFAULT_RECENT_DAYS);

  dashboardApi = null;

  restore(props) {
    try {
      const storedFilter = props.configWrapper.getFieldValue('filter');
      this.title = storedFilter.title;
      this.query = storedFilter.query;
      this.author = storedFilter.author || null;
      this.youTrackId = storedFilter.youTrack.id;
      this.youTrackUrl = storedFilter.youTrack.homeUrl;
      this.categoriesIds = storedFilter.categoriesIds;
      this.refreshPeriod = storedFilter.refreshPeriod ||
        ActivitiesFilter.DEFAULT_REFRESH_PERIOD;
    } catch (e) {
      this.sync(props);
    }
  }

  async sync(props) {
    await props.configWrapper.update({filter: this.toConfig()});
  }

  toConfig() {
    const toConfigAuthor = author => author && {
      id: author.id,
      name: author.name,
      avatarURL: author.avatarURL
    };

    return {
      title: this.title,
      query: this.query,
      author: toConfigAuthor(this.author),
      categoriesIds: this.categoriesIds.slice(),
      youTrack: {id: this.youTrackId, homeUrl: this.youTrackUrl},
      refreshPeriod: this.refreshPeriod
    };
  }
}

// @ts-ignore
const filter = window.filter = new ActivitiesFilter();

export default filter;
