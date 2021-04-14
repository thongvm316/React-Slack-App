import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/storage'

var firebaseConfig = {
  apiKey: 'AIzaSyCbg8ojRtSZtRXOXmNtSSVWzQYcy6q5m1I',
  authDomain: 'slack-app-87d3a.firebaseapp.com',
  projectId: 'slack-app-87d3a',
  storageBucket: 'slack-app-87d3a.appspot.com',
  messagingSenderId: '954332962267',
  appId: '1:954332962267:web:8957d69a77b35c455a1bfe',
  measurementId: 'G-YZ0CLXLCQN',
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig)
// firebase.analytics()

export default firebase
