import React, { Component } from 'react'
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions'
import { Menu, Icon } from 'semantic-ui-react'

class Starred extends Component {
  state = {
    activeChannel: '',
    starredChannels: [],
  }

  setActiveChannel = (channel) => {
    this.setState({ activeChannel: channel.id })
  }

  // When select other channel --> active that channel and set it to current channel
  changeChannel = (channel) => {
    this.setActiveChannel(channel)
    this.props.setCurrentChannel(channel)
    this.props.setPrivateChannel(false)
  }

  displayChannel = (starredChannels) =>
    starredChannels.length > 0 &&
    starredChannels.map((channel) => {
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

  render() {
    const { starredChannels } = this.state

    return (
      <Menu.Menu style={{ paddingBottom: '2rem' }} className="menu">
        <Menu.Item>
          <span>
            <Icon name="star" /> Starred
          </span>
          ({starredChannels.length})
        </Menu.Item>
        {this.displayChannel(starredChannels)}
      </Menu.Menu>
    )
  }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(Starred)
