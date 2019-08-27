const functions = require('firebase-functions');
const admin = require('firebase-admin')
const firebase = require('firebase')
const app = require('express')()
const {FieldValue} = require('firebase-admin').firestore
require('dotenv').config()

const {apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId} = process.env
const firebaseConfig = {
  apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId
};
admin.initializeApp()
firebase.initializeApp(firebaseConfig)
const db = admin.firestore()

app.post('/users', (req,res) => {
  let user;
  const {email, name, password, password2 } = req.body
  // TODO validate new, password, email
  db.collection('users').doc(email).get()
  .then(doc => {
    if (doc.exists) {
      return Promise.reject(new RegisteredEmailError("Email is already registered."))
    } else {
      return firebase.auth().createUserWithEmailAndPassword(email, password)
    }
  }).then(async userCredential => {
    const token = await userCredential.user.getIdToken()
    const userId = userCredential.user.uid
    user = {
      userId,
      token,
      name,
      email,
      createTime: FieldValue.serverTimestamp()
    }
    return db.collection('users').doc(email).set(user)
  })
  .then(() => res.status(201).json(user))
  .catch(error => {
    console.log(error)
    if (error instanceof RegisteredEmailError) {
      console.log("This is a custom error. yay")
      return res.status(400).json({message: error.message})
    }
    return res.status(500).json({message: "Unable to register user."})
  })
})

app.get('/decisions', (req, res) => {
  db.collection('decisions')
  .orderBy('createTime', 'desc')
  .get()
  .then(data => {
    let decisions = []
    data.forEach(doc => {
      decisions.push({
        decisionId: doc.id,
        ...doc.data()
      })
    })
    return res.json(decisions)
  })
  .catch((err) => console.log(err))
})

app.post('/decisions', (req, res) => {
  const {title, context, user} = req.body
  const decision = {
    context, user, title,
    createTime: new Date().toISOString()
  }
  db.collection('decisions').add(decision).then(doc => {
    return res.json(user)
  }).catch(err => {
    return res.status(500).json({message: "Unable to create user."}, err)
  })
})

exports.api = functions.region('asia-east2').https.onRequest(app)

class RegisteredEmailError extends Error {}