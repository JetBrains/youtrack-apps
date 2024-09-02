---
 to: src/backend.js
---
exports.httpHandler = {
  endpoints: [
    {
      method: 'GET',
      path: 'debug',
      handle: function handleDebug(ctx) {
        ctx.response.json({test: true});
      }
    }
  ]
};
