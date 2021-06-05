import React from 'react'
import { Segment, Comment } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { setUserPosts } from '../../actions'
import firebase from '../../firebase'

import MessagesHeader from './MessagesHeader'
import MessageForm from './MessageForm'
import Message from './Message'
import Typing from './Typing'
import Skeleton from './Skeleton'

class Messages extends React.Component {
  state = {
    privateChannel: this.props.isPrivateChannel,
    privateMessagesRef: firebase.database().ref('privateMessages'),
    messagesRef: firebase.database().ref('messages'),
    messages: [],
    messagesLoading: true,
    isChannedStarred: false,
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    usersRef: firebase.database().ref('users'),
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: [],
    typingRef: firebase.database().ref('typing'),
    typingUsers: [],
    connectedRef: firebase.database().ref('.info/connected'),
    listeners: [],
  }

  componentDidMount() {
    // console.log('Messages componentDidMount')
    const { channel, user, listeners } = this.state

    if (channel && user) {
      this.removeListeners(listeners)
      this.addListeners(channel.id)
      this.addUserStarsListener(channel.id, user.uid)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log('componentDidUpdate')
    if (this.messageEnd) {
      this.scrollToBottom()
    }
  }

  componentWillUnmount() {
    this.removeListeners(this.state.listeners)
    this.state.connectedRef.off()
  }

  removeListeners = (listeners) => {
    listeners.forEach((listener) => {
      listener.ref.child(listener.id).off(listener.event)
    })
  }

  scrollToBottom = () => {
    this.messageEnd.scrollIntoView({ behavior: 'smooth' })
  }

  addListeners = (channelId) => {
    this.addMessageListener(
      channelId,
      this.updateMessageLoadingStateWhenMessagesHasNoData,
    )
    this.addTypingListeners(channelId)
  }

  addToListeners = (id, ref, event) => {
    const { listeners } = this.state
    // console.table({ id, ref, event, listeners })
    const index = listeners.findIndex((listener) => {
      // const obj = {
      //   listenerId: listener.id,
      //   listenerRef: listener.ref,
      //   listenerEvent: listener.event,
      //   id,
      //   ref,
      //   event,
      // }
      // console.table({ listener, obj })
      return (
        listener.id === id && listener.ref === ref && listener.event === event
      )
    })

    // console.log(index)
    if (index === -1) {
      const newListener = { id, ref, event }
      this.setState((prevState) => ({
        listeners: prevState.listeners.concat(newListener),
      }))
    }
  }

  addTypingListeners = (channelId) => {
    let typingUsers = []
    this.state.typingRef.child(channelId).on('child_added', (snap) => {
      // console.log('child_added addTypingListeners')
      if (snap.key !== this.state.user.uid) {
        typingUsers = typingUsers.concat({
          id: snap.key,
          name: snap.val(),
        })
        // console.log(typingUsers)
        this.setState({ typingUsers })
      }
    })
    this.addToListeners(channelId, this.state.typingRef, 'child_added')

    this.state.typingRef.child(channelId).on('child_removed', (snap) => {
      // console.log('child_removed addTypingListeners')
      const index = typingUsers.findIndex((user) => user.id === snap.key)
      // console.log(index)
      if (index !== -1) {
        typingUsers = typingUsers.filter((user) => user.id !== snap.key)
        this.setState({ typingUsers })
      }
    })
    this.addToListeners(channelId, this.state.typingRef, 'child_removed')

    this.state.connectedRef.on('value', (snap) => {
      // console.log(snap.val())
      if (snap.val() === true) {
        this.state.typingRef
          .child(channelId)
          .child(this.state.user.uid)
          .onDisconnect()
          .remove((err) => {
            if (err !== null) console.log(err)
          })
      }
    }) // purpose: when user logout, then remove this user typing in database
  }

  addMessageListener = (
    channelId,
    updateMessageLoadingStateWhenMessagesHasNoData,
  ) => {
    let loadedMessages = []
    const ref = this.getMessagesRef()
    ref.child(channelId).on('child_added', (snap) => {
      // console.log('child_added addMessageListener')
      // console.log(snap.val())
      loadedMessages.push(snap.val())
      this.setState({
        messages: loadedMessages,
        messagesLoading: false,
      })
      this.countUniqueUsers(loadedMessages)
      this.countUserPosts(loadedMessages)
    })
    this.addToListeners(channelId, ref, 'child_added')
    updateMessageLoadingStateWhenMessagesHasNoData()
  } // get all messages in database

  updateMessageLoadingStateWhenMessagesHasNoData = () => {
    setTimeout(() => {
      if (this.state.messages.length === 0) {
        this.setState({ messagesLoading: false })
      }
      // console.log('test callback')
    }, 1000)
  }

  addUserStarsListener = (channelId, userId) => {
    this.state.usersRef
      .child(userId)
      .child('starred')
      .once('value')
      .then((data) => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val())
          const prevStarred = channelIds.includes(channelId)
          this.setState({ isChannedStarred: prevStarred })
        }
      })
  }

  getMessagesRef = () => {
    const { messagesRef, privateMessagesRef, privateChannel } = this.state
    return privateChannel ? privateMessagesRef : messagesRef
  }

  hanldeStar = () => {
    this.setState(
      (prevState) => {
        // console.log(prevState)
        return {
          isChannedStarred: !prevState.isChannedStarred,
        }
      },
      () => {
        this.starChannel()
      },
    )
  } // ???

  starChannel = () => {
    // starred
    if (this.state.isChannedStarred) {
      this.state.usersRef.child(`${this.state.user.uid}/starred`).update({
        [this.state.channel.id]: {
          name: this.state.channel.name,
          details: this.state.channel.details,
          createdBy: {
            name: this.state.channel.createdBy.name,
            avatar: this.state.channel.createdBy.avatar,
          },
        },
      }) // update value to obj of user
    } else {
      // unstart
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove((err) => {
          if (err !== null) {
            console.log(err)
          }
        }) // remove
    }
  }

  handleSearchChange = (event) => {
    this.setState(
      {
        searchTerm: event.target.value,
        searchLoading: true,
      },
      () => this.handleSearchMessages(),
    )
  }

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages]
    const regex = new RegExp(this.state.searchTerm, 'gi')
    const searchResults = channelMessages.reduce((acc, message) => {
      const hasMessage = message.content && message.content.match(regex)
      const hasUser =
        message.user && message.user.name && message.user.name.match(regex)
      if (hasMessage || hasUser) {
        acc.push(message)
      }
      return acc
    }, [])
    this.setState({ searchResults })
    setTimeout(() => this.setState({ searchLoading: false }), 1000)
  } // look for message or user

  countUniqueUsers = (messages) => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name)
      }
      return acc
    }, [])
    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? 's' : ''}`
    this.setState({ numUniqueUsers })
  }

  countUserPosts = (messages) => {
    let userPosts = messages.reduce((acc, message) => {
      // console.log(acc, message)
      // console.log(message.user.name in acc)
      if (message.user.name in acc) {
        acc[message.user.name].count += 1
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1,
        }
      }
      return acc
    }, {})
    this.props.setUserPosts(userPosts)
  }

  displayMessages = (messages) =>
    messages.length > 0 &&
    messages.map((message) => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
      />
    ))

  displayChannelName = (channel) => {
    return channel
      ? `${this.state.privateChannel ? '@' : '#'}${channel.name}`
      : ''
  }

  displayTypingUsers = (users) =>
    users.length > 0 &&
    users.map((user) => (
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '0.2em' }}
        key={user.id}
      >
        <span className="user__typing">{user.name} is typing</span> <Typing />
      </div>
    ))

  displayMessageSkeleton = (loading) => {
    // console.log(this.state.messagesLoading)
    return loading ? (
      <React.Fragment>
        {[...Array(10)].map((_, i) => {
          return <Skeleton key={i} />
        })}
      </React.Fragment>
    ) : null
  }

  render() {
    const {
      messagesRef,
      messages,
      channel,
      user,
      numUniqueUsers,
      searchTerm,
      searchResults,
      searchLoading,
      privateChannel,
      isChannedStarred,
      typingUsers,
      messagesLoading,
    } = this.state

    return (
      <React.Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={privateChannel}
          hanldeStar={this.hanldeStar}
          isChannedStarred={isChannedStarred}
        />

        <Segment>
          <Comment.Group className="messages">
            {this.displayMessageSkeleton(messagesLoading)}
            {searchTerm
              ? this.displayMessages(searchResults)
              : this.displayMessages(messages)}
            {this.displayTypingUsers(typingUsers)}
            <div ref={(node) => (this.messageEnd = node)}></div>
          </Comment.Group>
        </Segment>

        <MessageForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          isPrivateChannel={privateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </React.Fragment>
    )
  }
}

export default connect(null, { setUserPosts })(Messages)
