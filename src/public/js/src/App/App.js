import React, { Component } from 'react'
import { Router, Route } from 'react-router-dom'
import { connect } from 'react-redux'

import { Container, Message, Button } from 'semantic-ui-react'

import { history } from '../_helpers'
import { alertActions } from '../_actions'
import { PrivateRoute } from '../_components'

import { HomePage } from '../HomePage'
import { LoginPage } from '../LoginPage'
import { RegisterPage } from '../RegisterPage'

import { TodoPage } from '../TodoPage'

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
        return (
            <Container style={{ marginTop: '3em' }}>
                <Button><a href='/'>Reload</a></Button>
                { message }
                <Router history={history}>
                    <div>
                        <PrivateRoute exact path="/" component={HomePage} />
                        <Route path="/login" component={LoginPage} />
                        <Route path="/register" component={RegisterPage} />
                        <Route path="/todo" component={TodoPage} />
                    </div>
                </Router>
            </Container>
        )
    }
}

function mapStateToProps(state) {
    const { alert } = state
    return {
        alert
    }
}

const connectedApp = connect(mapStateToProps)(App)
export { connectedApp as App }
