import { todoConstants } from '../_constants'

let nextTodoId = 0

export const todoActions = {
    addTodo,
    setFilter,
    toggleTodo,
}

function addTodo(text) {
    return {
        type: todoConstants.ADD,
        id: nextTodoId++,
        text
    }
}

function setFilter(filter) {
    return {
        type: todoConstants.FILTER,
        filter
    }
}

function toggleTodo(id) {
    return {
        type: todoConstants.TOGGLE,
        id
    }
}
