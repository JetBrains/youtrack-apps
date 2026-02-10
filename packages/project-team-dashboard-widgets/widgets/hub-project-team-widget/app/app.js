import DashboardAddons from 'hub-dashboard-addons';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {render} from 'react-dom';
import Select from '@jetbrains/ring-ui/components/select/select';
import Link from '@jetbrains/ring-ui/components/link/link';
import Avatar, {Size} from '@jetbrains/ring-ui/components/avatar/avatar';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';

import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import EmptyWidget, {EmptyWidgetFaces} from '@jetbrains/hub-widget-ui/dist/empty-widget';
import ConfigurationForm from '@jetbrains/hub-widget-ui/dist/configuration-form';
import Permissions from '@jetbrains/hub-widget-ui/dist/permissions';

import {initTranslations} from './translations';
import styles from './app.css';

class Widget extends Component {
  static propTypes = {
    dashboardApi: PropTypes.object,
    permissions: PropTypes.object,
    registerWidgetApi: PropTypes.func
  };

  constructor(props) {
    super(props);
    const {registerWidgetApi} = props;

    this.state = {
      isConfiguring: false,
      selectedProject: null,
      projects: [],
      users: [],
      owner: null,
      homeUrl: null
    };

    registerWidgetApi({
      onConfigure: () => this.setState({isConfiguring: true}),
      getExternalWidgetOptions: () => ({authClientId: '0-0-0-0-0'})
    });
  }

  componentDidMount() {
    const {dashboardApi} = this.props;
    this.initialize(this.props.dashboardApi);
    Permissions.init(dashboardApi).then(() => this.setState({permissions: Permissions}));
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      nextState.selectedProject &&
      (!this.state.selectedProject ||
      this.state.selectedProject.key !== nextState.selectedProject.key)
    ) {
      this.loadProjectTeam(nextState.selectedProject.key);
    }
  }

  updateTitle() {
    const {teamName, users, homeUrl, selectedProject} = this.state;

    if (!teamName || !users || !selectedProject) {
      return this.setState({title: undefined});
    }

    const href = homeUrl
      ? `${homeUrl}/projects/${selectedProject.key}?tab=people`
      : undefined;

    const title = {text: teamName, href, counter: users.length};
    return this.setState({title});
  }

  async loadProjectTeam(projectId) {
    const {dashboardApi} = this.props;

    const project = await dashboardApi.fetchYouTrack(
      `admin/projects/${projectId}`, {
        query: {
          fields: 'team(name,users(id,login,name,avatarUrl,email)),leader(id)'
        }
      }
    );

    const teamMembers = (project.team.users || []);

    const owner = project.leader
      ? teamMembers.filter(user => user.id === project.leader.id)[0]
      : null;

    const users = teamMembers.
      filter(user => user !== owner).
      sort((a, b) => a.name.localeCompare(b.name));

    if (owner) {
      users.unshift(owner);
    }

    this.setState({users, owner, teamName: project.team.name}, () => this.updateTitle());
  }

  async initialize(dashboardApi) {
    const [projects, {systemSettings: {baseUrl}}, {contextPath}, config] = await Promise.all([
      dashboardApi.fetchYouTrack(
        'admin/projects', {
          query: {
            fields: 'id,name',
            orderBy: 'name',
            $top: -1
          }
        }
      ),
      dashboardApi.fetchYouTrack('admin/globalSettings?fields=systemSettings(baseUrl)'),
      dashboardApi.fetchYouTrack('config?fields=contextPath'),
      dashboardApi.readConfig()
    ]);

    const root = contextPath ? `${contextPath}/` : '';
    const homeUrl = `${baseUrl}${root}`;

    this.setState({projects, homeUrl}, () => this.updateTitle());

    if (!config) {
      dashboardApi.enterConfigMode();
      this.setState({isConfiguring: true});
      return;
    }

    const {selectedProject} = config;

    this.setState({selectedProject});

    this.loadProjectTeam(selectedProject.key);
  }

  saveConfig = async () => {
    const {selectedProject} = this.state;
    await this.props.dashboardApi.storeConfig({selectedProject});
    this.setState({isConfiguring: false});
  };

  cancelConfig = async () => {
    const {dashboardApi} = this.props;

    const config = await dashboardApi.readConfig();
    if (!config) {
      dashboardApi.removeWidget();
    } else {
      this.setState({isConfiguring: false});
      await dashboardApi.exitConfigMode();
      this.initialize(dashboardApi);
    }
  };

  changeProject = selectedProject => this.setState({selectedProject});

  renderConfiguration = () => {
    const {projects, selectedProject} = this.state;

    const data = projects.map(project => ({
      key: project.id,
      label: project.name
    }));

    return (
      <ConfigurationForm
        onCancel={this.cancelConfig}
        onSave={this.saveConfig}
        isInvalid={!selectedProject}
      >
        <Select
          size={Select.Size.FULL}
          data={data}
          selected={selectedProject}
          onChange={this.changeProject}
          label={i18n('Select a project')}
          filter={true}
        />
      </ConfigurationForm>
    );
  };

  renderNoTeamWidgetContent = () => {
    const {selectedProject} = this.state;

    const noProjectMessage = selectedProject && selectedProject.label
      ? i18n(
        'The {{projectName}} project team doesn\'t have any members',
        {projectName: selectedProject.label}
      )
      : i18n('This project team doesn\'t have any members');

    return (
      <EmptyWidget
        face={EmptyWidgetFaces.OK}
        message={noProjectMessage}
      />
    );
  };

  renderNoPermissionsWidgetContent = canReadUsers => {
    const noPermissionsMessage = canReadUsers
      ? i18n('You don\'t have permission to view basic project data')
      : i18n('You don\'t have permission to view basic profile data for other users');
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.ERROR}
        message={noPermissionsMessage}
      />
    );
  };

  renderEmptyWidgetContent = () => {
    const {permissions, selectedProject} = this.state;

    const projectId = (selectedProject || {}).id;
    const canReadUsers = permissions && permissions.has(
      'jetbrains.jetpass.user-read-basic', projectId
    );
    const canReadProject = permissions && permissions.has(
      'jetbrains.jetpass.project-read-basic', projectId
    );
    if (canReadUsers && canReadProject) {
      return this.renderNoTeamWidgetContent();
    }
    return this.renderNoPermissionsWidgetContent(canReadUsers);
  };

  renderUser = user => {
    const {homeUrl} = this.state;

    return (
      <div key={user.id} className={styles.user}>
        <div className={styles.userAvatar}>
          <Avatar
            style={{verticalAlign: 'middle'}}
            url={user.avatarUrl}
            size={Size.Size32}
          />
        </div>

        <div className={styles.userInfo}>
          <div>
            <Link href={`${homeUrl}/users/${user.id}`} target="_top">{user.name}</Link>
          </div>

          <div className={styles.userEmail}>
            {user.email}
          </div>
        </div>
      </div>
    );
  };

  renderOwnerSection = (owner, ownerIsInTeam) =>
    ownerIsInTeam && (
      <div className={styles.listSection}>
        <div className={styles.listSectionHeader}>
          {i18n('project owner')}
        </div>
        { this.renderUser(owner) }
      </div>
    );

  renderRestOfTeamSection = (restOfTeam, ownerIsInTeam) =>
    !!restOfTeam.length && (
      <div className={styles.listSection}>
        {ownerIsInTeam && (
          <div className={styles.listSectionHeader}>
            {i18n('team')}
          </div>
        )}
        {restOfTeam.map(user => (this.renderUser(user)))}
      </div>
    );

  renderContent = () => {
    const {users, owner, homeUrl, permissions} = this.state;

    if (!users || !permissions || !permissions.isInitialized() || !homeUrl) {
      return (<LoaderInline/>);
    }

    if (!users.length) {
      return this.renderEmptyWidgetContent();
    }

    const restOfTeam = (users || []).filter(
      user => user.id !== (owner || {}).id
    );
    const ownerIsInTeam = (users.length - restOfTeam.length) === 1;

    return (
      <div className={styles.widget}>
        { this.renderOwnerSection(owner, ownerIsInTeam) }
        { this.renderRestOfTeamSection(restOfTeam, ownerIsInTeam) }
      </div>
    );
  };

  render() {
    return (
      <div className={styles.widget}>
        <ConfigurableWidget
          isConfiguring={this.state.isConfiguring}
          dashboardApi={this.props.dashboardApi}
          widgetTitle={this.state.title}
          widgetLoader={!this.state.users}
          Configuration={this.renderConfiguration}
          Content={this.renderContent}
        />
      </div>
    );
  }
}

DashboardAddons.registerWidget((dashboardApi, registerWidgetApi) => {
  initTranslations(DashboardAddons.locale);

  render(
    <Widget
      dashboardApi={dashboardApi}
      registerWidgetApi={registerWidgetApi}
    />,
    document.getElementById('app-container')
  );
});
