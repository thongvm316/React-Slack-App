import React, { Component } from 'react'
import firebase from '../../firebase'
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions'
import { Menu, Icon } from 'semantic-ui-react'

class DirectMessages extends Component {
  state = {
    activeChannel: '',
    user: this.props.currentUser,
    users: [],
    usersRef: firebase.database().ref('users'),
    connectedRef: firebase.database().ref('.info/connected'), // For many presence-related features, it is useful for your app to know when it is online or offline. Firebase Realtime Database provides a special location at /.info/connected which is updated every time the Firebase Realtime Database client's connection state changes
    // /.info/connected is a boolean value which is not synchronized between Realtime Database clients because the value is dependent on the state of the client. In other words, if one client reads /.info/connected as false, this is no guarantee that a separate client will also read false.
    // --> Fllow state of cline is online or offline // Location which is store user online or offline
    presenceRef: firebase.database().ref('presence'), // refer, if not exits, auto create new
  }

  componentDidMount() {
    if (this.state.user) {
      this.addListeners(this.state.user.uid)
    }
  }

  componentWillUnmount() {
    this.state.usersRef.off()
    this.state.presenceRef.off()
    this.state.connectedRef.off()
  }

  addListeners = (currentUserUid) => {
    let loadedUsers = []

    // get all users in database
    this.state.usersRef.on('child_added', (snap) => {
      // snap.val() -> get all user in db
      // snap.key -> get uid(key) of each users in db
      if (currentUserUid !== snap.key) {
        let user = snap.val()
        user['uid'] = snap.key
        user['status'] = 'offline'
        loadedUsers.push(user)
        this.setState({ users: loadedUsers })
      } // look for user offline
    })

    this.state.connectedRef.on('value', (snap) => {
      // snap.val() return true when user was logined
      if (snap.val() === true) {
        const ref = this.state.presenceRef.child(currentUserUid) // set key
        ref.set(true) // set value
        ref.onDisconnect().remove((err) => {
          if (err !== null) {
            console.log(err)
          } // when client signout, remove feild in presence with uid of this client
        })
      }
    })

    /* onDisconnect: The onDisconnect class allows you to write or clear data when your client disconnects from the Database server. These updates occur whether your client disconnects cleanly or not, so you can rely on them to clean up data even if a connection is dropped or a client crashes.

The onDisconnect class is most commonly used to manage presence in applications where it is useful to detect how many clients are connected and when other clients disconnect. See Enabling Offline Capabilities in JavaScript for more information.

To avoid problems when a connection is dropped before the requests can be transferred to the Database server, these functions should be called before writing any data.

Note that onDisconnect operations are only triggered once. If you want an operation to occur each time a disconnect occurs, you'll need to re-establish the onDisconnect operations each time you reconnec */

    this.state.presenceRef.on('child_added', (snap) => {
      if (currentUserUid !== snap.key) {
        this.addStatusToUser(snap.key)
      }
    }) // purpose: when to much client login and use this app --> show online

    this.state.presenceRef.on('child_removed', (snap) => {
      if (currentUserUid !== snap.key) {
        this.addStatusToUser(snap.key, false)
      }
    })
  }

  addStatusToUser = (userId, connected = true) => {
    const updateUsers = this.state.users.reduce((acc, user) => {
      if (user.uid === userId) {
        user['status'] = `${connected ? 'online' : 'offline'}`
      }

      return acc.concat(user)
    }, []) // update status to user

    this.setState({ users: updateUsers })
  }

  isUserOnline = (user) => user.status === 'online'

  changeChannel = (user) => {
    const channelId = this.getChannelId(user.uid)
    const channelData = {
      id: channelId,
      name: user.name,
    }

    this.props.setCurrentChannel(channelData)
    this.props.setPrivateChannel(true)
    this.setActiveChannel(user.uid)
  }

  /* Purpose: Use in the case that two user chat with each other and show data */
  getChannelId = (userId) => {
    const currentUserId = this.state.user.uid
    return userId < currentUserId
      ? `${userId}/${currentUserId}`
      : `${currentUserId}/${userId}`
  }

  setActiveChannel = (userId) => {
    this.setState({
      activeChannel: userId,
    })
  }

  render() {
    const { users, activeChannel } = this.state

    return (
      <Menu.Menu className="menu">
        <Menu.Item>
          <span>
            <Icon name="mail" /> DIRECT MESSAGES
          </span>
          ({users.length})
        </Menu.Item>
        {/* Users to send direct message */}
        {users.map((user) => (
          <Menu.Item
            key={user.uid}
            active={user.uid === activeChannel}
            onClick={() => this.changeChannel(user)}
            style={{ opacity: 0.7, fontStyle: 'italic' }}
          >
            <Icon
              name="circle"
              color={this.isUserOnline(user) ? 'green' : 'red'}
            />
            @ {user.name}
          </Menu.Item>
        ))}
      </Menu.Menu>
    )
  }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(
  DirectMessages,
)
