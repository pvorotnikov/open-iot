import moment from 'moment'

const todos = (state = [], action) => {

    switch (action.type) {
        case 'ADD_TODO':
            return [
                ...state,
                {
                    id: action.id,
                    text: action.text,
                    completed: false,
                    created: moment(),
                    updated: moment(),
                }
            ]
        case 'TOGGLE_TODO':
            return state.map((todo) => {
                if (todo.id === action.id) {
                    todo.completed = !todo.completed
                    todo.updated = moment()
                    return todo
                } else {
                    return todo
                }
            })

        case 'LOGIN':
            console.log('Calling login', action)
            return state

        default:
            return state
    }

}

export default todos
