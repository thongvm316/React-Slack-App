import React from 'react'
import {
  Sidebar,
  Menu,
  Divider,
  Button,
  Icon,
  Modal,
  Label,
  Segment,
} from 'semantic-ui-react'
import { SliderPicker } from 'react-color'
import firebase from '../../firebase'
import { connect } from 'react-redux'
import { setColors } from '../../actions'

class ColorPanel extends React.Component {
  state = {
    modal: false,
    primary: '#19404d',
    secondary: '#862d62',
    user: this.props.currentUser,
    usersRef: firebase.database().ref('users'),
    userColors: [],
  }

  componentDidMount() {
    if (this.state.user) {
      this.addListeners(this.state.user.uid)
    }
  }

  componentWillUnmount() {
    this.removeListener()
  }

  removeListener = () => {
    this.state.usersRef.child(`${this.state.user.uid}/colors`).remove()
  }

  addListeners = (userId) => {
    let userColors = []
    this.state.usersRef.child(`${userId}/colors`).on('child_added', (snap) => {
      userColors.unshift(snap.val())
      this.setState({ userColors })
    })
  }

  handleChangePrimary = (color) => this.setState({ primary: color.hex })
  handleChangeSecondary = (color) => this.setState({ secondary: color.hex })
  hanldeSaveColors = () => {
    if (this.state.primary && this.state.secondary) {
      this.saveColors(this.state.primary, this.state.secondary)
    }
  }

  saveColors = (primary, secondary) => {
    this.state.usersRef
      .child(`${this.state.user.uid}/colors`)
      .push() // create new key (uuid)
      .update({
        primary,
        secondary,
      })
      .then(() => {
        console.log('Colors Added')
        this.closeModal()
      })
      .catch((err) => console.log(err))
  }

  openModal = () => this.setState({ modal: true })
  closeModal = () => this.setState({ modal: false })

  displayUserColors = (colors) =>
    colors.length > 0 &&
    colors.map((color, i) => (
      <React.Fragment key={i}>
        <Divider />
        <div
          className='color__container'
          onClick={() => this.props.setColors(color.primary, color.secondary)}
        >
          <div className='color__square' style={{ background: color.primary }}>
            <div
              className='color__overlay'
              style={{ background: color.secondary }}
            ></div>
          </div>
        </div>
      </React.Fragment>
    ))

  render() {
    const { modal, primary, secondary, userColors } = this.state

    return (
      <Sidebar
        as={Menu}
        icon='labeled'
        inverted
        vertical
        visible
        width='very thin'
      >
        <Divider />
        <Button icon='add' size='small' color='blue' onClick={this.openModal} />
        {this.displayUserColors(userColors)}

        {/* Color Picker Modal */}
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>Choose App Colors</Modal.Header>
          <Modal.Content>
            <Segment inverted>
              <Label content='Primary Color' />
              <SliderPicker
                color={primary}
                onChange={this.handleChangePrimary}
              />
            </Segment>

            <Segment inverted>
              <Label content='Secondary Color' />
              <SliderPicker
                color={secondary}
                onChange={this.handleChangeSecondary}
              />
            </Segment>
          </Modal.Content>
          <Modal.Actions>
            <Button color='green' inverted onClick={this.hanldeSaveColors}>
              <Icon name='checkmark' /> Save Colors
            </Button>
            <Button color='red' inverted onClick={this.closeModal}>
              <Icon name='remove' /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </Sidebar>
    )
  }
}

export default connect(null, { setColors })(ColorPanel)
