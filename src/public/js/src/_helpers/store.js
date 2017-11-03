import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk' // this permits action creators to return function: (dispatch, getState) => {}
import { createLogger } from 'redux-logger'
import rootReducer from '../reducers'

const loggerMiddleware = createLogger()

/**
 * Main application store
 * @type {Store}
 */
export const store = createStore(
    rootReducer,
    applyMiddleware(
        thunkMiddleware,
        loggerMiddleware
    )
)
