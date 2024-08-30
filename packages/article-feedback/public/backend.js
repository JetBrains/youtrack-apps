function getFeedback(ctx) {
  return JSON.parse(ctx.article.extensionProperties.feedback) ?? [];
}

function getGuestFeedback(ctx) {
  return JSON.parse(ctx.article.extensionProperties.guestFeedback) ?? [];
}

function getGuestLikes(ctx) {
  return Number(JSON.parse(ctx.article.extensionProperties.guestLikes) ?? 0);
}

function isGuest(ctx) {
  return ctx.currentUser.login === 'guest';
}

function getUserId(ctx) {
  return ctx.currentUser.ringId;
}

function updateFeedback(ctx, liked, message) {
  const feedback = getFeedback(ctx);
  const timestamp = Date.now();
  const userId = getUserId(ctx);

  feedback.push({userId, liked, message, timestamp});

  ctx.article.extensionProperties.feedback = JSON.stringify(feedback);
}

function updateGuestFeedback(ctx, liked, message, name, email) {
  const guestFeedback = getGuestFeedback(ctx);
  const timestamp = Date.now();

  guestFeedback.push({name, email, liked, message, timestamp});

  ctx.article.extensionProperties.guestFeedback = JSON.stringify(guestFeedback);
}

function updateGuestLikes(ctx) {
  const guestLikes = getGuestLikes(ctx);
  ctx.article.extensionProperties.guestLikes = String(guestLikes + 1);
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
          guestFeedback: getGuestFeedback(ctx),
          guestLikes: getGuestLikes(ctx)
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
        const userFeedback = feedback.filter(it => it.userId === userId);
        const lastUserFeedback = userFeedback[userFeedback.length - 1];
        response(ctx, {
          liked: lastUserFeedback?.liked ?? undefined,
          leftMessage: Boolean(lastUserFeedback?.message),
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

        const message = ctx.request.getParameter('message');
        updateFeedback(ctx, false, message);
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'guest-like',
      handle: function handleGuestLike(ctx) {
        if (!isGuest(ctx)) {
          return;
        }

        updateGuestLikes(ctx);
      }
    },

    {
      scope: 'article',
      method: 'POST',
      path: 'guest-dislike',
      handle: function handleGuestDislike(ctx) {
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
        const guestLikes = getGuestLikes(ctx);

        const lastFeedbackOfEachUser = feedback.
          sort((a, b) => b.timestamp - a.timestamp).
          filter(({userId}, i) => i === feedback.findIndex((it) => it.userId === userId));

        const lastFeedbackOfEachGuest = guestFeedback.
          sort((a, b) => b.timestamp - a.timestamp).
          filter(({email}, i) => !email || i === guestFeedback.findIndex((it) => it.email === email));

        const likes = [...lastFeedbackOfEachUser, ...lastFeedbackOfEachGuest].filter(it => it.liked).length;
        const dislikes = [...lastFeedbackOfEachUser, ...lastFeedbackOfEachGuest].filter(it => !it.liked).length;

        const messages = feedback.filter(it => it.message);
        const guestMessages = guestFeedback.filter(it => it.message);

        response(ctx, {likes, guestLikes, dislikes, messages, guestMessages});
      }
    }
  ]
};
