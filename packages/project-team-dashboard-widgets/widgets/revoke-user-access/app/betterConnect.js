import {connect} from 'react-redux';

const betterConnect = mapState => connect(
  state => ({state}),
  dispatch => ({dispatch}),
  ({state}, {dispatch}, ownProps) => mapState(state, dispatch, ownProps)
);

export default betterConnect;
