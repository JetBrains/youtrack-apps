function trimPathSegments(input) {
  const s = String(input || '');
  if (!s) return '';
  return s.split('/').filter(Boolean).join('/');
}

module.exports = { trimPathSegments };
