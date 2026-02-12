class HubService {
  // eslint-disable-next-line no-magic-numbers
  static DEFAULT_TOP = 20;

  constructor(fetchHub, fetchYouTrack) {
    this.fetchHub = fetchHub;
    this.fetchYouTrack = fetchYouTrack;
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

  async requestUser(userId) {
    const ytUser = await this.fetchYouTrack(
      `users/${userId}`, {
        query: {
          fields: 'id,ringId,login,name,banned,banReason,avatarUrl,email,isEmailVerified,' +
          'ownGroups(id,name),' +
          'ownTeams(id,project(id,name)),' +
          'transitiveRoles(id,scope(project(id,name),organization(id,name)),role(id,name))'
        }
      });

    const hubUserDetails = await this.fetchHub(
      `api/rest/users/${ytUser.ringId}`, {
        query: {
          fields: 'details(id,authModuleName,lastAccessTime,login,email,userid,commonName,nameId,fullName)'
        }
      });

    return {...ytUser, ...hubUserDetails};
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
    return this.fetchYouTrack(
      `groups/${group.id}/ownUsers/${user.id}`, {
        method: 'DELETE'
      });
  }

  async removeFromTeam(team, user) {
    return this.fetchYouTrack(
      `admin/projects/${team.project.id}/team/ownUsers/${user.id}`, {
        method: 'DELETE'
      });
  }

  async revokeProjectRole(assignedRole) {
    return this.fetchYouTrack(
      `assignedRoles/${assignedRole.id}`, {
        method: 'DELETE'
      });
  }

  async removeLogin(user, login) {
    return this.fetchHub(
      `api/rest/users/${user.ringId}/userdetails/${login.id}`, {
        method: 'DELETE'
      });
  }
}

export default HubService;
