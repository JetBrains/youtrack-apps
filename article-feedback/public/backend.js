/* eslint-disable func-names */
function response(ctx) {
  return ctx.response.json({
    likes: JSON.parse(ctx.article.extensionProperties.likes),
    currentUser: ctx.currentUser.ringId
  });
}

exports.httpHandler = {
  endpoints: [
    {
      scope: 'article',
      method: 'GET',
      path: 'likes',
      handle: function (ctx) {
        response(ctx);
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'like',
      handle: function (ctx) {
        const likes = JSON.parse(ctx.article.extensionProperties.likes);
        ctx.article.extensionProperties.likes = JSON.stringify({
          ...likes,
          [ctx.currentUser.ringId]: true
        });
        response(ctx);
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'dislike',
      handle: function (ctx) {
        const likes = JSON.parse(ctx.article.extensionProperties.likes);
        ctx.article.extensionProperties.likes = JSON.stringify({
          ...likes,
          [ctx.currentUser.ringId]: false
        });
        response(ctx);
      }
    }
  ]
};
