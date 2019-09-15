const { db, admin } = require('../util/admin')
const { RegisteredEmailError, sendErrorResponse } = require('../errors')
const { firebase } = require('../util/config')
const { getDefaultProfilePicture } = require('../util/unsplash')
const {documentShouldExist, documentShouldNotExist} = require('../util/validators')

const isPasswordTooWeak = password => {
  // TODO implement regex check
  console.log(`${password}, breaking GDPR by logging passwords?!`)
  return true;
}

exports.registerUser = async (req, res) => {
  try {
    const { username, email, name, password } = req.body
    if (isPasswordTooWeak(password)) {
      const error = new Error("Password is too weak.")
      error.code = 400
      throw error
    }
    const usersQuerySnapshot = await db.collection('users').where('email', '==', email).get()
    if (!usersQuerySnapshot.empty) {
      const error = new RegisteredEmailError('This email address is already in use.')
      error.code = 409
      throw error
    }
    const userDoc = await db.collection('users').doc(username).get()
    documentShouldNotExist(userDoc, 409, 'This username is already in use.')
    const userCredentials = await firebase.auth().createUserWithEmailAndPassword(email, password)
    const [token, dynamicDefaultPictureUrl] = await Promise.all([userCredentials.user.getIdToken(), getDefaultProfilePicture()])
    const user = {
      token,
      email,
      name,
      authUID:  userCredentials.user.uid,
      pictureUrl: dynamicDefaultPictureUrl
    }
    await db.collection('users').doc(username).set(user)
    return res.status(201).json(user)
  }
    catch(error) {
      return sendErrorResponse(error, res)
    }
}

// TODO generate email login, with template
// exports.sendLoginLinkEmail = (req, res) => {

// }

exports.loginUser = async (req, res) => {
  const userCollection = db.collection('users')
  const { email, password } = req.body
  try {
    const userCredentials = await firebase.auth().signInWithEmailAndPassword(email, password)
    const token = await userCredentials.user.getIdToken()
    const querySnapshot = await userCollection.where('email', '==', email).limit(1).get()
    const username = querySnapshot.docs[0].id
    await userCollection.doc(username).update({ token })
    return await res.json({ token })
  } catch (error) {
    error.message = 'Please check your email and password.'
    error.code = 401
    return sendErrorResponse(error, res)
  }
}

exports.getCurrentUser = async (req, res) => {
  const { username } = req.user
  try {
    const [userDetails, authoredUpvotes, authoredComments, authoredDecisions, notifications, watchedDecisions] = await Promise.all([
        getPublicUserDetails(username),
        getPublicUserDecisionVotes(username),
        getPublicUserComments(username),
        getPublicUserDecisions(username),
        getNotificationsForUser(username),
        getDecisionsUserIsWatching(username)
    ])
    return res.status(200).json({ ...userDetails, authoredUpvotes, authoredComments, authoredDecisions, notifications, watchedDecisions })
  } catch(error) {
    return sendErrorResponse(error, res)
  }
}

// can the following be turned to async?
const getPublicUserDetails = username => {
  return db.collection('users')
  .doc(username)
  .get()
  .then(userDoc => {
    documentShouldExist(userDoc, 400, 'User does not exist.')
    const {pictureUrl, name} = userDoc.data()
    return { pictureUrl, name  } // TODO Switch to ts, create userModel type.
  })
}

const getPublicUserDecisionVotes = username => {
  return db.collection('decisionVotes')
  .where('author.username', '==', username)
  .orderBy('createTime', 'desc')
  .get()
  .then(querySnapshot => {
    const authoredUpvotes = []
    querySnapshot.forEach(doc => {
      const vote = doc.data()
      vote.id = doc.id
      authoredUpvotes.push(vote)
    })
    return authoredUpvotes
  })
}

// TODO accept optional argument for current user id. Return restricted data if allowed. 
const getPublicUserComments = username => {
  return db.collection('comments')
  .where('author.username', '==', username)
  .orderBy('createTime', 'desc')
  .get()
  .then(querySnapshot => {
    const comments = []
    querySnapshot.forEach(doc => {
      const comment = doc.data()
      comment.id = doc.id
      comments.push(comment)
    })
    return comments
  })
}

const getPublicUserDecisions = username => {
  return db.collection('decisions')
  .where('author.username', '==', username)
  .orderBy('createTime', 'desc')
  .limit(10)
  .get()
  .then(querySnapshot => {
    const decisions = []
    querySnapshot.forEach(doc => {
      const decision = doc.data()
      decision.id = doc.id
      decisions.push(decision)
    })
    return decisions
  })
}

const getVisibleAuthoredDecisionUpvotes = username => {
  return db.collection('decisionVotes').where('author.username', '==', username).orderBy('createTime', 'desc').limit(10).get()
  .then(querySnapshot => {
    const authoredUpvotes = []
    querySnapshot.forEach(doc => {
      const vote = doc.data()
      vote.id = doc.id
      authoredUpvotes.push(vote)
    })
    return authoredUpvotes
  })
}

const getNotificationsForUser = username => {
  return db.collection('notifications').where('recipientUsername', '==', username).orderBy('createTime').limit(10).get()
  .then(querySnapshot => {
    const notifications = []
    querySnapshot.forEach(doc => {
      const notification = doc.data()
      notification.notificationId = doc.id
      notifications.push(notification)
    })
    return notifications
  })
}

const getDecisionsUserIsWatching = username => {
  return db.collection('decisions').where('watchers', 'array-contains', username).get()
  .then(querySnapshot => {
    const watchedDecisions = []
    querySnapshot.forEach(doc => {
      const decision = doc.data()
      decision.id = doc.id
      watchedDecisions.push(decision)
    })
    return watchedDecisions
  })
}

exports.getUser = async (req, res) => {
  const { username } = req.params
  try {
    const [
      publicUserDetails,
      visibleAuthoredDecisionUpvotes,
      visibleAuthoredComments,
      visibleAuthoredDecisions
    ] = await Promise.all([
      getPublicUserDetails(username),
      getVisibleAuthoredDecisionUpvotes(username),
      getPublicUserComments(username),
      getPublicUserDecisions(username)
    ])
    const user = { ...publicUserDetails, visibleAuthoredDecisionUpvotes, visibleAuthoredComments, visibleAuthoredDecisions }
    return res.status(200).json(user)
  } catch (error) {
    return sendErrorResponse(error, res)
  }
}

exports.uploadProfilePicture = async (req, res) => {
  // Currently saving file locally, then uploading to cloud storage
  // See https://cloud.google.com/storage/docs/streaming to use streaming transfer, skipping temp files step
  // TODO to generify code for banner photo too, send a 'target: profile or target: banner' path param.
  // Is path param the right option for this?
  const path = require('path')
  const os = require('os')
  const fs = require('fs')
  const BusBoy = require('busboy')
  const busboy = new BusBoy({ headers: req.headers })
  let localFileName
  let localFilePath
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== 'image/jpeg' && mimetype !== 'image.png') {
      return res.status(400).json({ message: 'Only .png and .jpg supported' })
    }
    const format = filename.split('.')[filename.split('.').length - 1]
    localFileName = req.user.username + '.' + format
    localFilePath = path.join(os.tmpdir(), localFileName)
    file.pipe(fs.createWriteStream(localFilePath))
  })

  busboy.on('finish', async () => {
    const destinationFilePath = `images/profiles/${localFileName}`
    const gcsOptions = {
      destination: destinationFilePath
    }
    const uploadResponse = await admin.storage().bucket().upload(localFilePath, gcsOptions)
    const pictureUrl = uploadResponse[1].mediaLink // [0] is 'file' [1] is 'full API response.. Ugh. https://googleapis.dev/nodejs/storage/latest/global.html#UploadResponse
    await db.collection('users').doc(req.user.username).update({ pictureUrl })
    return res.json({ pictureUrl })
  })
  // Ending (and more importantly, starting) busboy WritableStream with final (& only) input,
  busboy.end(req.rawBody)
}

// TODO create separate function trigger: cloudStorage/images/profiles/*: create different sizes (thumbnail, small, full)

exports.addUserInformation = async (req, res) => {
  const SUPPORTED_EXTERNAL_PROFILES = ['linkedin', 'facebook']

  const { externalProfiles, bannerPicture, headline, location, about } = req.body
  const information = {}
  try {
    const parseExternalProfiles = externalProfiles => {
      const parsedExternalProfiles = {}
      if (externalProfiles) {
        Object.keys(externalProfiles).forEach(key => {
          if (SUPPORTED_EXTERNAL_PROFILES.includes(key)) {
            parsedExternalProfiles[key] = externalProfiles[key]
          }
        })
      }
      return parsedExternalProfiles
    }
    // TODO validate below
    information.externalProfiles = parseExternalProfiles(externalProfiles)
    if (bannerPicture && bannerPicture.trim() !== '') {
      information.bannerPicture = bannerPicture.trim()
    }
    if (headline && headline.trim() !== '') {
      information.headline = headline.trim()
    }
    if (location && location.trim() !== '') {
      information.location = location.trim()
    }
    if (about && about.trim() !== '') {
      information.about = about.trim()
    }
    if (Object.keys(information).length > 0) {
      await db.collection('users').doc(req.user.username).update(information)
      return await res.status(200).end()
    } else {
      return await res.status(400).end()
    }
  } catch (error) {
    return sendErrorResponse(error, res)
  }
}

exports.userDetailsChange = change => {
  if (change.before.data().pictureUrl !== change.after.data().pictureUrl) {
    const batch = db.batch()
    return Promise.all([
      db.collection('decisions').where('author.username', '==', change.before.id).get()
        .then(authoredDecisionsSnapshot => {
          authoredDecisionsSnapshot.forEach(doc => {
            batch.update(db.collection('decisions').doc(doc.id), { 'author.pictureUrl': change.after.data().pictureUrl })
          })
        }),
      db.collection('comments').where('author.username', '==', change.before.id).get()
        .then(authoredDecisionsSnapshot => {
          authoredDecisionsSnapshot.forEach(doc => {
            batch.update(db.collection('comments').doc(doc.id), { 'author.pictureUrl': change.after.data().pictureUrl })
          })
        })
    ]).then(() => batch.commit())
  } else {
    return 'pictureUrl was not changed.'
  }
}
