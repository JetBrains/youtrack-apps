export interface Project {
  projectKey: string;
}

export interface User {
  isGuest: boolean;
  liked?: boolean;
  leftMessage?: boolean;
}

export interface Stat {
  likes: boolean;
  dislikes: boolean;
  messages: Array<{userId: string; message: string; timestamp: string}>;
  guestMessages: Array<{
    name: string;
    email?: string;
    message: string;
    timestamp: string;
  }>;
}

export default class API {
  constructor(private host: YTPluginHost) {
  }

  getDebug() {
    return this.host.fetchApp('backend/debug', {scope: true});
  }

  getProject() {
    return this.host.fetchApp('backend/project', {
      scope: true
    }) as Promise<Project>;
  }

  getUser() {
    return this.host.fetchApp('backend/user', {scope: true}) as Promise<User>;
  }

  getStat() {
    return this.host.fetchApp('backend/stat', {scope: true}) as Promise<Stat>;
  }

  postLike() {
    return this.host.fetchApp('backend/like', {scope: true, method: 'post'}) as Promise<void>;
  }

  postDislike() {
    return this.host.fetchApp('backend/dislike', {scope: true, method: 'post'}) as Promise<void>;
  }

  postFeedback(message: string) {
    return this.host.fetchApp('backend/feedback', {scope: true, method: 'post', query: {message}}) as Promise<void>;
  }

  postGuestFeedback(
    message: string,
    userName: string,
    userEmail: string
  ) {
    return this.host.fetchApp('backend/guest-feedback', {
      scope: true,
      method: 'post',
      query: {message, userName, userEmail}
    }) as Promise<void>;
  }
}
