import { createBrowserHistory } from 'history'

// custom history object used by React Router
// this enables redirecting users from outside React component,
// e.g. from the user actions after successful login or registration
export const history = createBrowserHistory()
