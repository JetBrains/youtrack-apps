import 'babel-polyfill';
import {mount} from 'enzyme';
import React from 'react';
import chai from 'chai';

import ActivitiesEditForm from '../app/activities-edit-form';
import {initTranslations} from '../app/translations';
import filter from '../app/activities-filter';

import {getDashboardApiMock} from './mocks';

describe('ActivitiesEditForm', () => {

  let dashboardApiMock;
  let onSubmitSpy;
  let onCancelSpy;
  let onServiceChangeSpy;

  beforeEach(() => {
    dashboardApiMock = getDashboardApiMock();
    onSubmitSpy = chai.spy();
    onCancelSpy = chai.spy();
    onServiceChangeSpy = chai.spy();
    filter.youTrackId = '1-1';
    filter.youTrackUrl = 'localhost';
  });

  it('should export ActivitiesEditForm', () => {
    (ActivitiesEditForm).should.be.a('function');
  });

  const mountActivitiesEditForm = () =>
    mount(
      <ActivitiesEditForm
        submitConfig={onSubmitSpy}
        cancelConfig={onCancelSpy}
        onServiceChange={onServiceChangeSpy}
        dashboardApi={dashboardApiMock}
      />
    );

  it('should create component', () => {
    const editFormInstance = mountActivitiesEditForm().instance();
    (editFormInstance).should.be.an('object');
    (editFormInstance.state.isLoading).should.equal(false);
  });

  it('should call cancel-callback on cancel', () => {
    const editFormWrapper = mountActivitiesEditForm();
    const cancelButton = editFormWrapper.
      find('button[data-test="cancel-button"]');

    (onCancelSpy).should.not.be.called();

    cancelButton.props().onClick();
    editFormWrapper.update();

    (onCancelSpy).should.be.called();
  });

  it('should respect localization', () => {
    let cancelButton = mountActivitiesEditForm().
      find('button[data-test="cancel-button"]');

    (cancelButton.text().trim()).should.be.equal('Cancel');

    initTranslations('ru');
    cancelButton = mountActivitiesEditForm().
      find('button[data-test="cancel-button"]');

    (cancelButton.text().trim()).should.be.equal('Отмена');
  });
});
