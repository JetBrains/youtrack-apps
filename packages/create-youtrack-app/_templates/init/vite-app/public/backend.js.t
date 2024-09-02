---
 to: public/backend.js
---
exports.httpHandler = {
  endpoints: [
    {
      scope: 'issue',
      method: 'GET',
      path: 'debug',
      handle: function handleDebug(ctx) {
        ctx.response.json({test: true});
      }
    }
  ]
};
