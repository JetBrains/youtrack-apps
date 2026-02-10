module.exports = {
  injectJSCallback(callback, factory) {
    return (...allArgs) =>
      factory(...allArgs).then((result) => {
        if (callback) {
          // Pass the full context (including args with cwd) to the callback
          const context = allArgs[0]; // { prompter, args, ...other hygen context }
          return callback(result, context);
        }
        return result;
      });
  },
};
