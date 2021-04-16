import React, { Component } from 'react'
import firebase from '../../firebase'
import {
  Grid,
  Form,
  Segment,
  Button,
  Header,
  Message,
  Icon,
} from 'semantic-ui-react'
import { Link } from 'react-router-dom'

class Login extends Component {
  state = {
    email: '',
    password: '',
    errors: [],
    loading: false,
  }

  /* ------- Hanlde Err */

  // add class to field that be err
  handleInputError = (errors, inputName) => {
    return errors.some((error) =>
      error.message.toLowerCase().includes(inputName),
    )
      ? 'error'
      : ''
  }

  displayErrors = (errors) =>
    errors.map((error, i) => <p key={i}>{error.message}</p>)
  /* ------- Hanlde Err */

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value })
  }

  handleSubmit = (event) => {
    event.preventDefault()

    if (this.isFormValid(this.state)) {
      this.setState({ errors: [], loading: true })
      firebase
        .auth()
        .signInWithEmailAndPassword(this.state.email, this.state.password)
        .then((signedInUser) => {
          console.log(signedInUser)
          this.setState({ loading: false })
        })
        .catch((error) => {
          console.log(error)
          this.setState({
            errors: this.state.errors.concat(error),
            loading: false,
          })
        })
    }
  }

  isFormValid = ({ email, password }) => email && password

  render() {
    const { email, password, loading, errors } = this.state

    return (
      <div>
        <Grid textAlign="center" verticalAlign="middle" className="app">
          <Grid.Column style={{ maxWidth: 450 }}>
            <Header as="h1" color="violet" textAlign="center">
              <Icon name="code branch" color="violet" />
              Login to DevChat
            </Header>
            <Form onSubmit={this.handleSubmit} size="large">
              <Segment stacked>
                <Form.Input
                  fluid
                  name="email"
                  icon="mail"
                  iconPosition="left"
                  placeholder="Email Address"
                  onChange={this.handleChange}
                  value={email}
                  className={this.handleInputError(errors, 'user')}
                  type="email"
                />

                <Form.Input
                  fluid
                  name="password"
                  icon="lock"
                  iconPosition="left"
                  placeholder="Password"
                  onChange={this.handleChange}
                  value={password}
                  className={this.handleInputError(errors, 'password')}
                  type="password"
                />

                <Button
                  className={loading ? 'loading' : ''}
                  disabled={loading}
                  color="violet"
                  fluid
                  size="large"
                >
                  Submit
                </Button>
              </Segment>
            </Form>
            {this.state.errors.length > 0 && (
              <Message error>
                <h3>Error</h3>
                {this.displayErrors(this.state.errors)}
              </Message>
            )}
            <Message>
              Don't have an account? <Link to="/register">Register</Link>
            </Message>
          </Grid.Column>
        </Grid>
      </div>
    )
  }
}

export default Login
