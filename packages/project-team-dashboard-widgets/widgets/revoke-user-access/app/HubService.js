class HubService {
  // eslint-disable-next-line no-magic-numbers
  static DEFAULT_TOP = 20;

  constructor(fetchHub) {
    this.fetchHub = fetchHub;
  }

  async requestHubURL() {
    const hubService = await this.fetchHub(
      'api/rest/services/0-0-0-0-0', {
        query: {
          fields: 'homeUrl'
        }
      }
    );

    let hubURL = hubService.homeUrl;
    hubURL = hubURL && hubURL.replace(/\/$/, '');
    return hubURL;
  }

  async requestUserPage(query, skip, top = HubService.DEFAULT_TOP) {
    return this.fetchHub(
      'api/rest/users', {
        query: {
          query,
          fields: 'id,login,name,profile(avatar,email(email)),total',
          orderBy: 'login',
          $skip: skip,
          $top: top
        }
      }
    );
  }

  requestUser(userId) {
    return this.fetchHub(
      `api/rest/users/${userId}`, {
        query: {
          fields: 'id,login,name,banned,banReason,profile(avatar,email(email,verified)),' +
            'groups(id,name),' +
            'teams(id,project(id,name)),' +
            'projectRoles(id,project(id,name),role(id,name)),' +
            'details(id,authModuleName,lastAccessTime,login,email,userid,commonName,nameId,fullName)'
        }
      });
  }

  async usersQueryAssistSource(args) {
    return this.fetchHub(
      'api/rest/users/queryAssist',
      {
        query: {
          ...args,
          fields: `query,caret,styleRanges${args.omitSuggestions ? '' : ',suggestions'}`
        }
      }
    );
  }

  async removeFromGroup(group, user) {
    return this.fetchHub(
      `api/rest/usergroups/${group.id}/users/${user.id}`, {
        method: 'DELETE'
      });
  }

  async removeFromTeam(team, user) {
    return this.fetchHub(
      `api/rest/projectteams/${team.id}/ownUsers/${user.id}`, {
        method: 'DELETE'
      });
  }

  async revokeProjectRole(user, projectRole) {
    return this.fetchHub(
      `api/rest/users/${user.id}/projectroles/${projectRole.id}`, {
        method: 'DELETE'
      });
  }

  async removeLogin(user, login) {
    return this.fetchHub(
      `api/rest/users/${user.id}/userdetails/${login.id}`, {
        method: 'DELETE'
      });
  }
}

export default HubService;
