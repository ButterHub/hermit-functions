require('dotenv').config()
const firebase = require('firebase')

const { apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId } = process.env
const firebaseConfig = {
  apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId
}

firebase.initializeApp(firebaseConfig)

module.exports = { firebase, firebaseConfig }
