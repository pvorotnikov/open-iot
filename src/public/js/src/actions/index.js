import { alertConstants } from '../_constants'

let nextTodoId = 0

export const addTodo = text => {
    return {
        type: 'ADD_TODO',
        id: nextTodoId++,
        text
    }
}

export const setVisibilityFilter = filter => {
    return {
        type: 'SET_VISIBILITY_FILTER',
        filter
    }
}

export const toggleTodo = id => {
    return {
        type: 'TOGGLE_TODO',
        id
    }
}

export const login = (username, password) => {
    return {
        type: 'LOGIN',
        username,
        password
    }
}

export const alertActions = {
    success: (message) => ({ type: alertConstants.SUCCESS, message }),
    error: (message) => ({ type: alertConstants.ERROR, message }),
    clear: (message) => ({ type: alertConstants.CLEAR, message }),
}
