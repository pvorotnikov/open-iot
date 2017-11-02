import { createBrowserHistory } from 'history'

/**
 * Custom history object used by React Router.
 * This enables redirecting users from outside React component,
 * e.g. from the user actions after successful login or registration.
 * @type {History}
 */
export const history = createBrowserHistory()
