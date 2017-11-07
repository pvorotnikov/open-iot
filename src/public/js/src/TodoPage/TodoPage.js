import React, { Component } from 'react'

import { Container, Header } from 'semantic-ui-react'
import { AddTodo, Footer, TodoList } from './'

export class TodoPage extends Component {
    render() {
        return (
            <Container>
                <Header as='h2'>My Todo</Header>
                <AddTodo />
                <TodoList />
                <Footer />
            </Container>
        )
    }
}
