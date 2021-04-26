import React from 'react'
import { Segment, Comment } from 'semantic-ui-react'
import firebase from '../../firebase'

import Message from './Message'
import MessagesHeader from './MessagesHeader'
import MessageForm from './MessageForm'

class Messages extends React.Component {
  state = {
    messagesRef: firebase.database().ref('messages'),
    messages: [],
    messagesLoading: true,
    channel: this.props.currentChannel,
    user: this.props.currentUser,
  }

  componentDidMount() {
    const { channel, user } = this.state

    if (channel && user) {
      this.addListener(channel.id)
    }
  }

  addListener = (channelId) => {
    this.addMessageListener(channelId)
  }

  // get data from database
  addMessageListener = (channelId) => {
    let loadedMessage = []
    this.state.messagesRef.child(channelId).on('child_added', (snap) => {
      loadedMessage.push(snap.val())
      this.setState({
        messages: loadedMessage,
        messagesLoading: false,
      })
    })
  }

  displayMessage = (messages) =>
    messages.length > 0 &&
    messages.map((message) => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
      />
    ))

  render() {
    const { messagesRef, messages, channel, user } = this.state

    return (
      <>
        <MessagesHeader />

        <Segment>
          <Comment.Group className="message">
            {this.displayMessage(messages)}
          </Comment.Group>
        </Segment>

        <MessageForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
        />
      </>
    )
  }
}

export default Messages
