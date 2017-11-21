import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Header, Modal } from 'semantic-ui-react'

export class ConfirmModal extends Component {

    handleConfirm() {
        this.props.onConfirm()
    }

    handleCancel() {
        if (this.props.onCancel) {
            this.props.onCancel()
        }
    }

    render() {
        return (
            <Modal trigger={this.props.trigger}
                size='tiny'
                basic
                header={(<Header icon='warning circle' content={this.props.title} />)}
                content={this.props.text}
                actions={[
                    { inverted: true, color:'red', key: 'cancel', content: 'No', positive: false, onClick: this.handleCancel.bind(this) },
                    { inverted: true, color:'green', key: 'done', icon: 'checkmark', content: 'Yes', positive: true, onClick: this.handleConfirm.bind(this) },
                ]} />
        )
    }

}

ConfirmModal.propTypes = {
    trigger: PropTypes.element.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    title: PropTypes.string.isRequired,
}

ConfirmModal.defaultProps = {
    title: 'Do you confirm your choice?',
    text: 'Your actions might render your application inoperable.'
}
