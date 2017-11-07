import React, { Component } from 'react'

import { Container, Header, Icon } from 'semantic-ui-react'
import { AddTodo, Footer, TodoList } from './'

export class TodoPage extends Component {
    render() {
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='tasks' circular />
                    <Header.Content>My Todo List</Header.Content>
                </Header>
                <AddTodo />
                <TodoList />
                <Footer />
            </Container>
        )
    }
}
