/**
 * Return authorization header with JWT token.
 * @return {Object} header object
 */
export function authHeader() {
    let user = JSON.parse(localStorage.getItem('user'))
    if (user && user.token) {
        return { 'Authorization': 'Bearer ' + user.token }
    } else {
        return {}
    }
}
