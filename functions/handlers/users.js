const {db} = require('../util/admin')
const {FieldValue} = require('firebase-admin').firestore
const RegisteredEmailError = require('../errors/RegisteredEmailError')
const {firebase} = require('../util/config')
const { getDefaultProfilePhoto} = require('../util/unsplash')


const isValidEmail = (email) => {
  const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailPattern.test(email)
} 

exports.registerUser = async (req, res) => {
  let user;
  let errors = []
  const {email, name, password, passwordConfirm } = req.body
  if (!isValidEmail(email)) {
    errors.push("Email is not valid.")
  }
  if (password !== passwordConfirm) {
    errors.push("Passwords do not match.")
  } 
  // if (passwordIsSecure(password)) {
  //   errors.push("Password is not secure enough.")
  // }
  if (errors.length > 0) {
    return res.status(400).json(errors)
  }
  return db.collection('users').where('email', '==', email).get()
  .then(snapshot => {
    if (!snapshot.empty) {
      return Promise.reject(new RegisteredEmailError(`The email ${email} is already used.`))
    } else {
      return firebase.auth().createUserWithEmailAndPassword(email, password)
    }
  }).then(async userCredential => {
    const token = await userCredential.user.getIdToken()
  const defaultProfileUri = await getDefaultProfilePhoto()
    const userId = userCredential.user.uid
    user = {
      token,
      name,
      email,
      createTime: FieldValue.serverTimestamp(),
      profileUri: defaultProfileUri
    }
    return db.collection('users').doc(userId).set(user) // todo break this line, and check auth is reverted.
  })
  .then(() => res.status(201).json(user))
  .catch(error => {
    console.log(error)
    if (error instanceof RegisteredEmailError) {
      console.log(error)
      return res.status(400).json({message: error.message})
    }
    return res.status(500).json({message: "Unable to register user."})
  })
}

exports.loginUser = (req, res) => {
  const {password, email} = req.body
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then(userCredential => {
    return userCredential.user.getIdToken()
  })
  .then(token => {
    return res.json({token})
  })
  .catch(err => {
    console.log(err)
    return res.status(500).json({message: "Please check your email and password."})
  })
}