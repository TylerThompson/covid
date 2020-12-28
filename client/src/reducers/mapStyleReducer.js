import { MAP_STYLE } from '../actions/constants';

const initialState = {
  style: 'mapbox://styles/tylerthompson/ckj21v2hi2dph19o1zu61cz8y',
};

const mapStyleReducer = (state = initialState, action) => {
  switch (action.type) {
    case MAP_STYLE: {
      const newState = {
        ...state,
        style: action.payload,
      };
      return newState;
    }
    default:
      return state;
  }
};

export default mapStyleReducer;