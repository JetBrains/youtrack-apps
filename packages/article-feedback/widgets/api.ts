export interface User {
  isGuest: boolean;
  liked?: boolean;
  leftMessage: boolean;
}

export interface Stat {
  likes: number;
  guestLikes: number;
  dislikes: number;
  messages: Array<{
    userId: string;
    message: string;
    timestamp: number;
  }>;
  guestMessages: Array<{
    name: string;
    email?: string;
    message: string;
    timestamp: number;
  }>;
}

export interface YTUser {
  id: string;
  ringId: string;
  fullName: string;
}

export interface YTConfig {
  contextPath: string;
}

export interface YTUserProfile {
  profiles: {
    general: {
      dateFieldFormat: {
        pattern: string;
      }
    }
  };
}

export default class API {
  constructor(private host: YTPluginHost) {
  }

  getDebug() {
    return this.host.fetchApp('backend/debug', {scope: true});
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

  postGuestLike() {
    return this.host.fetchApp('backend/guest-like', {scope: true, method: 'post'}) as Promise<void>;
  }

  postDislike(message: string) {
    return this.host.fetchApp('backend/dislike', {
      scope: true,
      method: 'post',
      query: {message}
    }) as Promise<void>;
  }

  postGuestDislike(
    message: string,
    userName: string,
    userEmail: string
  ) {
    return this.host.fetchApp('backend/guest-dislike', {
      scope: true,
      method: 'post',
      query: {message, userName, userEmail}
    }) as Promise<void>;
  }

  getYtUsers(ids: string[]) {
    return Promise.all(
      ids.map(
        id => this.host.fetchYouTrack(`users/${id}?fields=id,ringId,fullName`) as Promise<YTUser>
      )
    );
  }

  getYtConfig() {
    return this.host.fetchYouTrack('config?fields=contextPath') as Promise<YTConfig>;
  }

  getYtUserProfile() {
    return this.host.fetchYouTrack('users/me?fields=profiles(general(dateFieldFormat(pattern)))') as Promise<YTUserProfile>;
  }
}
