import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    Segment,
    Label,
    List,
    Form,
} from 'semantic-ui-react'

export class Rules extends Component {

    render() {
        const { app } = this.props
        return (
            <Segment raised>
                <Label color='blue' ribbon>Rules</Label>
                <List>
                    <List.Item>
                        {app.id}
                    </List.Item>
                </List>
            </Segment>
        )
    }

}
