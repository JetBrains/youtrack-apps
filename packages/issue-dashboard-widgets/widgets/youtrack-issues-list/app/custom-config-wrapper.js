const isInApp = !!window.YTApp;

function ConfigWrapper(dashboardApi, configFields) {
  let config;
  let isInitialized = false;

  this.init = async () =>
    await (
      dashboardApi.readConfig().then(response => {
        isInitialized = true;
        if (isInApp) {
          const stored = (response || {}).customWidgetConfig;
          try {
            config = stored ? JSON.parse(stored) : null;
          } catch (e) {
            // noop
          }
        } else {
          config = response;
        }
        return config;
      })
    );

  this.isInitialized = () => isInitialized;

  this.isNewConfig = () => {
    if (!isInitialized) {
      return throwIllegalStateException();
    }
    return !config;
  };

  this.getFieldValue = fieldName => {
    if (!isInitialized) {
      return throwIllegalStateException();
    }
    if (configFields.indexOf(fieldName) < 0) {
      throw new Error(`Illegal argument exception: config does not have field "${fieldName}"`);
    }
    return (config || {})[fieldName];
  };

  this.update = async newConfig => {
    await this.init();
    const mergedConfig = mergeConfigs(newConfig, config);
    if (mergedConfig) {
      return await this.replace(mergedConfig);
    }
    return null;
  };

  this.replace = async newConfig => {
    const promise = isInApp
      ? dashboardApi.storeConfig({
        customWidgetConfig: JSON.stringify(filterConfigFields(newConfig))
      })
      : dashboardApi.storeConfig(filterConfigFields(newConfig));

    return await (
      promise.
        then(() => {
          isInitialized = true;
          config = newConfig;
          return config;
        })
    );
  };

  function mergeConfigs(newConfig, prevConfig) {
    if (!prevConfig) {
      return newConfig;
    }
    if (!newConfig) {
      return null;
    }

    const resultConfig = configFields.reduce((result, field) => {
      result[field] = newConfig.hasOwnProperty(field)
        ? newConfig[field]
        : prevConfig[field];
      return result;
    }, {});
    const hasChanges = configFields.some(
      field => resultConfig[field] !== prevConfig[field]
    );
    return hasChanges ? resultConfig : null;
  }

  function filterConfigFields(configObject) {
    return configFields.reduce(
      (resultConfig, field) => {
        if (configObject.hasOwnProperty(field)) {
          resultConfig[field] = configObject[field];
        }
        return resultConfig;
      },
      {}
    );
  }

  function throwIllegalStateException() {
    throw new Error(
      'Illegal state exception: ' +
      'cannot call sync method of ConfigWrapper before it\'s initialization'
    );
  }
}

export default ConfigWrapper;
