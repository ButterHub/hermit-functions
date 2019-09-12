const functions = require('firebase-functions')
const apiApp = require('express')()
const { firebaseAuthentication } = require('./util/firebaseAuthentication')

const { getCurrentUser, registerUser, loginUser, uploadProfilePicture, addUserInformation } = require('./handlers/users')
apiApp.post('/users', registerUser)
apiApp.post('/user', firebaseAuthentication, addUserInformation)
apiApp.post('/users/profile', firebaseAuthentication, uploadProfilePicture)
apiApp.post('/login', loginUser)
apiApp.get('/user', firebaseAuthentication, getCurrentUser)

const { getAllDecisions, createDecision, getDecision, deleteDecision } = require('./handlers/decisions')
apiApp.get('/decisions/:decisionId', getDecision)
apiApp.get('/decisions', getAllDecisions)
apiApp.post('/decisions', firebaseAuthentication, createDecision)
apiApp.delete('/decisions/:decisionId', firebaseAuthentication, deleteDecision)

const { createComment, deleteComment } = require('./handlers/comments')
apiApp.post('/comments/:objectId', firebaseAuthentication, createComment)
apiApp.delete('/comments/:commentId', firebaseAuthentication, deleteComment)

const { upVote, deleteVote, downVote } = require('./handlers/votes')
apiApp.put('/votes/:objectId/up', firebaseAuthentication, upVote)
apiApp.put('votes/:objectId/down', firebaseAuthentication, downVote)
apiApp.delete('/votes/:objectId', firebaseAuthentication, deleteVote)

exports.api = functions.region('europe-west2').https.onRequest(apiApp)
