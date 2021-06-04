import React, { Component } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Segment, Button, Input } from 'semantic-ui-react'
import { Picker, emojiIndex } from 'emoji-mart'
import 'emoji-mart/css/emoji-mart.css'
import firebase from '../../firebase'

import FileModal from './FileModal'
import ProgressBar from './ProgressBar'

export default class MessageForm extends Component {
  state = {
    storageRef: firebase.storage().ref(), // ref into firebase storage
    typingRef: firebase.database().ref('typing'),
    percentUploaded: 0,
    uploadState: '',
    uploadTask: null,
    message: '',
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    loading: false,
    errors: [],
    modal: false,
    emojiPicker: false,
  }

  componentWillUnmount() {
    if (this.state.uploadTask !== null) {
      this.state.uploadTask.cancel() // like off() method in database
      this.setState({ uploadTask: null })
    }
  }

  openModal = () => this.setState({ modal: true })
  closeModal = () => this.setState({ modal: false })

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value }, () => {
      const { message, typingRef, channel, user } = this.state
      // console.log('handleKeyDown', 'message: ' + message)
      if (message) {
        typingRef.child(channel.id).child(user.uid).set(user.displayName) // set() fn --> add value to key .child(user.uid)
      } else {
        typingRef.child(channel.id).child(user.uid).remove()
      }
    })
  }

  createMessage = (fileUrl = null) => {
    const message = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        id: this.state.user.uid,
        name: this.state.user.displayName,
        avatar: this.state.user.photoURL,
      },
    }

    if (fileUrl !== null) {
      message['image'] = fileUrl
    } else {
      message['content'] = this.state.message
    }
    return message
  }

  handleTogglePicker = () => {
    this.setState({ emojiPicker: !this.state.emojiPicker })
  }

  handleAddEmoji = (emoji) => {
    const oldMessage = this.state.message
    const newMessage = this.colonToUnicode(` ${oldMessage} ${emoji.colons}`)
    this.setState({ message: newMessage, emojiPicker: false })
    setTimeout(() => this.messageInputRef.focus(), 0)
  }

  colonToUnicode = (message) => {
    return message.replace(/:[A-Za-z0-9_+-]+:/g, (x) => {
      x = x.replace(/:/g, '')
      let emoji = emojiIndex.emojis[x]
      if (typeof emoji !== 'undefined') {
        let unicode = emoji.native
        if (typeof unicode !== 'undefined') {
          return unicode
        }
      }
      x = ':' + x + ':'
      return x
    })
  }

  // Get value from Form and store to realtime database
  /* When channel is private (user chat with each other), this moment channel = PDvJJW2IcLatFhJYv1BsTIU2iH23/Sc4aFFQUHXTXXMWMwH5eJZHImLk2, and when user send message to other user with child(PDvJJW2IcLatFhJYv1BsTIU2iH23/Sc4aFFQUHXTXXMWMwH5eJZHImLk2), after database will store value according to structure:
    PDvJJW2IcLatFhJYv1BsTIU2iH23
      Sc4aFFQUHXTXXMWMwH5eJZHImLk2
        uid: message
  */
  sendMessage = () => {
    const { getMessagesRef } = this.props
    const { message, channel, typingRef, user } = this.state

    if (message) {
      this.setState({ loading: true })
      // console.log(channel.id)
      getMessagesRef()
        .child(channel.id)
        .push()
        .set(this.createMessage())
        .then(() => {
          this.setState({ loading: false, message: '', errors: [] })
          typingRef.child(channel.id).child(user.uid).remove() // after send messages, remove typing user
        })
        .catch((err) => {
          console.log(err)
          this.setState({
            loading: false,
            errors: this.state.errors.concat(err),
          })
        })
    } else {
      this.setState({
        errors: this.state.errors.concat({ message: 'Add a message' }),
      })
    }
  }

  getPath = () => {
    if (this.props.isPrivateChannel) {
      return `chat/private/${this.state.channel.id}`
    } else {
      return 'chat/public'
    }
  }

  uploadFile = (file, metadata) => {
    const pathToUpload = this.state.channel.id
    const ref = this.props.getMessagesRef()
    const filePath = `${this.getPath()}/${uuidv4()}.jpg` // position store img on firebase storage

    this.setState(
      {
        uploadState: 'uploading',
        uploadTask: this.state.storageRef.child(filePath).put(file, metadata),
      }, // store image to firebase storage
      () => {
        this.state.uploadTask.on(
          'state_changed',
          (snap) => {
            const percentUploaded = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100,
            )
            // this.props.isProgressBarVisible(percentUploaded)
            this.setState({ percentUploaded })
          }, // show progress bar when user upload
          (err) => {
            console.log(err)
            this.setState({
              errors: this.state.errors.concat(err),
              uploadState: 'error',
              uploadTask: null,
            })
          },
          () => {
            this.state.uploadTask.snapshot.ref
              .getDownloadURL()
              .then((dowloadUrl) => {
                this.sendFileMessage(dowloadUrl, ref, pathToUpload)
              })
              .catch((err) => {
                console.log(err)
                this.setState({
                  errors: this.state.errors.concat(err),
                  uploadState: 'error',
                  uploadTask: null,
                })
              })
          }, // get dowloadURL image from firebase storage, send file message, render into UI
        )
      },
    )
  }

  sendFileMessage = (fileUrl, ref, pathToUpload) => {
    ref
      .child(pathToUpload)
      .push()
      .set(this.createMessage(fileUrl))
      .then(() => {
        this.setState({ uploadState: 'done' })
      })
      .catch((err) => {
        console.log(err)
        this.setState({ errors: this.state.errors.concat(err) })
      })
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.sendMessage()
    }
  }

  render() {
    const {
      errors,
      message,
      loading,
      modal,
      uploadState,
      percentUploaded,
      emojiPicker,
    } = this.state

    return (
      <Segment className="message__form">
        {emojiPicker && (
          <Picker
            set="facebook"
            className="emojipicker"
            onSelect={this.handleAddEmoji}
            title="Pick your emoji"
            emoji="point_up"
          />
        )}
        <Input
          fluid
          name="message"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          style={{ marginBottom: '0.7em' }}
          label={
            <Button
              icon={emojiPicker ? 'close' : 'add'}
              content={emojiPicker ? 'Close' : null}
              onClick={this.handleTogglePicker}
            />
          }
          ref={(node) => {
            return (this.messageInputRef = node)
          }}
          value={message}
          labelPosition="left"
          placeholder="Write your message"
          className={
            errors.some((error) => error.message.includes('message'))
              ? 'error'
              : ''
          }
        />
        <Button.Group>
          <Button
            onClick={this.sendMessage}
            color="orange"
            disabled={loading}
            content="Add Reply"
            labelPosition="left"
            icon="edit"
          />
          <Button
            color="teal"
            disabled={uploadState === 'uploading'}
            onClick={this.openModal}
            content="Upload Media"
            labelPosition="right"
            icon="cloud upload"
          />
        </Button.Group>

        <FileModal
          modal={modal}
          closeModal={this.closeModal}
          uploadFile={this.uploadFile}
        />
        <ProgressBar
          uploadState={uploadState}
          percentUploaded={percentUploaded}
        />
      </Segment>
    )
  }
}
