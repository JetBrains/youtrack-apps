import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import {MinWidth} from '@jetbrains/ring-ui/components/popup/position';

import connect from './betterConnect';
import withUsersOptionsFiltering from './withUsersOptionsFiltering';

const UserSelect = connect(
  (state, dispatch, {
    loading,
    onFilter,
    onOpen,
    onLoadMore,
    onSelect,
    selectedUserOption,
    usersOptions
  }) => ({
    multiple: false,
    loading,
    filter: true,
    selected: selectedUserOption,
    size: Select.Size.FULL,
    type: Select.Type.INLINE,
    minWidth: MinWidth.TARGET,
    data: usersOptions,

    onOpen,
    onFilter: query => onFilter(
      query && `nameStartsWith: {${query}}`
    ),
    onLoadMore,
    onSelect
  })
)(Select);

UserSelect.propTypes = {
  loading: PropTypes.bool,
  onOpen: PropTypes.func,
  onFilter: PropTypes.func,
  onLoadMore: PropTypes.func,
  onSelect: PropTypes.func,
  selectedUserOption: PropTypes.object,
  usersOptions: PropTypes.array
};

export default withUsersOptionsFiltering(UserSelect);
