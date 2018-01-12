import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Header, Container, Icon, Loader } from 'semantic-ui-react'

import { settingActions } from '../_actions'

class SettingsPage extends Component {

    componentDidMount() {
        this.props.dispatch(settingActions.getAll())
    }

    renderSettings() {
        const { settings } = this.props

        return (
            <div>
                Settings come here
            </div>
        )
    }

    render() {
        const { settings } = this.props

        return (
            <Container>
                <Header as='h1'>
                    <Icon name='settings' circular />
                    <Header.Content>Service Settings <Loader active={settings.loading} inline size='small' /></Header.Content>
                </Header>
                { settings.items && this.renderSettings() }
            </Container>
        )
    }
}

SettingsPage.propTypes = {
    settings: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { settings } = state
    return {
        settings,
    }
}

const connectedSettingsPage = connect(mapStateToProps)(SettingsPage)
export { connectedSettingsPage as SettingsPage }
