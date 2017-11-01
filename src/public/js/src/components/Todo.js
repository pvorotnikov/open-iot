import React, { Component } from 'react'
import PropTypes from 'prop-types'

class Todo extends Component {
    render() {
        return <span style={{ textDecoration: this.props.completed ? 'line-through' : 'none' }}>
            {this.props.text}
        </span>
    }
}

Todo.propTypes = {
    completed: PropTypes.bool.isRequired,
    text: PropTypes.string.isRequired
}

export default Todo
