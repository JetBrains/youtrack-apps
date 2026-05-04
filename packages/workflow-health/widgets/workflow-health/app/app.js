import 'babel-polyfill';
import DashboardAddons from 'hub-dashboard-addons';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {render} from 'react-dom';
import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';

import styles from './app.css';

import Content from './content';

class Widget extends Component {
  static getWidgetTitle = (homeUrl, counter) => ({
    text: 'Workflow Health Monitor',
    href: `${homeUrl}/admin/workflows`,
    counter
  });

  static propTypes = {
    dashboardApi: PropTypes.object,
    registerWidgetApi: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {isLoading: true, homeUrl: ''};
    this.loadGeneration = 0;

    props.registerWidgetApi({
      onRefresh: () => this.refresh()
    });
  }

  componentDidMount() {
    this.initialize();
  }

  async initialize() {
    const {dashboardApi} = this.props;
    this.setState({isLoading: true, error: undefined});

    try {
      const {contextPath} = await dashboardApi.fetchYouTrack('config?fields=contextPath');
      this.setState({homeUrl: contextPath || ''});
      this.loadPermissions();
    } catch (error) {
      this.setState({error, isLoading: false});
    }
  }

  refresh() {
    this.loadGeneration++;
    this.setState(
      {isLoading: true, brokenProjects: undefined, error: undefined},
      () => this.loadPermissions()
    );
  }

  loadPermissions() {
    const fields = 'id,project(id)';
    const query = 'permission:jetbrains.jetpass.project-update';
    const url = `api/rest/users/me/sourcedprojectroles?top=-1&fields=${fields}&query=${query}`;
    const generation = this.loadGeneration;

    this.props.dashboardApi.fetchHub(url).then(response => {
      if (generation !== this.loadGeneration) {
        return;
      }
      const roles = response.sourcedprojectroles;
      if (!roles || !roles.length) {
        this.setState({hasPermission: false, isLoading: false});
        return;
      }
      const permittedProjects = new Set(roles.map(role => role.project.id));
      this.setState(
        {hasPermission: true, permittedProjects},
        () => this.loadWorkflows()
      );
    }).catch(error => {
      if (generation !== this.loadGeneration) {
        return;
      }
      this.setState({error, isLoading: false});
    });
  }

  loadWorkflows() {
    const fields = 'id,name,title,usages(project(id,ringId,name),isBroken)';
    const url = `api/admin/workflows?$top=-1&fields=${fields}`;
    const generation = this.loadGeneration;

    this.props.dashboardApi.fetchYouTrack(url).then(workflows => {
      if (generation !== this.loadGeneration) {
        return;
      }
      const {permittedProjects} = this.state;
      const hasGlobalPermission = permittedProjects.has('0');
      const brokenProjectsSet = {};

      workflows.forEach(workflow => {
        workflow.usages.filter(usage => usage.isBroken).forEach(usage => {
          const {id, name, ringId} = usage.project;
          if (!hasGlobalPermission && !permittedProjects.has(ringId)) {
            return;
          }
          if (!brokenProjectsSet[id]) {
            brokenProjectsSet[id] = {id, name, ringId, wfs: {}};
          }
          brokenProjectsSet[id].wfs[workflow.id] = {
            id: workflow.id,
            name: workflow.name,
            title: workflow.title,
            loading: true,
            problems: []
          };
        });
      });

      const brokenProjects = Object.values(brokenProjectsSet);
      this.setState({brokenProjects, isLoading: false});

      brokenProjects.forEach(project => {
        this.loadRules(project, generation).
          then(updated => {
            if (generation !== this.loadGeneration || !updated) {
              return;
            }
            this.setState({brokenProjects});
          });
      });
    }).catch(error => {
      if (generation !== this.loadGeneration) {
        return;
      }
      this.setState({error, isLoading: false});
    });
  }

  loadRules(project, generation) {
    const fields = 'rule(id,workflow(id,name)),isBroken,problems(id,message)';
    const url = `api/admin/projects/${project.id}/workflowRules?$top=-1&fields=${fields}`;

    return this.props.dashboardApi.fetchYouTrack(url).then(usages => {
      if (generation !== this.loadGeneration) {
        return null;
      }
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
    }).catch(() => null);
  }

  removeWidget = () =>
    this.props.dashboardApi.removeWidget();

  renderContent = () => (
    <Content
      brokenProjects={this.state.brokenProjects}
      hasPermission={this.state.hasPermission}
      isLoading={this.state.isLoading}
      error={this.state.error}
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
