import 'babel-polyfill';
import {mount} from 'enzyme';
import React from 'react';
import chai from 'chai';

import IssuesListEditForm from '../app/issues-list-edit-form';
import {initTranslations} from '../app/translations';

import {getDashboardApiMock} from './mocks';

describe('IssuesListEditForm', () => {

  let dashboardApiMock;
  let onSubmit;
  let onCancel;

  beforeEach(() => {
    dashboardApiMock = getDashboardApiMock();
    onSubmit = chai.spy();
    onCancel = chai.spy();
  });

  it('should export IssuesListEditForm', () => {
    (IssuesListEditForm).should.be.a('function');
  });

  const mountIssueListEditForm = () =>
    mount(
      <IssuesListEditForm
        search={'hello-search'}
        title={'hello-title'}
        onSubmit={onSubmit}
        onCancel={onCancel}
        dashboardApi={dashboardApiMock}
        youTrackId={'1-1'}
      />
    );

  it('should create component', () => {
    const editFormInstance = mountIssueListEditForm().instance();

    (editFormInstance).should.be.an('object');
    (editFormInstance.state.search).should.be.equal('hello-search');
    (editFormInstance.state.title).should.be.equal('hello-title');
    (editFormInstance.state.youTracks).should.be.an('array');
  });

  it('should call cancel-callback on cancel', () => {
    const issueListEdiFormWrapper = mountIssueListEditForm();
    const cancelButton = issueListEdiFormWrapper.
      find('button[data-test="cancel-button"]');

    (onCancel).should.not.be.called();

    cancelButton.props().onClick();
    issueListEdiFormWrapper.update();

    (onCancel).should.be.called();
  });

  it('should respect localization', () => {
    let cancelButton = mountIssueListEditForm().
      find('button[data-test="cancel-button"]');

    (cancelButton.text().trim()).should.be.equal('Cancel');

    initTranslations('ru');
    cancelButton = mountIssueListEditForm().
      find('button[data-test="cancel-button"]');

    (cancelButton.text().trim()).should.be.equal('Отмена');
  });
});
