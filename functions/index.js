const functions = require('firebase-functions');
const apiApp = require('express')()
const {firebaseAuthentication} = require('./util/firebaseAuthentication')

const {registerUser, loginUser, uploadProfilePicture } = require('./handlers/users')

apiApp.post('/users', registerUser)
apiApp.post('/user', firebaseAuthentication, addUserInformation)
apiApp.post('/users/profile', firebaseAuthentication, uploadProfilePicture)
apiApp.post('/login', loginUser)

const {getAllDecisions, createDecision} = require('./handlers/decisions')
apiApp.get('/decisions', getAllDecisions)
apiApp.post('/decisions', firebaseAuthentication, createDecision)

exports.api = functions.region('europe-west2').https.onRequest(apiApp)
