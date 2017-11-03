import React, { Component } from 'react'

import { Segment, Header } from 'semantic-ui-react'
import { AddTodo, Footer, TodoList } from './'

export class TodoPage extends Component {
    render() {
        return (
            <Segment>
                <Header as='h2'>My Todo</Header>
                <AddTodo />
                <TodoList />
                <Footer />
            </Segment>
        )
    }
}
