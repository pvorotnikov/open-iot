import { connect } from 'react-redux'

import { todoActions } from '../_actions'
import { todoConstants } from '../_constants'
import TodoList from '../components/TodoList'

const getVisibleTodos = (todos, filter) => {
    switch (filter) {
        case todoConstants.FILTER_SHOW_ALL:
            return todos
        case todoConstants.FILTER_SHOW_COMPLETED:
            return todos.filter(t => t.completed)
        case todoConstants.FILTER_SHOW_ACTIVE:
            return todos.filter(t => !t.completed)
        default:
            console.warn('Unknown filter', filter)
            return todos
    }
}

const mapStateToProps = state => {
    return {
        todos: getVisibleTodos(state.todos, state.visibilityFilter)
    }
}

const mapDispatchToProps = dispatch => {
    return {
        onTodoClick: id => {
            dispatch(todoActions.toggleTodo(id))
        }
    }
}

const VisibleTodoList = connect(
    mapStateToProps,
    mapDispatchToProps
)(TodoList)

export default VisibleTodoList
