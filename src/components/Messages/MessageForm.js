import React, { Component } from 'react'
import { Segment, Button, Input } from 'semantic-ui-react'
import firebase from '../../firebase'

export default class MessageForm extends Component {
  state = {
    message: '',
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    loading: false,
    errors: [],
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  createMessage = () => {
    const message = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        id: this.state.user.uid,
        name: this.state.user.displayName,
        avatar: this.state.user.photoURL,
      },
      content: this.state.message,
    }
    return message
  }

  // Get value from Form and store to realtime database
  sendMessage = () => {
    const { messagesRef } = this.props
    const { message, channel } = this.state

    if (message) {
      this.setState({ loading: true })
      messagesRef
        .child(channel.id)
        .push()
        .set(this.createMessage())
        .then(() => {
          this.setState({ loading: false, message: '', errors: [] })
        })
        .catch((err) => {
          console.log(err)
          this.setState({
            loading: false,
            errors: this.state.errors.concat(err),
          })
        })
    } else {
      this.setState({
        errors: this.state.errors.concat({ message: 'Add a message' }),
      })
    }
  }

  render() {
    const { errors } = this.state

    return (
      <Segment>
        <Input
          fluid
          name="message"
          onChange={this.handleChange}
          style={{ marginBottom: '0.7em' }}
          label={<Button icon={'add'} />}
          labelPosition="left"
          placeholder="Write your message"
          className={
            errors.some((error) => error.message.includes('message'))
              ? 'error'
              : ''
          }
        />
        <Button.Group>
          <Button
            onClick={this.sendMessage}
            color="orange"
            content="Add Reply"
            labelPosition="left"
            icon="edit"
          />
          <Button
            color="teal"
            content="Upload Media"
            labelPosition="right"
            icon="cloud upload"
          />
        </Button.Group>
      </Segment>
    )
  }
}
