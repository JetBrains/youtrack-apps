import DashboardAddons from 'hub-dashboard-addons';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {render} from 'react-dom';
import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';

import styles from './app.css';

import Content from './content';

class Widget extends Component {
  static getWidgetTitle = (homeUrl, counter) => {
    const defaultTitle = 'Workflow Health Monitor';
    const href = homeUrl ? `${homeUrl}admin/workflows` : undefined;
    return {text: defaultTitle, href, counter};
  };

  static propTypes = {
    dashboardApi: PropTypes.object,
    registerWidgetApi: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      homeUrl: ''
    };

    props.registerWidgetApi({
      onRefresh: () => this.refresh()
    });
  }

  componentDidMount() {
    this.initialize();
  }

  async initialize() {
    const {dashboardApi} = this.props;
    this.setState({isLoading: true});

    const {contextPath} = await dashboardApi.fetchYouTrack('config?fields=contextPath');
    const homeUrl = contextPath ? `${contextPath}/` : '';
    this.setState({homeUrl});

    this.loadPermissions();
  }

  refresh() {
    this.setState({isLoading: true, brokenProjects: undefined}, () =>
      this.loadPermissions()
    );
  }

  loadPermissions() {
    const fields = 'id,project(id)';
    const query = 'permission:jetbrains.jetpass.project-update';
    const url = `api/rest/users/me/sourcedprojectroles?top=-1&fields=${fields}&query=${query}`;

    this.props.dashboardApi.fetchHub(url).then(response => {
      const roles = response.sourcedprojectroles;
      if (!roles || !roles.length) {
        this.setState({hasPermissions: false, isLoading: false});
      } else {
        const permittedProjects = [...new Set(roles.map(role => role.project.id))];
        this.setState({
          hasGlobalPermission: permittedProjects.indexOf('0') !== -1,
          hasPermissions: true,
          permittedProjects
        }, () => this.loadWorkflows());
      }
    });
  }

  loadWorkflows() {
    const fields = 'id,name,title,usages(project(id,ringId,name),isBroken)';
    const url = `api/admin/workflows?$top=-1&fields=${fields}`;

    this.props.dashboardApi.fetchYouTrack(url).then(workflows => {
      const brokenProjectsSet = {};
      const {hasGlobalPermission, permittedProjects} = this.state;

      workflows.forEach(workflow => {
        if (workflow.usages.length) {
          if (workflow.usages.find(usage => usage.isBroken)) {
            const projects = workflow.usages.filter(usage => usage.isBroken).
              map(usage => ({
                id: usage.project.id,
                name: usage.project.name,
                ringId: usage.project.ringId,
                wfs: {}
              }));
            projects.forEach(project => {
              if (hasGlobalPermission ||
                permittedProjects.indexOf(project.ringId) !== -1) {
                if (!brokenProjectsSet[project.id]) {
                  brokenProjectsSet[project.id] = project;
                }
                brokenProjectsSet[project.id].wfs[workflow.id] = {
                  id: workflow.id,
                  name: workflow.name,
                  title: workflow.title,
                  loading: true,
                  problems: []
                };
              }
            });
          }
        }
      });

      const brokenProjects = Object.keys(brokenProjectsSet).map(
        projectId => brokenProjectsSet[projectId]
      );
      this.setState({brokenProjects, isLoading: false});

      brokenProjects.forEach(project => {
        this.loadRules(project).
          then(() => this.setState({brokenProjects}));
      });
    });
  }

  loadRules(project) {
    const fields = 'rule(id,workflow(id,name)),isBroken,problems(id,message)';
    const url = `api/admin/projects/${project.id}/workflowRules?$top=-1&fields=${fields}`;

    return this.props.dashboardApi.fetchYouTrack(url).then(usages => {
      usages.filter(usage => usage.isBroken).forEach(usage => {
        const wfId = usage.rule.workflow.id;
        const problems = project.wfs[wfId].problems;
        usage.problems.forEach(usageProblem => {
          const exists = problems.some(
            problem => problem.message === usageProblem.message
          );
          if (!exists) {
            problems.push(usageProblem);
          }
        });
        project.wfs[wfId].loading = false;
      });

      return project;
    });
  }

  removeWidget = () =>
    this.props.dashboardApi.removeWidget();

  renderContent = () => (
    <Content
      brokenProjects={this.state.brokenProjects}
      hasPermission={this.state.hasPermissions}
      isLoading={this.state.isLoading}
      homeUrl={this.state.homeUrl}
      onRemove={this.removeWidget}
    />
  );

  render() {
    const {brokenProjects, homeUrl, isLoading} = this.state;

    const counter = brokenProjects ? brokenProjects.length : undefined;
    const title = Widget.getWidgetTitle(homeUrl, counter);

    return (
      <div className={styles.widget}>
        <ConfigurableWidget
          isConfiguring={false}
          dashboardApi={this.props.dashboardApi}
          widgetLoader={isLoading}
          widgetTitle={title}
          Configuration={() => null}
          Content={this.renderContent}
        />
      </div>
    );
  }
}

DashboardAddons.registerWidget((dashboardApi, registerWidgetApi) =>
  render(
    <Widget
      dashboardApi={dashboardApi}
      registerWidgetApi={registerWidgetApi}
    />,
    document.getElementById('app-container')
  )
);
