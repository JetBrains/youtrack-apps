import React from 'react';
import PropTypes from 'prop-types';

import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import './style/activities-widget.css';

class ControlLoadMore extends React.Component {

  static propTypes = {
    onLoadMore: PropTypes.func,
    onLoadMoreError: PropTypes.func,
    hasMore: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      isLoadingMore: false
    };
  }

  loadMore = async () => {
    try {
      this.setState({isLoadingMore: true});
      await this.props.onLoadMore();
    } catch (error) {
      this.props.onLoadMoreError({
        title: i18n('Could not request more activities'),
        message: error.message
      });
    } finally {
      this.setState({isLoadingMore: false});
    }
  };

  render() {
    return (
      <div className="aw__load-more">
        {
          this.state.isLoadingMore && (
            <LoaderInline/>
          )
        }
        {
          !this.state.isLoadingMore &&
          (
            <div onClick={this.loadMore}>
              <Link pseudo>{i18n('Show more')}</Link>
            </div>
          )
        }
      </div>
    );
  }
}

export default ControlLoadMore;
