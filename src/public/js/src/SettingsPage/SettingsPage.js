import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import moment from 'moment'

import { Header, Container, Icon, Loader, Table, Checkbox, TextArea, Dropdown, Tab } from 'semantic-ui-react'

import { Tags } from './'
import { EditableText } from '../_components'
import { settingActions, moduleActions, pluginActions } from '../_actions'


class SettingsPage extends Component {

    componentDidMount() {
        this.props.dispatch(settingActions.getAll())
        this.props.dispatch(moduleActions.getAll())
        this.props.dispatch(pluginActions.getAll())
    }

    onSettingUpdate(key, value) {
        console.log(`Setting ${key} updated to ${value}`)
        this.props.dispatch(settingActions.update(key, value))
    }

    onModuleEnable(id, enabled) {
        let newStatus = enabled ? 'enabled' : 'disabled'
        console.log(`Module ${id} set to ${newStatus}`)
        this.props.dispatch(moduleActions.setStatus(id, newStatus))
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

    renderEditableDropdown(key, value, options) {
        return (
            <Dropdown fluid selection defaultValue={value} options={options} onChange={(e, data) => this.onSettingUpdate(key, data.value)} />
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
                    case 'bridge.aws.aliases':
                    case 'global.enableregistrations':
                        valueElement = this.renderEditableToggle(s.key, s.value)
                        break
                    case 'bridge.aws.endpoint':
                        valueElement = this.renderEditableText(s.key, s.value)
                        break
                    case 'global.integrationmode':
                        let options = [
                            { text: 'Rules', value: 'rules' },
                            { text: 'Integrations', value: 'integrations' }
                        ]
                        valueElement = this.renderEditableDropdown(s.key, s.value, options)
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
            <Table celled columns='3'>
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

    renderModules() {

        const modules = this.props.modules.items
        let moduleItems = null

        if (!modules.length) {
            moduleItems = (<Table.Row>
                <Table.Cell colSpan='2' textAlign='center'>There are no modules available</Table.Cell>
            </Table.Row>)
        } else {
            moduleItems = modules.map(m => {

                let moduleEnabled = m.status === 'enabled'
                let moduleMissing = m.status === 'missing'

                return (
                    <Table.Row key={m.id} negative={moduleMissing}>
                        <Table.Cell>
                            <Header as='h4'>
                                <Header.Content>
                                    { m.name } { m.meta.version ? m.meta.version : '' }
                                    <Header.Subheader>{ m.description }</Header.Subheader>
                                </Header.Content>
                            </Header>
                        </Table.Cell>
                        <Table.Cell>
                            { !moduleMissing && <Checkbox toggle defaultChecked={moduleEnabled} onChange={(e, data) => this.onModuleEnable(m.id, data.checked)} /> }
                            { moduleMissing && <span>Missing module</span> }
                        </Table.Cell>
                        <Table.Cell>
                            { moment(m.uploaded).calendar() }
                        </Table.Cell>
                    </Table.Row>
                )
            })
        }

        return (
            <Table celled columns='3'>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Module</Table.HeaderCell>
                        <Table.HeaderCell>Enable/Disable</Table.HeaderCell>
                        <Table.HeaderCell>Uploaded</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    { moduleItems }
                </Table.Body>
            </Table>
        )
    }

    render() {
        const { settings, modules } = this.props

        return (
            <Container>

                <Header as='h1'>
                    <Icon name='settings' circular />
                    <Header.Content>Service Settings <Loader active={settings.loading} inline size='small' /></Header.Content>
                </Header>
                { settings.items && this.renderSettings() }

                <Header as='h2'>Modules</Header>
                { this.renderModules() }

                <Header as='h2'>Tags</Header>
                <Tags />
            </Container>
        )
    }
}

SettingsPage.propTypes = {
    settings: PropTypes.object.isRequired,
    modules: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { settings, modules, plugins } = state
    return {
        settings,
        modules: { loading: modules.loading, items: modules.items.map(m => ({
            ...m,
            uploaded: plugins.items.reduce((acc, plg) => plg.name === m.name ? plg.created : acc, null)
        })) },
    }
}

const connectedSettingsPage = connect(mapStateToProps)(SettingsPage)
export { connectedSettingsPage as SettingsPage }
