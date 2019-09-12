const functions = require('firebase-functions');
const apiApp = require('express')()
const {firebaseAuthentication} = require('./util/firebaseAuthentication')

const {getCurrentUser, registerUser, loginUser, uploadProfilePicture, addUserInformation } = require('./handlers/users')
apiApp.post('/users', registerUser)
apiApp.post('/user', firebaseAuthentication, addUserInformation)
apiApp.post('/users/profile', firebaseAuthentication, uploadProfilePicture)
apiApp.post('/login', loginUser)
apiApp.get('/user', firebaseAuthentication, getCurrentUser)

const {getAllDecisions, createDecision, getDecision, createComment} = require('./handlers/decisions')
apiApp.get('/decisions', getAllDecisions)
apiApp.post('/decisions', firebaseAuthentication, createDecision)
apiApp.get('/decisions/:decisionId', getDecision)
// TODO below route need author permissions.
// apiApp.delete('decisions/:decisionId', deleteDecision)
// apiApp.post('/decisions/:decisionId/upvote', upvoteDecision)

apiApp.post('/comments/:objectId', firebaseAuthentication, createComment)

exports.api = functions.region('europe-west2').https.onRequest(apiApp)
