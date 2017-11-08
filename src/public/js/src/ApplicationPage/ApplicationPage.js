import React, { Component } from 'react'

import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Header, Container, Icon, Button, Loader, Segment, Label, List } from 'semantic-ui-react'

import { appActions } from '../_actions'
import { history } from '../_helpers'
import { EditableText } from '../_components'

class ApplicationPage extends Component {

    componentDidMount() {
        this.props.dispatch(appActions.getSingle(this.props.match.params.id))
    }

    onFieldUpdate(name, value) {
        const { app } = this.props
        value = value.trim()
        let updatedApp = {
            [name]: value,
        }
        this.props.dispatch(appActions.update(app.id, updatedApp))
    }

    render() {
        const { app } = this.props
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='lab' circular />
                    <Header.Content>
                        <EditableText text={app.name || ''} onUpdate={(value) => this.onFieldUpdate('name', value)} />
                        <Loader active={this.props.loading} inline size='small' />
                        <Header.Subheader>{app.id && `ID: ${app.id}`}</Header.Subheader>
                    </Header.Content>
                </Header>
                <Container>
                    <EditableText text={app.description || ''} onUpdate={(value) => this.onFieldUpdate('description', value)} />
                </Container>
                <Segment raised>
                    <Label color='blue' ribbon>Credentials</Label>
                    <List>
                        <List.Item>
                            <Label horizontal>Access key</Label>
                            <span>
                                {app.key}
                                <Icon link name='refresh' style={{marginLeft: '10px'}} />
                            </span>
                        </List.Item>
                        <List.Item>
                            <Label horizontal>Secret key</Label>
                            <span>
                                {app.secret}
                                <Icon link name='refresh' style={{marginLeft: '10px'}} />
                            </span>
                        </List.Item>
                    </List>
                </Segment>
            </Container>
        )
    }
}

ApplicationPage.propTypes = {
    loading: PropTypes.bool,
    app: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
}

ApplicationPage.defaultProps = {
  app: {}
}

function mapStateToProps(state) {
    const { apps } = state
    const { app, loading } = apps
    return {
        app,
        loading,
    }
}

const connectedApplicationPage = connect(mapStateToProps)(ApplicationPage)
export { connectedApplicationPage as ApplicationPage }
