import { jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const appService = {
    getAll,
}

function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/apps', requestOptions)
}
