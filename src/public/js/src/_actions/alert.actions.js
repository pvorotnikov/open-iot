import { alertConstants } from '../_constants'

export const alertActions = {
    success,
    error,
    clear,
}

/**
 * Success action creator
 * @param  {String} message
 * @return {Object}
 */
function success(message) {
    return { type: alertConstants.SUCCESS, message }
}

/**
 * Error action creator
 * @param  {String} message
 * @return {Object}
 */
function error(message) {
    return { type: alertConstants.ERROR, message }
}

/**
 * Clear any messages action creator
 * @return {Object}
 */
function clear() {
    return { type: alertConstants.CLEAR }
}
