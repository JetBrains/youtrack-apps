import React, {Component} from 'react';
import PropTypes from 'prop-types';
import List from '@jetbrains/ring-ui/components/list/list';
import QueryAssist from '@jetbrains/ring-ui/components/query-assist/query-assist';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import styles from './app.css';
import withUsersOptionsFiltering from './withUsersOptionsFiltering';

class UserSearch extends Component {
  static propTypes = {
    loading: PropTypes.bool,
    canLoadMoreUsers: PropTypes.bool,
    onFilter: PropTypes.func,
    onLoadMore: PropTypes.func,
    onOpen: PropTypes.func,
    onSelect: PropTypes.func,
    usersOptions: PropTypes.array,
    hubService: PropTypes.object
  };

  componentDidMount() {
    this.props.onOpen();
  }

  onFilter = queryAssistModel => this.props.onFilter(queryAssistModel.query);

  usersQueryAssistSource = queryAssistModel =>
    this.props.hubService.usersQueryAssistSource(queryAssistModel);

  render() {
    const {
      usersOptions,
      onSelect,
      canLoadMoreUsers,
      loading,
      onLoadMore
    } = this.props;

    return (
      <div>
        <div className={styles.searchUserPanel}>
          <QueryAssist
            placeholder={i18n('Search user')}
            glass={true}
            clear={true}
            onApply={this.onFilter}
            focus={true}
            dataSource={this.usersQueryAssistSource}
          />
        </div>
        <div className={styles.searchUserList}>
          <List
            data={usersOptions}
            onSelect={onSelect}
          />
          {
            canLoadMoreUsers && !loading &&
            <div
              className={styles.loadMoreButton}
              onClick={onLoadMore}
            >
              <Link
                pseudo={true}
              >
                {i18n('Load more')}
              </Link>
            </div>
          }
          {
            loading && <LoaderInline/>
          }
        </div>
      </div>
    );
  }
}

export default withUsersOptionsFiltering(UserSearch);
