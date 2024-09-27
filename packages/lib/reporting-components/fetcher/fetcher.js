const APP_NAMES = {
  YouTrack: 'YouTrack'
};

const cachedParams = {
  services: {},
  dashboardApi: null
};

let fetcherInstance;


class Fetcher {
  constructor(dashboardApi) {
    cachedParams.dashboardApi = dashboardApi;
  }

  setService(appName, id) {
    cachedParams.services[appName] = id;
  }

  setYouTrack(id) {
    this.setService(APP_NAMES.YouTrack, id);
  }

  async fetchYouTrack(url, params) {
    const youtrackId = cachedParams.services[APP_NAMES.YouTrack];
    return await cachedParams.dashboardApi.fetch(youtrackId, url, params);
  }

  async fetchHub(url, params) {
    return await cachedParams.dashboardApi.fetchHub(url, params);
  }
}


function initFetcher(dashboardApi) {
  fetcherInstance = new Fetcher(dashboardApi);
}

export default function fetcher() {
  return fetcherInstance;
}

export {initFetcher};
