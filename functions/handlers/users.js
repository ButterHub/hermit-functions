const {db, admin} = require('../util/admin')
const {FieldValue} = require('firebase-admin').firestore
const RegisteredEmailError = require('../errors/RegisteredEmailError')
const {firebase, firebaseConfig} = require('../util/config')
const { getDefaultProfilePicture } = require('../util/unsplash')


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
    const userId = userCredential.user.uid
    const [token, defaultPictureUrl] = await Promise.all([userCredential.user.getIdToken(), getDefaultProfilePicture()])
    user = {
      token,
      name,
      email,
      createTime: FieldValue.serverTimestamp(),
      pictureUrl: defaultPictureUrl
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

exports.uploadProfilePicture = async (req, res) => {
    // Currently saving file locally, then uploading to cloud storage
    // See https://cloud.google.com/storage/docs/streaming to use streaming transfer, skipping temp files step
  const path = require('path')
  const os = require('os')
  const fs = require('fs')
  const BusBoy = require('busboy')
  const busboy = new BusBoy({headers: req.headers})
  let localFileName
  let localFilePath
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image.png") {
      return res.status(400).json({message: "Only .png and .jpg supported"})
    }
    localFileName = `${Math.round(Math.random()*1000000000)}-${filename}`
    localFilePath = path.join(os.tmpdir(), localFileName)
    file.pipe(fs.createWriteStream(localFilePath))
    console.log(`File ${fieldname} filename: ${filename} encoding: ${encoding} mimetype: ${mimetype} localFilePath: ${localFilePath}`)
  })

  busboy.on('finish', async () => {
    // Improvements: The problem with the current implementation is its creating the URL manually, from an expected template/ example URL, see the template literal. If the URL's are changed in the future, then this function has to be updated. It is preferrable to get the URL through the SDK instead. 
    const destinationFilePath = `images/profiles/${localFileName}`
    const destinationFilePathPercentEncoded = `images%2Fprofiles%2F${localFileName}`
    const gcsOptions = {
      destination: destinationFilePath,
    }
    await admin.storage().bucket().upload(localFilePath, gcsOptions)
    // const pictureUrl = `https://firebasestorage.googleapis.com/v0/b/${
    //   firebaseConfig.storageBucket
    // }/o/${destinationFilePath}?alt=media`; // using %2F instead of / to workaround Firebase's glitch with directories
    const pictureUrlPercentEncoded = `https://firebasestorage.googleapis.com/v0/b/${
      firebaseConfig.storageBucket
    }/o/${destinationFilePathPercentEncoded}?alt=media`;
    await db.doc(`/users/${req.user.user_id}`).update({ pictureUrlPercentEncoded })
    return res.json({pictureUrlPercentEncoded})
  })
  busboy.end(req.rawBody) // Ending busboy WritableStream with final (& only) input, 
} 

// TODO create seperate function listening to cloudStorage/images/profiles/*: create different sizes (thumbnail, small, full)