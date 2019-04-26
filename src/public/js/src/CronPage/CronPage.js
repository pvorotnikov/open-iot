import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

import { Header, Segment, Container, Icon, Loader, Label, List, Step, Popup, Message, Table } from 'semantic-ui-react'

import { CronCreator } from './'
import { cronActions } from '../_actions'
import { ConfirmModal, HighlightBlock } from '../_components'
import { Cron } from './Cron';

class CronPage extends Component {

    componentDidMount() {
        this.props.dispatch(cronActions.getAll())
    }

    render() {
        const { crons } = this.props
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='clock outline' circular />
                    <Header.Content>
                        Crons
                        <Loader active={crons.loading} inline size='small' />
                    </Header.Content>
                </Header>

                <Table padded>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Cron</Table.HeaderCell>
                            <Table.HeaderCell>Next invocations</Table.HeaderCell>
                            <Table.HeaderCell></Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        { crons.items.map((cron, i) => <Cron key={i} cron={cron} />) }
                    </Table.Body>
                </Table>

                <CronCreator />

            </Container>
        )
    }
}

CronPage.propTypes = {
    crons: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    const { crons } = state
    return {
        crons,
    }
}

const connectedCronPage = connect(mapStateToProps)(withRouter(CronPage))
export { connectedCronPage as CronPage }
