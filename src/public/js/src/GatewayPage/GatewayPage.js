import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import hat from 'hat'
import reactCSS from 'reactcss'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Header, Container, Segment, Icon, Form, Label, Loader, Button } from 'semantic-ui-react'

import { EditableText, ConfirmModal } from '../_components'
import { gatewayActions } from '../_actions'

class GatewayPage extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            tags: [['', '']]
        }
    }

    componentDidMount() {
        this.props.dispatch(gatewayActions.getSingle(this.props.match.params.gw))
    }

    componentWillReceiveProps(newProps) {
        if (!_.isEqual(this.props.gateway, newProps.gateway) && newProps.gateway.tags) {
            let tags = newProps.gateway.tags
            let tagEntries = Object.keys(tags).map(tagName => [tagName, tags[tagName]])
            tagEntries.push(['', ''])
            this.setState({ tags: tagEntries })
        }
    }

    onSubmit() {
        const { gateway } = this.props
        let tags = {}
        this.state.tags.filter(t => {
            let [name, value] = t
            return (!_.isEmpty(name) && !_.isEmpty(value))
        }).forEach(t => {
            let [name, value] = t
            tags[name] = value
        })
        this.props.dispatch(gatewayActions.update(gateway.id, {tags}))
    }

    onChange(e, data) {
        let { name, value } = data
        let [fieldName, index] = name.split('-')
        index = parseInt(index)
        let newTags = this.state.tags.map((t, i) => {
            return i !== index
                ? t
                : 'name' === fieldName
                    ? [value.toLowerCase().replace(/\s/g, ''), t[1]]
                    : [t[0], value]
        })
        if (index === this.state.tags.length - 1) {
            newTags.push(['', ''])
        }
        this.setState({ tags: newTags })
    }

    onEditableTextUpdate(name, value) {
        const { gateway } = this.props
        let trimmedValue = value.trim()
        let updatedGateway = {
            [name]: trimmedValue,
        }
        this.props.dispatch(gatewayActions.update(gateway.id, updatedGateway))
    }

    onTagDelete(index) {
        let newTags = this.state.tags.filter((t, i) => i !== index)
        if (!newTags.length) {
            newTags.push(['', ''])
        }
        this.setState({ tags: newTags })
    }

    renderHeader() {
        const { gateway } = this.props
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='connectdevelop' circular />
                    <Header.Content>
                        <EditableText text={gateway.name || ''} onUpdate={(value) => this.onEditableTextUpdate('name', value)} />
                        <Loader active={this.props.loading} inline size='small' />
                        <Header.Subheader>{gateway.id && `ID: ${gateway.id}`}</Header.Subheader>
                        <Header.Subheader>
                            Alias: <EditableText text={gateway.alias || ''} onUpdate={(value) => this.onEditableTextUpdate('alias', value.toLowerCase().replace(/\s/g, ''))} />
                        </Header.Subheader>
                    </Header.Content>
                </Header>
                <EditableText text={gateway.description || ''} onUpdate={(value) => this.onEditableTextUpdate('description', value)} />
            </Container>
        )
    }

    renderTags() {
        const { gateway, loading, history } = this.props
        const { tags } = this.state
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

        const tagFields = tags.map((tag, index) => {
            const [tagName, tagValue] = tag
            return (
                <Form.Group key={index}>
                    <Form.Input name={`name-${index}`} placeholder='tag-name' value={tagName} onChange={this.onChange.bind(this)} />
                    <Form.Input name={`value-${index}`} placeholder='tag-value' value={tagValue} onChange={this.onChange.bind(this)} />
                    <Icon style={styles.delete} link name='delete' color='red' onClick={() => this.onTagDelete(index)} />
                </Form.Group>
            )
        })

        return (
            <Segment raised loading={loading}>
                <Label color='blue' ribbon>Tags</Label>
                <Form style={styles.form} onSubmit={this.onSubmit.bind(this)}>
                    { tagFields }
                    <Form.Group>
                        <Form.Button circular icon='save' color='green' />
                        <Button circular floated='right' icon='chevron left' color='orange' onClick={ e => history.goBack() } />
                    </Form.Group>
                </Form>
            </Segment>
        )
    }

    render() {
        const { history, gateway } = this.props

        return (
            <Container>
                { this.renderHeader() }
                { this.renderTags() }
            </Container>
        )
    }
}

GatewayPage.propTypes = {
    loading: PropTypes.bool,
    gateway: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    const { gateways } = state
    const { loading } = gateways
    return {
        gateway: gateways.gateway,
        loading,
    }
}

const connectedGatewayPage = connect(mapStateToProps)(withRouter(GatewayPage))
export { connectedGatewayPage as GatewayPage }
