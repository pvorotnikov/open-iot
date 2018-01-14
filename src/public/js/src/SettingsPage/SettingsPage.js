import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import moment from 'moment'

import { Header, Container, Icon, Loader, Table, Checkbox, TextArea } from 'semantic-ui-react'

import { EditableText } from '../_components'
import { settingActions } from '../_actions'

class SettingsPage extends Component {

    componentDidMount() {
        this.props.dispatch(settingActions.getAll())
    }

    onSettingUpdate(key, value) {
        console.log(`Setting ${key} updated to ${value}`)
        this.props.dispatch(settingActions.update(key, value))
    }

    renderEditableToggle(key, value) {
        return (
            <Checkbox toggle defaultChecked={value} onChange={(e, data) => this.onSettingUpdate(key, data.checked)} />
        )
    }

    renderEditableTextArea(key, value) {
        return (
            <EditableText as={TextArea} pre text={value || 'Enter value'} onUpdate={value => this.onSettingUpdate(key, value)} />
        )
    }

    renderEditableText(key, value) {
        return (
            <EditableText text={value || 'Enter value'} onUpdate={value => this.onSettingUpdate(key, value)} />
        )
    }

    renderSettings() {
        const { settings } = this.props

        let settingItems = settings.items.map(s => {

            let updated = moment(s.updated).calendar()
            let valueElement = null

            if (!s.readOnly) {
                switch (s.key) {
                    case 'bridge.aws.enabled':
                        valueElement = this.renderEditableToggle(s.key, s.value)
                        break
                    case 'bridge.aws.endpoint':
                        valueElement = this.renderEditableText(s.key, s.value)
                        break
                    default:
                        valueElement = this.renderEditableTextArea(s.key, s.value)
                        break
                }
            } else {
                valueElement = s.value
            }


            return (
                <Table.Row key={s.key} disabled={s.readOnly}>
                    <Table.Cell>
                        <Header as='h4'>
                            <Header.Content>
                                { s.key }
                                <Header.Subheader>{ s.description }</Header.Subheader>
                            </Header.Content>
                        </Header>
                    </Table.Cell>
                    <Table.Cell>{ valueElement }</Table.Cell>
                    <Table.Cell>{ updated }</Table.Cell>
                </Table.Row>
            )
        })

        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Setting</Table.HeaderCell>
                        <Table.HeaderCell>Value</Table.HeaderCell>
                        <Table.HeaderCell>Last Updated</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    { settingItems }
                </Table.Body>
            </Table>
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
