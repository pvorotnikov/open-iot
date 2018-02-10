import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Header, Container, Button, Accordion, Icon, Form, Loader, List, Label } from 'semantic-ui-react'

import { userActions } from '../_actions'
import { ConfirmModal } from '../_components'

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

    refreshKey(id) {
        this.props.dispatch(userActions.refreshKey(id))
    }

    refreshSecret(id) {
        this.props.dispatch(userActions.refreshSecret(id))
    }

    renderUsers() {
        const { users } = this.props

        const userItems = users.items.map((user) => (
            <div key={user.id}>
                <Accordion.Title active={this.state.activeUser === user.id} user={user} onClick={this.handleUserClick.bind(this)}>
                <Icon name='dropdown' />{`${user.firstName} ${user.lastName}`}</Accordion.Title>
                <Accordion.Content active={this.state.activeUser === user.id}>
                    <Form loading={user.updating || user.deleting}>
                        <List>
                            <List.Item>
                                <Label color='green' horizontal>Access key</Label>
                                &nbsp;
                                <span>
                                    {user.key}
                                    <ConfirmModal title='Are you sure you want to refresh this key?'
                                        trigger={<Icon link name='refresh' style={{marginLeft: '10px'}} />}
                                        onConfirm={this.refreshKey.bind(this, user.id)} />
                                </span>
                            </List.Item>
                            <List.Item>
                                <Label color='green' horizontal>Secret key</Label>
                                &nbsp;
                                <span>
                                    {user.secret}
                                    <ConfirmModal title='Are you sure you want to refresh this key?'
                                        trigger={<Icon link name='refresh' style={{marginLeft: '10px'}} />}
                                        onConfirm={this.refreshSecret.bind(this, user.id)} />
                                </span>
                            </List.Item>
                        </List>
                        <Form.Input onChange={(e, d)=>this.handleUserValueChange(e, d)} name="email" label='Email' defaultValue={user.email} />
                        <Form.Input onChange={(e, d)=>this.handleUserValueChange(e, d)} name="password" label='Password' type='password' />
                        <Form.Input onChange={(e, d)=>this.handleUserValueChange(e, d)} name="firstName" label='First Name' defaultValue={user.firstName} />
                        <Form.Input onChange={(e, d)=>this.handleUserValueChange(e, d)} name="lastName" label='Last Name' defaultValue={user.lastName} />
                        <Button circular icon='save' label='Save' color='green' onClick={ e => this.handleUserFormSubmit(e) } />
                        <ConfirmModal title='Are you sure you want to delete this user?'
                                text='The user will no longer be able to log in.'
                                trigger={<Button floated='right' circular icon='delete' label='Delete' color='red' />}
                                onConfirm={() => this.handleDeleteUser(user.id)} />
                    </Form>
                </Accordion.Content>
            </div>
        ))

        return (
            <Accordion fluid styled>
                {userItems}
            </Accordion>
        )
    }

    render() {
        const { users } = this.props

        return (
            <Container>
                <Header as='h1'>
                    <Icon name='users' circular />
                    <Header.Content>Registered Users <Loader active={users.loading} inline size='small' /></Header.Content>
                </Header>
                { users.items && this.renderUsers() }
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
