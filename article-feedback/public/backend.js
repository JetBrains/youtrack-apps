function getFeedback(ctx) {
  return JSON.parse(ctx.article.extensionProperties.feedback) || {};
}

function isGuest(ctx) {
  return ctx.currentUser.login === 'guest';
}

function getUserId(ctx) {
  return ctx.currentUser.ringId;
}

function updateFeedback(ctx, liked, message) {
  const feedback = getFeedback(ctx);
  const userId = getUserId(ctx);
  const timestamp = Date.now();

  ctx.article.extensionProperties.feedback = JSON.stringify({
    ...feedback,
    [userId]: {
      liked: liked ?? feedback[userId]?.liked,
      message,
      timestamp
    }
  });
}

function response(ctx, data) {
  return ctx.response.json(data);
}

exports.httpHandler = {
  endpoints: [
    {
      scope: 'article',
      method: 'GET',
      path: 'debug',
      handle: function handleDebug(ctx) {
        response(ctx, getFeedback(ctx));
      }
    },

    {
      scope: 'article',
      method: 'GET',
      path: 'user',
      handle: function handleUser(ctx) {
        const feedback = getFeedback(ctx);
        const userId = getUserId(ctx);
        const userFeedback = feedback[userId];
        response(ctx, {
          liked: userFeedback?.liked ?? undefined,
          leftMessage: Boolean(userFeedback?.message),
          isGuest: isGuest(ctx)
        });
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'like',
      handle: function handleLike(ctx) {
        if (isGuest(ctx)) {
          return;
        }

        updateFeedback(ctx, true);
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'dislike',
      handle: function handleDislike(ctx) {
        if (isGuest(ctx)) {
          return;
        }

        updateFeedback(ctx, false);
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'feedback',
      handle: function handleFeedback(ctx) {
        if (isGuest(ctx)) {
          return;
        }

        const message = ctx.request.getParameter('message');
        updateFeedback(ctx, undefined, message);
      }
    },

    {
      scope: 'article',
      method: 'GET',
      path: 'stat',
      handle: function handleStat(ctx) {
        const feedback = getFeedback(ctx);

        const likes = Object.values(feedback).filter(
          (it) => it.liked
        ).length;

        const dislikes = Object.values(feedback).filter(
          (it) => it.liked === false
        ).length;

        const messages = Object.values(feedback).
          filter((it) => it.message).
          sort((a, b) => a.timestamp - b.timestamp).
          map((it) => it.message);

        response(ctx, {likes, dislikes, messages});
      }
    }
  ]
};
