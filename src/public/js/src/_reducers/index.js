import { combineReducers } from 'redux'

import { authentication } from './authentication.reducer'
import { registration } from './registration.reducer'
import { users } from './users.reducer'
import { alert } from './alert.reducer'

import { todos, visibilityFilter } from './todo.reducer'

const rootReducer = combineReducers({
    authentication, // state.authentication
    registration,   // state.registration
    users,          // state.users
    alert,          // state.alert

    todos,              // TODO: remove this eventually
    visibilityFilter,   // TODO: remove this eventually
})

export default rootReducer
