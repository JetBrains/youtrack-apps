import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import UserProperties from './UserProperties';

const UserPropertiesContainer = connect(
  (state, {hubService, onUserSelect}) => ({
    user: state.selectedUser,
    hubURL: state.hubURL,
    hubService,
    onUserSelect
  })
)(UserProperties);

UserPropertiesContainer.propTypes = {
  onUserSelect: PropTypes.func.isRequired,
  hubService: PropTypes.object.isRequired
};

export default UserPropertiesContainer;
