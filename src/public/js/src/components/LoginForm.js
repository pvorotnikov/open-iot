import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Segment, Header, Form, Button } from 'semantic-ui-react'

import { login } from '../actions'

class LoginForm extends Component {

    onSubmit(e) {
        e.preventDefault()
        let username = e.target.username.value
        let password = e.target.password.value
        this.props.dispatch(login(username, password))
    }

    render() {
        return (
            <Segment>
                <Form onSubmit={ e => this.onSubmit(e) }>
                    <Header as='h2'>Login</Header>
                    <Form.Input name="username" label='Username' />
                    <Form.Input name="password" label='Password' type='password' />
                    <Button type='submit'>Login</Button>
                </Form>
            </Segment>
        )
    }

}

LoginForm.propTypes = {
    dispatch: PropTypes.func.isRequired,
}

LoginForm = connect()(LoginForm)

export default LoginForm
