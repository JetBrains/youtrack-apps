/* eslint-disable */
var entities = require('@jetbrains/youtrack-scripting-api/entities');
var workflow = require('@jetbrains/youtrack-scripting-api/workflow');



exports.rule = entities.Issue.onChange({
  title: "On-change 1",
  action: function(ctx) {
    const logger = new Logger(ctx.traceEnabled);

  }
});

function Logger(useDebug = true) {
  return {
    log: (...args) => useDebug && console.log(...args),
    warn: (...args) => useDebug && console.warn(...args),
    error: (...args) => useDebug && console.error(...args)
  }
}