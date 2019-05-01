import { authHeader, jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const persistencyService = {
    get,
}

function get(topic, username, password, limit) {
    const requestOptions = {
        method: 'GET',
    }
    return new Request(false, 'basic', username, password)
    .send(`/api/persistency/${topic}?limit=${limit}`, requestOptions)
}
