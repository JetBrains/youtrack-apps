exports.httpHandler = {
  endpoints: [
    {
      scope: 'article',
      method: 'GET',
      path: 'debug',
      handle: function handleDebug(ctx) {
        ctx.response.json(JSON.parse(ctx.article.extensionProperties.likes));
      }
    },

    {
      scope: 'article',
      method: 'GET',
      path: 'user',
      handle: function handleUser(ctx) {
        const likes = JSON.parse(ctx.article.extensionProperties.likes);
        const userId = ctx.currentUser.ringId;
        const isGuest = ctx.currentUser.login === 'guest';
        ctx.response.json({
          liked: likes[userId]?.liked ?? undefined,
          leftMessage: Boolean(likes[userId]?.message),
          isGuest
        });
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'like',
      handle: function handleLike(ctx) {
        if (ctx.currentUser.login === 'guest') {
          return;
        }

        const likes = JSON.parse(ctx.article.extensionProperties.likes);
        const userId = ctx.currentUser.ringId;
        ctx.article.extensionProperties.likes = JSON.stringify({
          ...likes,
          [userId]: {liked: true, timestamp: Date.now()}
        });
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'dislike',
      handle: function handleDislike(ctx) {
        if (ctx.currentUser.login === 'guest') {
          return;
        }

        const likes = JSON.parse(ctx.article.extensionProperties.likes);
        const userId = ctx.currentUser.ringId;
        ctx.article.extensionProperties.likes = JSON.stringify({
          ...likes,
          [userId]: {liked: false, timestamp: Date.now()}
        });
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'feedback',
      handle: function handleFeedback(ctx) {
        if (ctx.currentUser.login === 'guest') {
          return;
        }

        const likes = JSON.parse(ctx.article.extensionProperties.likes);
        const userId = ctx.currentUser.ringId;
        const message = ctx.request.getParameter('message');
        ctx.article.extensionProperties.likes = JSON.stringify({
          ...likes,
          [userId]: {
            liked: false,
            message,
            timestamp: Date.now()
          }
        });
      }
    }
  ]
};
