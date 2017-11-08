import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Icon, Input } from 'semantic-ui-react'

export class EditableText extends Component {

    constructor(props) {
        super(props)

        this.state = {
            inEdit: false,
            value: ''
        }
    }

    onChange(e, data) {
        this.setState({ value: data.value })
        if (this.props.onChange) {
            this.props.onChange(e, data)
        }
    }

    startEdit() {
        this.setState({
            inEdit: true,
            value: this.props.text,
        })
    }

    completeEdit() {
        this.setState({inEdit: false})
        this.props.onUpdate(this.state.value)
    }

    renderNonEditableContent() {
        const { text } = this.props

        return (
            <span>
                <span>{text}</span>
                { '' !== text && <Icon link name='edit' size='small' style={{marginLeft: '10px'}} onClick={this.startEdit.bind(this)} /> }
            </span>
        )
    }

    renderEditableContent() {
        const { text } = this.props

        return (
            <span>
                <Input size='small' defaultValue={text} onChange={this.onChange.bind(this)} />
                <Icon link name='save' size='small' style={{marginLeft: '10px'}} onClick={this.completeEdit.bind(this)} />
            </span>
        )
    }

    render() {
        return this.state.inEdit
            ? this.renderEditableContent()
            : this.renderNonEditableContent()
    }

}

EditableText.propTypes = {
    text: PropTypes.string.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onChange: PropTypes.func,
}
