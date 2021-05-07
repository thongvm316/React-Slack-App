import React, { Component } from 'react'
import firebase from '../../firebase'
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions/index'
import { Menu, Icon, Modal, Form, Input, Button } from 'semantic-ui-react'

class Channels extends Component {
  state = {
    activeChannel: '',
    user: this.props.currentUser,
    channels: [],
    channelName: '',
    channelDetails: '',
    channelsRef: firebase.database().ref('channels'), // create collection channels, if channel is not create --> auto create
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
  }

  // get all data of channel after add
  addListeners() {
    let loadedChannels = []
    this.state.channelsRef.on('child_added', (snap) => {
      loadedChannels.push(snap.val())
      this.setState({ channels: loadedChannels }, () => this.setFirstChannel())
    })
  }

  // Used for page load first time and active first channel
  setFirstChannel = () => {
    const firstChannel = this.state.channels[0]
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.setActiveChannel(firstChannel)
      this.props.setCurrentChannel(firstChannel)
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
          # {channel.name}
        </Menu.Item>
      )
    })

  // When select other channel --> active that channel and set it to current channel
  changeChannel = (channel) => {
    this.setActiveChannel(channel)
    this.props.setCurrentChannel(channel)
    this.props.setPrivateChannel(false)
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
