import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Button, Icon, Input } from 'semantic-ui-react'

import { addTodo } from '../actions'

class AddTodo extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            title: ''
        }
    }

    onSubmit(e) {
        e.preventDefault()
        if (!this.state.title.trim()) {
            return
        }
        this.props.dispatch(addTodo(this.state.title))
        this.setState({ title: '' })
    }

    render() {
        return (
            <div>
                <form onSubmit={ e => this.onSubmit(e) }>
                    <Input ref='input'
                           action={{ color: 'teal', labelPosition: 'right', icon: 'plus', content: 'Add Todo' }}
                           onChange={ (e, data) => this.setState({ title: data.value }) }
                           value={this.state.title} />
                </form>
            </div>
        )
    }

}

AddTodo.propTypes = {
    dispatch: PropTypes.func.isRequired,
}

AddTodo = connect()(AddTodo)

export default AddTodo
