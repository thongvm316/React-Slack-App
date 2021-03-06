import { combineReducers } from 'redux'
import * as actionTypes from '../actions/types'

/* User */
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

/* Channel */
const initialChannelState = {
  currentChannel: null,
  isPrivateChannel: false,
  userPosts: null,
}

const channel_reducer = (state = initialChannelState, action) => {
  switch (action.type) {
    case actionTypes.SET_CURRENT_CHANNEL:
      return {
        ...state,
        currentChannel: action.payload.currentChannel,
      }
    case actionTypes.SET_PRIVATE_CHANNEL:
      return {
        ...state,
        isPrivateChannel: action.payload.isPrivateChannel,
      }
    case actionTypes.SET_USER_POSTS:
      return {
        ...state,
        userPosts: action.payload.userPosts,
      }
    default:
      return state
  }
}

/* Colors */
const inittalColorsState = {
  primaryColor: '#4c3c4c',
  secondaryColor: '#eee',
}

const colors_reducer = (state = inittalColorsState, action) => {
  switch (action.type) {
    case actionTypes.SET_COLORS:
      return {
        ...state,
        primaryColor: action.payload.primaryColor,
        secondaryColor: action.payload.secondaryColor,
      }
    default:
      return state
  }
}

const rootReducer = combineReducers({
  user: user_reducer,
  channel: channel_reducer,
  colors: colors_reducer,
})

export default rootReducer
