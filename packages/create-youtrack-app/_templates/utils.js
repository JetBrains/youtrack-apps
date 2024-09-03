module.exports.validateNotEmpty = val => {
  const empty = typeof val === 'string' && val.trim().length === 0;

  return empty ? 'Value should be not empty' : true;
};
