import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import _ from 'lodash'
import moment from 'moment'
import { CronJob } from 'cron'

import { Form, Table, List, Icon } from 'semantic-ui-react'
import { cronActions } from '../_actions'
import { ConfirmModal, HighlightBlock } from '../_components';

class Cron extends Component {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                cron: this.props.cron.cron,
            }
        }
    }

    onChange(e, data) {
        let { name, value } = data
        this.setState({ values: {
            ...this.state.values,
            [name]: value
        }})
    }

    onCronSave() {
        const { dispatch, cron } = this.props
        const updatedCron = {
            cron: this.state.values.cron,
        }
        dispatch(cronActions.update(cron.id, updatedCron))
    }

    onCronDelete() {
        const { dispatch, cron } = this.props
        dispatch(cronActions.delete(cron.id))
    }

    calculateNextExecution() {
        try {
            const job = new CronJob(this.state.values.cron)
            const next = job.nextDates(5)
            return (
                <ul>
                    { next.map((next, i) => (
                        <li key={i}>{ next.fromNow() } (on { next.format('dddd, MMMM Do YYYY, h:mm:ss a') })</li>
                    )) }
                </ul>
            )
        } catch (err) {
            return <p>There's an error with your cron expression</p>
        }
    }

    render() {
        const { cron } = this.props
        return (
            <Table.Row>
                <Table.Cell>
                    <Form size='small'>
                        <Form.Input name='cron'
                            value={ this.state.values.cron }
                            onChange={ this.onChange.bind(this) } />
                        <List>
                            <List.Item>Type: {cron.type}</List.Item>
                            <List.Item>Topic: {cron.arguments.topic}</List.Item>
                            <List.Item>Payload:
                                <HighlightBlock language='json'>{cron.arguments.payload}</HighlightBlock>
                            </List.Item>
                        </List>
                    </Form>
                </Table.Cell>
                <Table.Cell>
                    { moment(this.props.cron.next).format('dddd, MMMM Do YYYY, h:mm:ss a') }
                    { this.calculateNextExecution() }
                </Table.Cell>
                <Table.Cell>
                    <ConfirmModal title='Are you sure you want to save this cron?'
                        trigger={<Icon link name='save' color='green' />}
                        onConfirm={this.onCronSave.bind(this)} />
                    <ConfirmModal title='Are you sure you want to delete this cron?'
                        trigger={<Icon link name='remove' color='red' />}
                        onConfirm={this.onCronDelete.bind(this)} />
                </Table.Cell>
            </Table.Row>
        )
    }

}

Cron.propTypes = {
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    return { }
}

const connectedCron = connect(mapStateToProps)(withRouter(Cron))
export { connectedCron as Cron }
