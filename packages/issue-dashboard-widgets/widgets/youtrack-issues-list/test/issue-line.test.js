import 'babel-polyfill';
import React from 'react';
import {mount} from 'enzyme';

import './mocks';
import IssueLine from '../app/issue-line';

describe('IssueLine', () => {
  it('should export IssueLine', () => {
    (IssueLine).should.be.a('function');
  });

  const mountIssueLine = isExpanded =>
    mount(
      <IssueLine
        issue={{id: '1-1'}}
        homeUrl={'http://youtrack.jetbrains.com'}
        expanded={isExpanded}
      />
    );

  it('should render component', () => {
    const issueLineInstance = mountIssueLine().instance();

    (issueLineInstance).should.be.an('object');
    (issueLineInstance.state.issue.id).should.be.equal('1-1');
  });

  it('should render in non-expanded state by default', () => {
    const expandedBlock = mountIssueLine().find('div[data-test="issue-line-expanded-block"]');
    (expandedBlock.length).should.be.equal(0);
  });

  it('should render in expanded state if set', () => {
    const expandedBlock = mountIssueLine(true).find('div[data-test="issue-line-expanded-block"]');
    (expandedBlock.length).should.be.equal(1);
  });
});
