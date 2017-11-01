import { combineReducers } from 'redux'

import todos from './todos'
import visibilityFilter from './visibilityFilter'

const openHomeApp = combineReducers({
  todos,
  visibilityFilter
})

export default openHomeApp
