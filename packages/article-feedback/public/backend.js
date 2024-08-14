function getFeedback(ctx) {
  return JSON.parse(ctx.article.extensionProperties.feedback) || {};
}

function getGuestFeedback(ctx) {
  return JSON.parse(ctx.article.extensionProperties.guestFeedback) || [];
}

function isGuest(ctx) {
  return ctx.currentUser.login === 'guest';
}

function getUserId(ctx) {
  return ctx.currentUser.ringId;
}

function getProjectKey(ctx) {
  return ctx.project.key;
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

function updateGuestFeedback(ctx, liked, message, name, email) {
  const guestFeedback = getGuestFeedback(ctx);
  const timestamp = Date.now();

  guestFeedback.push({name, email, liked, message, timestamp});

  ctx.article.extensionProperties.guestFeedback = JSON.stringify(guestFeedback);
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
        response(ctx, {
          feedback: getFeedback(ctx),
          guestFeedback: getGuestFeedback(ctx)
        });
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
      method: 'GET',
      path: 'project',
      handle: function handleProject(ctx) {
        response(ctx, {
          projectKey: getProjectKey(ctx)
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
      method: 'POST',
      path: 'guest-feedback',
      handle: function handleFeedback(ctx) {
        if (!isGuest(ctx)) {
          return;
        }

        const message = ctx.request.getParameter('message');
        const name = ctx.request.getParameter('userName');
        const email = ctx.request.getParameter('userEmail');
        updateGuestFeedback(ctx, false, message, name, email);
      }
    },

    {
      scope: 'article',
      method: 'GET',
      path: 'stat',
      handle: function handleStat(ctx) {
        const feedback = getFeedback(ctx);
        const guestFeedback = getGuestFeedback(ctx);

        const likes = Object.values(feedback).filter(
          (it) => it.liked
        ).length;

        const dislikes = Object.values(feedback).filter(
          (it) => it.liked === false
        ).length;

        const messages = Object.entries(feedback).
          filter(it => it[1].message).
          sort((a, b) => a[1].timestamp - b[1].timestamp).
          map(it => ({
            userId: it[0],
            message: it[1].message,
            timestamp: it[1].timestamp
          }));

        const guestMessages = guestFeedback.
          filter(it => it.message).
          map(it => ({
            name: it.name,
            email: it.email,
            message: it.message,
            timestamp: it.timestamp
          }));

        response(ctx, {likes, dislikes, messages, guestMessages});
      }
    }
  ]
};
