// Enables access to firebase services from this privileged nodeJS/ serverless environment, for read/write with databases, token generation/ verification, firebase cloud messaging.
const admin = require('firebase-admin')
admin.initializeApp()
const db = admin.firestore()

module.exports = {
  admin,
  db
}
