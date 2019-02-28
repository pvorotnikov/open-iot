import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import hat from 'hat'
import reactCSS from 'reactcss'
import { connect } from 'react-redux'
import { Header, Icon, Form, Button, Table, Input, Dropdown } from 'semantic-ui-react'

import { EditableText, ConfirmModal } from '../_components'
import { tagActions } from '../_actions'

class Tags extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            newTags: [],
            values: {
                tags: {}
            }
        }
    }

    componentDidMount() {
        this.props.dispatch(tagActions.getAll())
    }

    onTagChange(id, data) {
        const { name, value } = data
        let updatedTag = name === 'name'
            ? { ...this.state.values[id], name: this.sanitizeTagName(value) }
            : { ...this.state.values[id], constraint: value }
        this.setState({ values: { ...this.state.values, [id]: updatedTag }})
    }

    onTagDelete(id) {
        this.props.dispatch(tagActions.delete(id))
    }

    onTagSave(id) {
        let updatedTag = {...this.state.values[id]}
        this.props.dispatch(tagActions.update(id, updatedTag))
    }

    onNewTagAdd() {
        this.setState({ newTags: [...this.state.newTags, {name: '', constraint: 'no'}] })
    }

    onNewTagChange(index, data) {
        const { name, value } = data
        this.setState({
            newTags: this.state.newTags.map((t, i) => {
                if (i === index) {
                    return name === 'name'
                        ? { ...t, name: this.sanitizeTagName(value), }
                        : { ...t, constraint: value }
                } else {
                    return t
                }
            })
        })
    }

    onNewTagDelete(index) {
        this.setState({ newTags: this.state.newTags.filter((nt, i) => i !== index) })
    }

    onNewTagSave(index) {
        let { name, constraint } = this.state.newTags[index]
        this.onNewTagDelete(index)
        this.props.dispatch(tagActions.create({ name, constraint }))
    }

    availableConstraints() {
        return [
            { value: 'no', text: 'None' },
            { value: 'application', text: 'Application' },
            { value: 'global', text: 'Global' },
        ]
    }

    sanitizeTagName(name) {
        return name.toLowerCase().replace(/\s/g, '')
    }

    renderTags() {
        const { tags } = this.props
        const { newTags } = this.state
        const styles = reactCSS({
            default: {
                form: {
                    marginTop: 10,
                },
                delete: {
                    verticalAlign: 'middle'
                },
            }
        })

        const tagFields = tags.map(tag => {
            const { id, name, constraint, } = tag
            return (
                <Table.Row key={id}>
                    <Table.Cell>
                        <Input
                            name='name'
                            defaultValue={name}
                            onChange={(e, data) => this.onTagChange(id, data)} />
                        </Table.Cell>
                    <Table.Cell>
                        <Dropdown
                            name='constraint'
                            defaultValue={constraint}
                            inline
                            options={this.availableConstraints()}
                            onChange={(e, data) => this.onTagChange(id, data)} />
                    </Table.Cell>
                    <Table.Cell>
                        <Icon link name='save' onClick={() => this.onTagSave(id)} />
                        <Icon link name='delete' color='red' onClick={() => this.onTagDelete(id)} />
                    </Table.Cell>
                </Table.Row>
            )
        }).concat(newTags.map((nt, index) => (
            <Table.Row key={`newtag-${index}`}>
                <Table.Cell>
                    <Input
                        name='name'
                        value={nt.name}
                        onChange={(e, data) => this.onNewTagChange(index, data)} />
                </Table.Cell>
                <Table.Cell>
                    <Dropdown
                        name='constraint'
                        value={nt.constraint}
                        inline
                        options={this.availableConstraints()}
                        onChange={(e, data) => this.onNewTagChange(index, data)} />
                </Table.Cell>
                <Table.Cell>
                    <Icon link name='save' onClick={() => this.onNewTagSave(index)} />
                    <Icon link name='delete' color='red' onClick={() => this.onNewTagDelete(index)} />
                </Table.Cell>
            </Table.Row>
        )))

        return tagFields
    }

    render() {
        return (
            <Table celled columns='3'>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Tag Name</Table.HeaderCell>
                        <Table.HeaderCell>Constraint</Table.HeaderCell>
                        <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    { this.renderTags() }
                </Table.Body>
                <Table.Footer>
                    <Table.Row>
                        <Table.HeaderCell colSpan={3}>
                            <Button circular icon='plus' color='green' onClick={this.onNewTagAdd.bind(this)} />
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Footer>
            </Table>
        )
    }
}

Tags.propTypes = {
    loading: PropTypes.bool,
    tags: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { tags } = state
    const { loading } = tags
    return {
        tags: tags.items,
        loading,
    }
}

const connectedTags = connect(mapStateToProps)(Tags)
export { connectedTags as Tags }
