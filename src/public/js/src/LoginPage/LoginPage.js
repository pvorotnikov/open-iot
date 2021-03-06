import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { Segment, Form, Header, Button } from 'semantic-ui-react'

import { userActions, settingActions } from '../_actions'

class LoginPage extends Component {

    componentWillMount() {
        this.props.dispatch(settingActions.getEnableRegistrations())
    }

    onSubmit(e) {
        e.preventDefault()
        let email = e.target.email.value
        let password = e.target.password.value
        if (email && password) {
            this.props.dispatch(userActions.login(email, password, this.props.history))
        }
    }

    render() {
        return (
            <Segment>
                <Form loading={this.props.loggingIn} onSubmit={ e => this.onSubmit(e) }>
                    <Header as='h2'>Login</Header>
                    <Form.Input name="email" label='Email' />
                    <Form.Input name="password" label='Password' type='password' />
                    <Button type='submit'>Login</Button>
                    { this.props.registrationEnabled && <Link to='/register'>Register</Link> }
                </Form>
            </Segment>
        )
    }
}

LoginPage.propTypes = {
    loggingIn: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    const { loggingIn } = state.authentication
    const { registrationEnabled } = state.settings
    return {
        loggingIn,
        registrationEnabled,
    }
}

const connectedLoginPage = connect(mapStateToProps)(withRouter(LoginPage))
export { connectedLoginPage as LoginPage }
