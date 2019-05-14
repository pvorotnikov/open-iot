import { Request } from '../_helpers'

export const pluginService = {
    getAll,
}

function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/plugins', requestOptions)
}
