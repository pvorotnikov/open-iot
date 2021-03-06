import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Form } from 'semantic-ui-react'

import { todoActions } from '../_actions'

class AddTodo extends React.Component {

    constructor(props) {
        super(props)
    }

    onSubmit(e) {
        e.preventDefault()
        let title = e.target.title.value
        if (!title.trim()) {
            return
        }
        this.props.dispatch(todoActions.addTodo(title))
        e.target.title.value = ''
    }

    render() {
        return (
            <Form onSubmit={ e => this.onSubmit(e) }>
                <Form.Input action={{ color: 'teal', labelPosition: 'right', icon: 'plus', content: 'Add Todo' }}
                            name='title'
                            placeholder='Title' />
            </Form>
        )
    }

}

AddTodo.propTypes = {
    dispatch: PropTypes.func.isRequired,
}

const connectedAddTodo = connect()(AddTodo)
export { connectedAddTodo as AddTodo }
