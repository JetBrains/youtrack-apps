function ConfigWrapper(dashboardApi, configFields) {
  let config;
  let isInitialized = false;

  this.init = async () =>
    await (
      dashboardApi.readConfig().then(response => {
        isInitialized = true;
        config = response;
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

  this.replace = async newConfig =>
    await (
      dashboardApi.storeConfig(filterConfigFields(newConfig)).
        then(() => {
          isInitialized = true;
          config = newConfig;
          return config;
        })
    );

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
    throw new Error('Illegal state exception: cannot call sync method of ConfigWrapper before it\'s initialization');
  }
}

export default ConfigWrapper;
