const functions = require('firebase-functions');
const app = require('express')()
const {firebaseAuthentication} = require('./util/firebaseAuthentication')

// app.get('/test', test)

const {registerUser, loginUser } = require('./handlers/users')
app.post('/users', registerUser)
app.post('/login', loginUser)
// todo add auth middleware

const {getAllDecisions, createDecision} = require('./handlers/decisions')
app.get('/decisions', getAllDecisions)
app.post('/decisions', firebaseAuthentication, createDecision)

exports.api = functions.region('asia-east2').https.onRequest(app)