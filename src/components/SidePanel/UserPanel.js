import React, { Component } from 'react'
import firebase from '../../firebase'
import AvatarEditor from 'react-avatar-editor'

import {
  Grid,
  Icon,
  Header,
  Dropdown,
  Image,
  Modal,
  Input,
  Button,
} from 'semantic-ui-react'

class UserPanel extends Component {
  state = {
    user: this.props.currentUser,
    channel: this.props.currentChannel,
    modal: false,
    previewImage: '',
    croppedImage: '',
    blob: '',
    uploadCroppedImage: '',
    storageRef: firebase.storage().ref(),
    userRef: firebase.auth().currentUser,
    usersRef: firebase.database().ref('users'),
    presenceRef: firebase.database().ref('presence'),
    typingRef: firebase.database().ref('typing'),
    metadata: {
      contentType: 'image/jpeg',
    },
  }

  openModal = () => this.setState({ modal: true })
  closeModal = () => this.setState({ modal: false })

  dropdownOptions = () => [
    {
      key: 'user',
      text: (
        <span>
          Signed in as <strong>{this.state.user.displayName}</strong>
        </span>
      ),
      disabled: true,
    },
    {
      key: 'avatar',
      text: <span onClick={this.openModal}>Change Avatar</span>,
    },
    {
      key: 'signout',
      text: <span onClick={this.handleSignout}>Sign Out</span>,
    },
  ]

  // componentDidMount() {
  //   console.log(
  //     'Sign out',
  //     this.state.user.uid,
  //     this.state.presenceRef.child(this.state.user.uid),
  //   )

  //   this.state.presenceRef.child(this.state.user.uid).remove()
  // }

  handleSignout = () => {
    this.state.presenceRef.child(this.state.user.uid).remove((err) => {
      if (err !== null) {
        console.log(err)
      }
    })

    this.state.typingRef
      .child(this.state.channel.id)
      .child(this.state.user.uid)
      .remove((err) => console.log(err))

    firebase
      .auth()
      .signOut()
      .then(() => {
        // console.log('Sign out')
        firebase.database().goOffline()
      })
  }

  handleChange = (event) => {
    const file = event.target.files[0]
    const reader = new FileReader()

    if (file) {
      reader.readAsDataURL(file) // convert file to base 64 and store to reader
      reader.addEventListener('load', () => {
        this.setState({ previewImage: reader.result })
      }) // why use this fn, cuz after exec reader.readAsDataURL(file), propety result in reader equal null, so must use this fn then value will be store in reader.result
    }
  }

  hanldeCropImage = () => {
    if (this.avatarEditor) {
      this.avatarEditor.getImageScaledToCanvas().toBlob((blob) => {
        let imageUrl = URL.createObjectURL(blob)
        this.setState({
          croppedImage: imageUrl,
          blob,
        })
      })
    }
  }

  uploadCroppedImage = () => {
    const { storageRef, userRef, blob, metadata } = this.state

    storageRef
      .child(`avatars/users/${userRef.uid}`)
      .put(blob, metadata)
      .then((snap) => {
        console.log(snap)
        snap.ref.getDownloadURL().then((dowloadUrl) => {
          // get url of imgae
          this.setState({ uploadCroppedImage: dowloadUrl }, () => {
            this.changeAvatar()
          })
        })
      })
  }

  changeAvatar = () => {
    this.state.userRef
      .updateProfile({
        photoURL: this.state.uploadCroppedImage,
      })
      .then(() => {
        console.log('PhotoURL updated')
        this.closeModal()
      })
      .catch((err) => {
        console.log(err)
      })

    this.state.usersRef
      .child(this.state.user.uid)
      .update({ avatar: this.state.uploadCroppedImage })
      .then(() => {
        console.log('User avatar updated')
      })
      .catch((err) => console.log(err))
  }

  render() {
    const { user, modal, previewImage, croppedImage } = this.state
    const { primaryColor } = this.props

    return (
      <Grid style={{ background: primaryColor }}>
        <Grid.Column>
          <Grid.Row style={{ padding: '1.2em', margin: 0 }}>
            {/* App Header */}
            <Header inverted floated="left" as="h2">
              <Icon name="code" />
              <Header.Content>DevChat</Header.Content>
            </Header>

            {/* User Dropdown */}
            <Header style={{ padding: '0.25em' }} as="h4" inverted>
              <Dropdown
                trigger={
                  <span>
                    <Image src={user && user.photoURL} spaced="right" avatar />
                    {user.displayName}
                  </span>
                }
                options={this.dropdownOptions()}
              />
            </Header>
          </Grid.Row>

          {/* Change User Avatar Modal */}
          <Modal basic open={modal} onClose={this.closeModal}>
            <Modal.Header>Change Avatar</Modal.Header>
            <Modal.Content>
              <Input
                onChange={this.handleChange}
                fluid
                type="file"
                label="New Avatar"
                name="previewImage"
              />
              <Grid centered stackable columns={2}>
                <Grid.Column className="ui center aligned grid">
                  {previewImage && (
                    <AvatarEditor
                      ref={(node) => {
                        // console.log(node)
                        return (this.avatarEditor = node)
                      }}
                      image={previewImage}
                      width={120}
                      height={120}
                      border={50}
                      scale={1.2}
                    />
                  )}
                </Grid.Column>
                <Grid.Column>
                  {croppedImage && (
                    <Image
                      style={{ margin: '3.5em auto' }}
                      width={100}
                      height={100}
                      src={croppedImage}
                    />
                  )}
                </Grid.Column>
              </Grid>
            </Modal.Content>
            <Modal.Actions>
              {croppedImage && (
                <Button
                  color="green"
                  inverted
                  onClick={this.uploadCroppedImage}
                >
                  <Icon name="save" /> Change Avatar
                </Button>
              )}
              <Button color="green" inverted onClick={this.hanldeCropImage}>
                <Icon name="image" /> Preview
              </Button>
              <Button color="red" inverted onClick={this.closeModal}>
                <Icon name="remove" /> Cancel
              </Button>
            </Modal.Actions>
          </Modal>
        </Grid.Column>
      </Grid>
    )
  }
}

export default UserPanel
