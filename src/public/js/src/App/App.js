import React, { Component } from 'react'
import { Router, Route } from 'react-router-dom'
import { connect } from 'react-redux'

import { Container, Message, Grid } from 'semantic-ui-react'

import { history } from '../_helpers'
import { alertActions } from '../_actions'
import { PrivateRoute } from '../_components'


import { Sidebar } from '../Sidebar'
import { LoginPage } from '../LoginPage'
import { RegisterPage } from '../RegisterPage'
import { HomePage } from '../HomePage'
import { UsersPage } from '../UsersPage'
import { TodoPage } from '../TodoPage'
import { ApplicationsPage } from '../ApplicationsPage'
import { NewApplicationPage } from '../NewApplicationPage'

class App extends Component {
    constructor(props) {
        super(props)

        const { dispatch } = this.props
        history.listen((location, action) => {
            // clear alert on location change
            dispatch(alertActions.clear())
        })
    }

    render() {
        // define any messages
        const { alert } = this.props
        let message = null
        if (alert.message) {
            let props = {}
            switch (alert.type) {
                case 'success':
                    message = <Message content={alert.message} icon='check circle' success />
                    break
                case 'error':
                    message = <Message content={alert.message} icon='warning sign' error />
                    break
                default:
                    message = <Message content={alert.message} icon='info circle' />
                    break
            }
        }

        // define structure
        return (
            <Container style={{ marginTop: '3em' }}>
                <Router history={history}>
                    <Grid columns={2}>
                        <Grid.Row>
                            <Grid.Column width={3}>
                                <Sidebar />
                            </Grid.Column>
                            <Grid.Column width={13}>
                                { message }
                                <PrivateRoute exact path="/" component={HomePage} />
                                <PrivateRoute exact path="/todo" component={TodoPage} />
                                <PrivateRoute exact path="/users" component={UsersPage} />
                                <PrivateRoute exact path="/apps" component={ApplicationsPage} />
                                <PrivateRoute exact path="/apps/new" component={NewApplicationPage} />
                                <Route exact path="/login" component={LoginPage} />
                                <Route exact path="/register" component={RegisterPage} />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Router>
            </Container>
        )
    }
}

function mapStateToProps(state) {
    const { alert } = state
    return {
        alert,
    }
}

const connectedApp = connect(mapStateToProps)(App)
export { connectedApp as App }
