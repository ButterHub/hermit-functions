const functions = require('firebase-functions')
const apiApp = require('express')()
const { firebaseAuthentication } = require('./util/firebaseAuthentication')

//USERS
const { getUser, getCurrentUser, registerUser, loginUser, uploadProfilePicture, addUserInformation } = require('./handlers/users')
apiApp.post('/users', registerUser)
apiApp.post('/user', firebaseAuthentication, addUserInformation)
apiApp.post('/users/profile', firebaseAuthentication, uploadProfilePicture)
apiApp.post('/login', loginUser)
apiApp.get('/user', firebaseAuthentication, getCurrentUser)
apiApp.get('/users/:userId', getUser)

const {markNotificationAsRead} = require('./handlers/notifications')
apiApp.put('/notifications/:notificationId', firebaseAuthentication, markNotificationAsRead)

// DECISIONS
const { getAllDecisions, createDecision, getDecision, deleteDecision } = require('./handlers/decisions')
apiApp.get('/decisions/:decisionId', getDecision)
apiApp.get('/decisions', getAllDecisions)
apiApp.post('/decisions', firebaseAuthentication, createDecision)
apiApp.delete('/decisions/:decisionId', firebaseAuthentication, deleteDecision)

// DECISION COMPONENTS
const {createDecisionComponent, editDecisionComponent} = require('./handlers/decisionComponents')
apiApp.post('/decisions/:decisionId', firebaseAuthentication, createDecisionComponent)
apiApp.put('/decisionComponents/:decisionComponentId', firebaseAuthentication, editDecisionComponent)

// COMMENTS
const { createComment, deleteComment } = require('./handlers/comments')
apiApp.post('/comments/:decisionComponentId', firebaseAuthentication, createComment)
apiApp.delete('/comments/:commentId', firebaseAuthentication, deleteComment)

// VOTES
const { upvoteDecision, deleteVoteOnDecision, downVoteDecision, upvoteDecisionComponent, deleteVoteOnDecisionComponent, downVoteDecisionComponent } = require('./handlers/votes')
apiApp.put('/decisionVotes/:decisionId/up', firebaseAuthentication, upvoteDecision)
apiApp.put('/decisionVotes/:decisionId/down', firebaseAuthentication, downVoteDecision)
apiApp.delete('/decisionVotes/:decisionId', firebaseAuthentication, deleteVoteOnDecision)
apiApp.put('/decisionComponentVotes/:decisionId/up', firebaseAuthentication, upvoteDecisionComponent)
apiApp.put('/decisionComponentVotes/:decisionId/down', firebaseAuthentication, downVoteDecisionComponent)
apiApp.delete('/decisionComponentVotes/:decisionId', firebaseAuthentication, deleteVoteOnDecisionComponent)

// REST APIS
exports.api = functions.region('europe-west2').https.onRequest(apiApp)

// TRIGGERS
const { createNotificationOnDecisionUpvote, deleteNotificationOnDeleteDecisionUpvote, createNotificationOnDecisionComponentComment, deleteNotificationOnDeleteDecisionComponentComment, sendFirebaseMessagesOnNewNotification } = require('./handlers/notifications')

exports.createNotificationOnUpvote = functions.region('europe-west2').firestore.document('decisionVotes/{id}')
.onCreate(createNotificationOnDecisionUpvote)

exports.deleteNotificationOnDeleteDecisionUpvote = functions.region('europe-west2').firestore.document('decisionVotes/{id}').onDelete(deleteNotificationOnDeleteDecisionUpvote)

exports.createNotificationOnDecisionComponentComment = functions.region('europe-west2').firestore.document('comments/{id}').onCreate(createNotificationOnDecisionComponentComment)

exports.deleteNotificationOnDeleteDecisionComponentComment = functions.region('europe-west2').firestore.document('comments/{id}').onDelete(deleteNotificationOnDeleteDecisionComponentComment)

exports.sendFirebaseMessagesOnNewNotification = functions.region('europe-west2').firestore.document('notifications/{id}').onCreate(sendFirebaseMessagesOnNewNotification)