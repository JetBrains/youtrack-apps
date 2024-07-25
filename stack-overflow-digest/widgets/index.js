var DEFAULT_TITLE = "Stack Overflow Questions";

function populateFeed(tags) {
  document.getElementById('soSettings').hidden = true;
  document.getElementById('soFeed').hidden = false;
  loadFeed(tags)
}

function createFeedLink(tags) {
  return "https://stackoverflow.com/questions/tagged/" + encodeURIComponent(tags);
}

function renderSettings(dashboardAPI) {

  document.getElementById('soSettings').hidden = false;
  document.getElementById('soFeed').hidden = true;

  document.getElementById('save').onclick = function () {
    var title = document.getElementById('soTitle').value;
    var tags = document.getElementById('soTags').value;
    dashboardAPI.storeConfig({
      title: title,
      tags: tags
    });
    dashboardAPI.exitConfigMode();
    dashboardAPI.setTitle(title, createFeedLink(tags));
    populateFeed(tags)
  };

  document.getElementById('cancel').onclick = function () {
    dashboardAPI.exitConfigMode();
    dashboardAPI.readConfig().then(function (config) {
      var title = (config && config.title) || DEFAULT_TITLE;
      var tags = (config && config.tags) || "";
      dashboardAPI.setTitle(title, createFeedLink(tags));
      populateFeed(tags);
    });
  };
}

function fillFieldsFromConfig(dashboardAPI) {
  dashboardAPI.readConfig().then(function (config) {
    document.getElementById('soTitle').value = (config && config.title) || DEFAULT_TITLE;
    document.getElementById('soTags').value = (config && config.tags) || "";
  });
}

function drawFeedFromConfig(dashboardAPI) {
  dashboardAPI.readConfig().then(function (config) {
    var title = (config && config.title) || DEFAULT_TITLE;
    var tags = (config && config.tags) || "";
    dashboardAPI.setTitle(title, createFeedLink(tags));
    populateFeed(tags);
  });
}

Dashboard.registerWidget(function (dashboardAPI, registerWidgetAPI) {
  drawFeedFromConfig(dashboardAPI);
  registerWidgetAPI({
    onConfigure: function () {
      fillFieldsFromConfig(dashboardAPI);
      renderSettings(dashboardAPI);
    },
    onRefresh: function () {
      dashboardAPI.setLoadingAnimationEnabled(true);
      drawFeedFromConfig(dashboardAPI);
      dashboardAPI.setLoadingAnimationEnabled(false);
    }
  });
});