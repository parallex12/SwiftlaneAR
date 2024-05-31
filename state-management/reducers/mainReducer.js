import { GET_USER_DETAILS } from "../types/types";
const initialState = {
  get_user_details: null,
};
const mainReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_USER_DETAILS:
      return {
        ...state,
        get_user_details: action.payload,
      };

    default:
      return state;
  }
};
export default mainReducer;
