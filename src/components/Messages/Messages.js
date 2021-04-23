import React from 'react'
import { Segment, Comment } from 'semantic-ui-react'
import firebase from '../../firebase'

import MessagesHeader from './MessagesHeader'
import MessageForm from './MessageForm'

class Messages extends React.Component {
  state = {
    messagesRef: firebase.database().ref('messages'),
    channel: this.props.currentChannel,
    user: this.props.currentUser,
  }

  render() {
    const { messagesRef, channel, user } = this.state

    return (
      <>
        <MessagesHeader />

        <Segment>
          <Comment.Group className="message">{/* Messages */}</Comment.Group>
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
