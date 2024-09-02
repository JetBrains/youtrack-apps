export interface User {
  isGuest: boolean;
  liked?: boolean;
  leftMessage: boolean;
}

export interface Project {
  projectKey: string;
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

export interface YTPermission {
  global: boolean;
  permission: {key: string};
  projects: {shortName: string}[] | null;
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

const READ_USER_PERMISSION = 'jetbrains.jetpass.user-read';

export default class API {
  project?: Project;
  permissions?: YTPermission[];

  constructor(private host: YTPluginHost) {
  }

  async loadProject() {
    this.project = await this.getProject();
  }

  async loadPermissions() {
    this.permissions = await this.getYtPermissions();
  }

  hasPermission(permission: string) {
    if (!this.project) {
      throw new Error('Project isn\'t loaded');
    }

    if (!this.permissions) {
      throw new Error('Permissions aren\'t loaded');
    }

    const project = this.project;

    return this.permissions.some(it =>
      it.permission.key === permission && (
        it.global ||
        it.projects?.some(pr => pr.shortName === project.projectKey)
      )
    );
  }

  canReadUser() {
    return this.hasPermission(READ_USER_PERMISSION);
  }

  getDebug() {
    return this.host.fetchApp('backend/debug', {scope: true});
  }

  getUser() {
    return this.host.fetchApp('backend/user', {scope: true}) as Promise<User>;
  }

  getProject() {
    return this.host.fetchApp('backend/project', {scope: true}) as Promise<Project>;
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

  getYtPermissions() {
    return this.host.fetchYouTrack('permissions/cache?fields=global,permission(key),projects(shortName)') as Promise<YTPermission[]>;
  }
}
