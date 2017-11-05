/**
 * Return authorization header with access JWT token.
 * @return {Object} header object
 */
export function authHeader() {
    let user = JSON.parse(localStorage.getItem('user'))
    if (user && user.accessToken) {
        return { 'Authorization': 'Bearer ' + user.accessToken }
    } else {
        return {}
    }
}



/**
 * Return authorization header with refresh JWT token.
 * @return {Object} header object
 */
export function refreshHeader() {
    let user = JSON.parse(localStorage.getItem('user'))
    if (user && user.refreshToken) {
        return { 'Authorization': 'Bearer ' + user.refreshToken }
    } else {
        return {}
    }
}

/**
 * Returns content-type header with application/json value
 * @return {Object} header object
 */
export function jsonHeader() {
    return { 'Content-Type': 'application/json' }
}
