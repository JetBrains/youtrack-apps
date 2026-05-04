import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import EmptyWidget, {EmptyWidgetFaces} from '@jetbrains/hub-widget-ui/dist/empty-widget';
import {WarningIcon} from '@jetbrains/ring-ui/components/icon';

import styles from './app.css';

export default class Content extends Component {

  static getName = entity =>
    (typeof entity === 'object'
      ? (entity.title || entity.name || entity.message || '')
      : (entity || ''));

  static sortByNameComparator = (a, b) => {
    const aName = Content.getName(a).toLowerCase();
    const bName = Content.getName(b).toLowerCase();
    if (aName > bName) {
      return 1;
    }
    if (aName < bName) {
      return -1;
    }
    return 0;
  };

  static getProjectsSortedModel = projects => {
    return (projects || []).sort(Content.sortByNameComparator).
      map(withSortedWorkflows);

    function withSortedWorkflows(project) {
      return {
        id: project.id,
        ringId: project.ringId,
        name: project.name,
        workflows: Object.keys(project.wfs).
          map(key => project.wfs[key]).
          map(withSortedProblems).
          sort(Content.sortByNameComparator)
      };
    }

    function withSortedProblems(workflow) {
      return {
        id: workflow.id,
        loading: workflow.loading,
        title: workflow.title,
        name: workflow.name,
        problems: (workflow.problems || []).
          sort(Content.sortByNameComparator)
      };
    }
  };

  static propTypes = {
    brokenProjects: PropTypes.array,
    hasPermission: PropTypes.bool,
    isLoading: PropTypes.bool,
    homeUrl: PropTypes.string.isRequired,
    onRemove: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {projects: []};
  }

  static getDerivedStateFromProps(props) {
    return {
      projects: Content.getProjectsSortedModel(
        props.brokenProjects
      )
    };
  }

  renderNoPermissionsMessage() {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.OK}
        message={'You have no project admin permissions'}
      >
        <Link
          pseudo
          onClick={this.props.onRemove}
        >
          {'Remove widget'}
        </Link>
      </EmptyWidget>
    );
  }

  renderProject(project) {
    return (
      <div
        key={`project-${project.id}`}
        className={styles.project}
      >
        <div className={styles.projectHeader}>
          <Link
            pseudo={false}
            target={'_top'}
            href={this.projectSettingsUrl(project.ringId)}
          >
            {project.name}
          </Link>
        </div>
        {this.renderWorkflows(project.workflows)}
      </div>
    );
  }

  renderSuccessMessage() {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.HAPPY}
        message={'Workflows are fine!'}
      />
    );
  }

  renderWorkflows(workflows) {
    return (
      <div>
        {workflows.map(workflow => (
          <div className={styles.widget} key={`workflow-${workflow.id}`}>
            <div className={styles.workflowName}>
              <WarningIcon
                className={styles.workflowNameIcon}
                color={WarningIcon.Color.RED}
                size={WarningIcon.Size.Size12}
              />
              {Content.getName(workflow)}
            </div>
            <div className={styles.errorList}>
              {this.renderProblems(workflow)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  renderProblems(workflow) {
    if (workflow.loading) {
      return (
        <div className={styles.errorListLine}>
          {'Loading...'}
        </div>
      );
    }

    return (
      <div>
        {workflow.problems.map(problem => (
          <div
            key={`problem-${problem.id}`}
            className={styles.errorListLine}
            title={problem.message}
          >
            {problem.message}
          </div>
        ))}
      </div>
    );
  }

  projectSettingsUrl(projectRingId) {
    return `${this.props.homeUrl}admin/editProject/${projectRingId}?tab=workflow`;
  }

  render() {
    const {isLoading, hasPermission} = this.props;
    const {projects} = this.state;

    if (isLoading) {
      return (<LoaderInline/>);
    }
    if (!hasPermission) {
      return this.renderNoPermissionsMessage();
    }
    if (projects && projects.length) {
      return (
        <div>
          {projects.map(
            project => this.renderProject(project)
          )}
        </div>
      );
    }
    return this.renderSuccessMessage();
  }
}
