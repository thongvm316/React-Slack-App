import React, { Component } from 'react'
import firebase from '../../firebase'
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions/index'
import {
  Menu,
  Icon,
  Modal,
  Form,
  Input,
  Button,
  Label,
} from 'semantic-ui-react'

class Channels extends Component {
  state = {
    activeChannel: '',
    user: this.props.currentUser,
    channels: [],
    channel: null,
    channelName: '',
    channelDetails: '',
    channelsRef: firebase.database().ref('channels'), // create collection channels, if channel is not create --> auto create
    messagesRef: firebase.database().ref('messages'),
    typingRef: firebase.database().ref('typing'),
    notifications: [],
    modal: false,
    firstLoad: true,
  }

  componentDidMount() {
    this.addListeners()
  }

  // ??? purpose
  componentWillUnmount() {
    this.removeListener()
  }

  removeListener = () => {
    this.state.channelsRef.off()
    this.state.channels.forEach((channel) => {
      this.state.messagesRef.child(channel.id).off()
    })
  }

  // get all data of channel after add
  addListeners() {
    let loadedChannels = []
    this.state.channelsRef.on('child_added', (snap) => {
      // console.table('addListeners', snap.key)
      loadedChannels.push(snap.val())
      this.setState({ channels: loadedChannels }, () => {
        this.setFirstChannel()
        // this.setState({ channel: loadedChannels[0] })
      })
      this.addNotifications(snap.key)
    })
  }

  addNotifications = (channelId) => {
    // get value of child(channelId)
    this.state.messagesRef.child(channelId).on('value', (snap) => {
      if (this.state.channel) {
        this.handleNotifications(
          channelId,
          this.state.channel.id,
          this.state.notifications,
          snap,
        )
      }
    }) // this callback fn will be triggered when data changed, this is why when i click btn 'Add a reply' then this callback be triggerd.
    // And when click 'Add a reply', how fn get channelId ? --> According to documentation of firebase is at first time page load, this fn call two time cuz database have two channel, so when data of message changed in which channel is fn with that channel will be call again

    /* Refer documentation: value event
This event will trigger once with the initial data stored at this location, and then trigger again each time the data changes. The DataSnapshot passed to the callback will be for the location at which on() was called. It won't trigger until the entire contents has been synchronized. If the location has no data, it will be triggered with an empty DataSnapshot (val() will return null). */
  }

  handleNotifications = (channelId, currentChannelId, notifications, snap) => {
    // console.table(
    //   channelId,
    //   currentChannelId,
    //   notifications,
    //   snap.numChildren(),
    // )
    let lastTotal = 0
    let index = notifications.findIndex((notification) => {
      return notification.id === channelId
    })

    if (index !== -1) {
      if (channelId !== currentChannelId) {
        lastTotal = notifications[index].total

        if (snap.numChildren() - lastTotal > 0) {
          notifications[index].count = snap.numChildren() - lastTotal
        }
      } // in the case, other account is using and was select other channel --> show quantity new messages, this is feature of realtime data of firebase

      notifications[index].lastKnownTotal = snap.numChildren()
    } else {
      notifications.push({
        id: channelId,
        total: snap.numChildren(),
        lastKnownTotal: snap.numChildren(),
        count: 0,
      })
    }

    this.setState({ notifications })
  }

  // Used for page load first time and active first channel
  setFirstChannel = () => {
    const firstChannel = this.state.channels[0]
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.setActiveChannel(firstChannel)
      this.props.setCurrentChannel(firstChannel)
      this.setState({ channel: firstChannel })
    }

    this.setState({ firstLoad: false })
  }

  // add channels to realtime database
  addChannel = () => {
    const { channelsRef, channelName, channelDetails, user } = this.state
    const key = channelsRef.push().key // get uuid

    const newChannel = {
      id: key,
      name: channelName,
      details: channelDetails,
      createdBy: {
        name: user.displayName,
        avatar: user.photoURL,
      },
    }

    // Get value from Form and store to Realtime Database
    channelsRef
      .child(key)
      .update(newChannel)
      .then(() => {
        this.setState({ channelName: '', channelDetails: '' })
        this.closeModal()
        console.log('channel added')
      })
      .catch((err) => console.log(err))
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value })
  }

  handleSubmit = (event) => {
    event.preventDefault()
    if (this.isFormValid(this.state)) {
      this.addChannel()
    }
  }

  getNotificationCount = (channel) => {
    let count = 0

    this.state.notifications.forEach((notification) => {
      if (notification.id === channel.id) {
        count = notification.count
      }
    })

    if (count > 0) return count
  }

  displayChannel = (channels) =>
    channels.length > 0 &&
    channels.map((channel) => {
      return (
        <Menu.Item
          key={channel.id}
          onClick={() => {
            this.changeChannel(channel)
          }}
          name={channel.name}
          style={{ opacity: 0.7 }}
          active={channel.id === this.state.activeChannel}
        >
          {this.getNotificationCount(channel) && (
            <Label color="red">{this.getNotificationCount(channel)}</Label>
          )}
          # {channel.name}
        </Menu.Item>
      )
    })

  // When select other channel --> active that channel and set it to current channel
  changeChannel = (channel) => {
    this.setActiveChannel(channel)
    this.clearNotifications()
    this.state.typingRef
      .child(this.state.channel.id)
      .child(this.state.user.uid)
      .remove()
    this.props.setCurrentChannel(channel)
    this.props.setPrivateChannel(false)
    this.setState({ channel })
  }

  clearNotifications = () => {
    let index = this.state.notifications.findIndex(
      (notification) => notification.id === this.state.channel.id,
    )

    if (index !== -1) {
      let updatedNotifications = [...this.state.notifications]
      updatedNotifications[index].total = this.state.notifications[
        index
      ].lastKnownTotal
      updatedNotifications[index].count = 0
      this.setState({ notifications: updatedNotifications })
    }
  }

  setActiveChannel = (channel) => {
    this.setState({ activeChannel: channel.id })
  }

  isFormValid = ({ channelName, channelDetails }) =>
    channelName && channelDetails

  openModal = () => this.setState({ modal: true })
  closeModal = () => this.setState({ modal: false })

  render() {
    const { channels, modal } = this.state

    return (
      <>
        <Menu.Menu style={{ paddingBottom: '2rem' }} className="menu">
          <Menu.Item>
            <span>
              <Icon name="exchange" /> CHANNELS
            </span>
            ({channels.length}) <Icon name="add" onClick={this.openModal} />
          </Menu.Item>
          {this.displayChannel(channels)}
        </Menu.Menu>

        {/* Add Channel Modal */}
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>Add a Channel</Modal.Header>
          <Modal.Content>
            <Form onSubmit={this.handleSubmit}>
              <Form.Field>
                <Input
                  fluid
                  label="Name of Channel"
                  name="channelName"
                  onChange={this.handleChange}
                />
              </Form.Field>

              <Form.Field>
                <Input
                  fluid
                  label="About the Channel"
                  name="channelDetails"
                  onChange={this.handleChange}
                />
              </Form.Field>
            </Form>
          </Modal.Content>

          <Modal.Actions>
            <Button color="green" inverted onClick={this.handleSubmit}>
              <Icon name="checkmark" /> Add
            </Button>
            <Button color="red" inverted onClick={this.closeModal}>
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </>
    )
  }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(Channels)
