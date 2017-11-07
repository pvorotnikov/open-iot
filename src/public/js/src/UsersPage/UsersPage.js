import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Header, Container, Button, Accordion, Icon, Form } from 'semantic-ui-react'

import { userActions } from '../_actions'

class UsersPage extends Component {

    constructor(props) {
        super(props)

        this.state = {
            activeUser: null,
            userValues: {
                email: '',
                firstName: '',
                lastName: '',
                password: ''
            }
        }
    }

    componentDidMount() {
        this.props.dispatch(userActions.getAll())
    }

    handleDeleteUser(id) {
        this.props.dispatch(userActions.delete(id))
    }

    handleUserFormSubmit(e) {
        const { activeUser, userValues } = this.state;
        if (userValues.firstName && userValues.lastName && userValues.email) {
            this.props.dispatch(userActions.update(activeUser, userValues));
        }
    }

    handleUserClick(e, titleProps) {
        let newActiveUser = this.state.activeUser === titleProps.user.id ? null : titleProps.user.id
        this.setState({
            activeUser: newActiveUser,
            userValues: {
                email: newActiveUser ? titleProps.user.email : '',
                firstName: newActiveUser ? titleProps.user.firstName : '',
                lastName: newActiveUser ? titleProps.user.lastName : '',
                password: '',
            }
        })
    }

    handleUserValueChange(e, data) {
        let { name, value } = data
        if (name != 'password') value = value.trim()
        const newState = {
            ...this.state.userValues,
            [name]: value
        }
        this.setState({ userValues: newState })
    }

    render() {
        const { users } = this.props
        const { userValues } = this.state

        let userItems = users.items
            ? users.items.map((user) => (
                <div key={user.id}>
                    <Accordion.Title active={this.state.activeUser === user.id} user={user} onClick={this.handleUserClick.bind(this)}>
                    <Icon name='dropdown' />{`${user.firstName} ${user.lastName}`}</Accordion.Title>
                    <Accordion.Content active={this.state.activeUser === user.id}>
                        <Form loading={user.updating || user.deleting}>
                            <Form.Input onChange={(e, d)=>this.handleUserValueChange(e, d)} name="email" label='Email' defaultValue={user.email} />
                            <Form.Input onChange={(e, d)=>this.handleUserValueChange(e, d)} name="password" label='Password' type='password' />
                            <Form.Input onChange={(e, d)=>this.handleUserValueChange(e, d)} name="firstName" label='First Name' defaultValue={user.firstName} />
                            <Form.Input onChange={(e, d)=>this.handleUserValueChange(e, d)} name="lastName" label='Last Name' defaultValue={user.lastName} />
                            <Button circular icon='save' label='Save' color='green' onClick={ e => this.handleUserFormSubmit(e) } />
                            <Button circular icon='delete' label='Delete' color='red' onClick={ e => this.handleDeleteUser(user.id) } />
                        </Form>
                    </Accordion.Content>
                </div>
            ))
            : users.loading
                ? <Accordion.Title active={false}>Loading</Accordion.Title>
                : <Accordion.Title active={false}>No data</Accordion.Title>

        return (
            <Container>
                <Header as='h1'>Registered users</Header>
                <Accordion fluid styled>
                    {userItems}
                </Accordion>
            </Container>
        )
    }
}

UsersPage.propTypes = {
    users: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { users } = state
    return {
        users,
    }
}

const connectedUsersPage = connect(mapStateToProps)(UsersPage)
export { connectedUsersPage as UsersPage }
