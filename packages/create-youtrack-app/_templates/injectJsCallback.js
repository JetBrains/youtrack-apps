module.exports = {
  injectJSCallback(callback, factory) {
    return (...args) =>
      factory(...args).then((result) => {
        if (callback) {
          return callback(result);
        }
        return result;
      });
  },
};
