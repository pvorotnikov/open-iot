import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { Segment, Form, Header, Button, Label, Input } from 'semantic-ui-react'

import { userActions } from '../_actions'

class RegisterPage extends Component {

    constructor(props) {
        super(props)

        this.state = {
            user: {
                firstName: '',
                lastName: '',
                email: '',
                password: ''
            },
            submitted: false
        }
    }

    onChange(e, data) {
        const { user } = this.state
        let { name, value } = data
        if (name != 'password') value = value.trim()

        this.setState({
            user: {
                ...user,
                [name]: value
            }
        })
    }

    onSubmit(e) {
        e.preventDefault()
        this.setState({ submitted: true });
        const { user } = this.state;
        if (user.firstName && user.lastName && user.email && user.password) {
            this.props.dispatch(userActions.register(user, this.props.history));
        }
    }

    render() {
        const { registering } = this.props
        const { user, submitted } = this.state
        return (
            <Segment>
                <Form loading={registering} onSubmit={ e => this.onSubmit(e) }>
                    <Header as='h2'>Register</Header>
                    <Form.Field>
                        <label>Email</label>
                        <Input name="email" type="email" onChange={ (e, data) => this.onChange(e, data) } />
                        { submitted && !user.email &&
                            <Label basic color='red' pointing>Email is required</Label>
                        }
                    </Form.Field>
                    <Form.Field>
                        <label>Password</label>
                        <Input name="password" type='password' onChange={ (e, data) => this.onChange(e, data) } />
                        { submitted && !user.password &&
                            <Label basic color='red' pointing>Password is required</Label>
                        }
                    </Form.Field>
                    <Form.Field>
                        <label>First name</label>
                        <Input name="firstName" onChange={ (e, data) => this.onChange(e, data) } />
                        { submitted && !user.firstName &&
                            <Label basic color='red' pointing>First name is required</Label>
                        }
                    </Form.Field>
                    <Form.Field>
                        <label>Last name</label>
                        <Input name="lastName" onChange={ (e, data) => this.onChange(e, data) } />
                        { submitted && !user.lastName &&
                            <Label basic color='red' pointing>Last name is required</Label>
                        }
                    </Form.Field>
                    <Button type='submit'>Register</Button>
                    <Link to="/login">Cancel</Link>
                </Form>
            </Segment>
        );
    }
}

RegisterPage.propTypes = {
    registering: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    const { registering } = state.registration
    return {
        registering
    }
}

const connectedRegisterPage = connect(mapStateToProps)(withRouter(RegisterPage))
export { connectedRegisterPage as RegisterPage }
