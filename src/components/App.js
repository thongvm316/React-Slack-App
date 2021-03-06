import React from 'react'
import { connect } from 'react-redux'
import { Grid } from 'semantic-ui-react'
import ColorPanel from './ColorPanel/ColorPanel'
import SidePanel from './SidePanel/SidePanel'
import Messages from './Messages/Messages'
import MetaPanel from './MetaPanel/MetaPanel'
import './App.css'

const App = ({
  currentUser,
  currentChannel,
  isPrivateChannel,
  userPosts,
  primaryColor,
  secondaryColor,
}) => (
  <Grid columns="equal" className="app" style={{ background: secondaryColor }}>
    <ColorPanel
      currentUser={currentUser}
      key={currentUser && currentUser.name}
    />
    <SidePanel
      key={currentUser && currentUser.uid} // ???
      currentUser={currentUser}
      primaryColor={primaryColor}
      currentChannel={currentChannel}
    />

    <Grid.Column style={{ marginLeft: 320 }}>
      <Messages
        key={currentChannel && currentChannel.id} // ???
        currentChannel={currentChannel}
        currentUser={currentUser}
        isPrivateChannel={isPrivateChannel}
      />
    </Grid.Column>

    <Grid.Column width={4}>
      <MetaPanel
        isPrivateChannel={isPrivateChannel}
        userPosts={userPosts}
        key={currentChannel && currentChannel.name}
        currentChannel={currentChannel}
      />
    </Grid.Column>
  </Grid>
)

const mapStateToProps = (state) => ({
  currentUser: state.user.currentUser,
  currentChannel: state.channel.currentChannel,
  isPrivateChannel: state.channel.isPrivateChannel,
  userPosts: state.channel.userPosts,
  primaryColor: state.colors.primaryColor,
  secondaryColor: state.colors.secondaryColor,
})

export default connect(mapStateToProps)(App)
