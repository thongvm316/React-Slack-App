import { combineReducers } from 'redux'
import * as actionTypes from '../actions/types'

const initialState = {
  currentUser: null,
  isLoading: true,
}

const user_reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return {
        ...state,
        currentUser: action.payload.currentUser,
        isLoading: false,
      }
    case actionTypes.CLEAR_USER:
      return {
        ...state,
        currentUser: null,
        isLoading: false,
      }
    default:
      return state
  }
}

const rootReducer = combineReducers({
  user: user_reducer,
})

export default rootReducer
