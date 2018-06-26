import React, { Component } from 'react'
import { HashRouter, Route } from 'react-router-dom'
import { connect } from 'react-redux'

import { Container, Message, Grid } from 'semantic-ui-react'

import { alertActions } from '../_actions'
import { PrivateRoute } from '../_components'

import { Sidebar } from '../Sidebar'
import { LoginPage } from '../LoginPage'
import { RegisterPage } from '../RegisterPage'
import { HomePage } from '../HomePage'
import { UsersPage } from '../UsersPage'
import { PlaygroundPage } from '../PlaygroundPage'
import { ApplicationsPage } from '../ApplicationsPage'
import { NewApplicationPage } from '../NewApplicationPage'
import { ApplicationPage } from '../ApplicationPage'
import { NewGatewayPage } from '../NewGatewayPage'
import { SettingsPage } from '../SettingsPage'
import { IntegrationsPage } from '../IntegrationsPage'

class App extends Component {

    componentDidMount() {
        const { history } = this.refs.router
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
                <HashRouter ref='router'>
                    <Grid columns={2}>
                        <Grid.Row>
                            <Grid.Column width={3}>
                                <Sidebar />
                            </Grid.Column>
                            <Grid.Column width={13}>
                                { message }
                                <PrivateRoute exact path="/" component={HomePage} />
                                <PrivateRoute exact path="/playground" component={PlaygroundPage} />
                                <PrivateRoute exact path="/users" component={UsersPage} />
                                <PrivateRoute exact path="/apps" component={ApplicationsPage} />
                                <PrivateRoute exact path="/apps/i/:id" component={ApplicationPage} />
                                <PrivateRoute exact path="/apps/new" component={NewApplicationPage} />
                                <PrivateRoute exact path="/apps/i/:id/newgw" component={NewGatewayPage} />
                                <PrivateRoute exact path="/integrations" component={IntegrationsPage} />
                                <PrivateRoute exact path="/settings" component={SettingsPage} />
                                <Route exact path="/login" component={LoginPage} />
                                <Route exact path="/register" component={RegisterPage} />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </HashRouter>
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
