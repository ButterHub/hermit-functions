const { db, admin } = require('../util/admin')
const { RegisteredEmailError, RegisteredUsernameError } = require('../errors')
const { firebase } = require('../util/config')
const { getDefaultProfilePicture } = require('../util/unsplash')

const isValidEmail = (email) => {
  const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return emailPattern.test(email)
}

exports.registerUser = async (req, res) => {
  let user
  const errors = []
  const { username, email, name, password, passwordConfirm } = req.body
  if (!isValidEmail(email)) {
    errors.push('Email is not valid.')
  }
  if (password !== passwordConfirm) {
    errors.push('Passwords do not match.')
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
        const error = new RegisteredEmailError('This email address is already in use.')
        error.code = 'auth/email-already-in-use'
        return Promise.reject(error)
      } else {
        return db.collection('users').doc(username).get()
      }
    })
    .then(userDoc => {
      if (userDoc.exists) {
        const error = new RegisteredUsernameError('This username is already in use.')
        error.code = 409
        return Promise.reject(error)
      } else {
        return firebase.auth().createUserWithEmailAndPassword(email, password)
      }
    })
    .then(async userCredential => {
      const authUID = userCredential.user.uid
      const [token, defaultPictureUrl] = await Promise.all([userCredential.user.getIdToken(), getDefaultProfilePicture()])
      user = {
        token,
        email,
        name,
        authUID,
        pictureUrl: defaultPictureUrl
      }
      return db.collection('users').doc(username).set(user)
    })
    .then(() => {
      return res.status(201).json(user)
    })
    .catch(async error => {
      console.error(error)
      return res.status(error.code).json({ message: error.message })
    })
}

exports.loginUser = async (req, res) => {
  const userCollection = db.collection('users')
  const { email, password } = req.body
  try {
    const userCredentials = await firebase.auth().signInWithEmailAndPassword(email, password)
    const token = await userCredentials.user.getIdToken()
    await userCollection.where('email', '==', email).limit(1).get()
      .then(querySnapshot => {
        return querySnapshot.docs[0].id
      })
      .then(username => userCollection.doc(username).update({ token }))

    return await res.json({ token })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Please check your email and password.' })
  }
}

exports.getCurrentUser = (req, res) => {
  Promise.all([
    db.collection('users').where('username', '==', req.user.username).limit(1).get()
      .then(querySnapshot => {
        return querySnapshot.docs[0].data()
      }),
    db.collection('votes').where('author.username', '==', req.user.username).orderBy('createTime', 'desc').limit(10).get()
      .then(querySnapshot => {
        const authoredUpvotes = []
        querySnapshot.forEach(doc => {
          authoredUpvotes.push(doc.data())
        })
        return authoredUpvotes
      }),
    db.collection('comments').where('author.username', '==', req.user.username).orderBy('createTime', 'desc').limit(10).get()
      .then(querySnapshot => {
        const commentsGiven = []
        querySnapshot.forEach(doc => {
          commentsGiven.push(doc.data())
        })
        return commentsGiven
      }),
    db.collection('decisions').where('author.username', '==', req.user.username).limit(10).get()
      .then(querySnapshot => {
        const decisions = []
        querySnapshot.forEach(doc => {
          decisions.push(doc.data())
        })
        return decisions
      }),
    db.collection('notifications').where('recipientUsername', '==', req.user.username).orderBy('createTime').limit(10).get()
      .then(querySnapshot => {
        const notifications = []
        querySnapshot.forEach(doc => {
          const notification = doc.data()
          notification.notificationId = doc.id
          notifications.push(notification)
        })
        return notifications
      }),
    db.collection('decisions').where('watchers', 'array-contains', req.user.username).get()
      .then(querySnapshot => {
        const watchedDecisions = []
        querySnapshot.forEach(doc => {
          watchedDecisions.push(doc.data())
        })
        return watchedDecisions
      })
  ])
    .then(([userCredentials, authoredUpvotes, authoredComments, authoredDecisions, notifications, watchedDecisions]) => {
      return res.json({ ...userCredentials, authoredUpvotes, authoredComments, authoredDecisions, notifications, watchedDecisions })
    })
    .catch(error => {
      console.log(error)
      return res.status(500).json({ message: error.code })
    })
}

exports.getUser = async (req, res) => {
  try {
    // TODO extract common promise.all code
    const [userWithPrivateDetails, visibleAuthoredUpvotes, visibleAuthoredComments, visibleAuthoredDecisions] = await Promise.all([
      db.collection('users').doc(req.params.username).get()
        .then(userDoc => {
          if (!userDoc.exists) {
            const error = new Error('User does not exist.')
            error.code = 400
            throw error
          }
          return userDoc.data()
        }),
      db.collection('votes').where('author.username', '==', req.params.username).orderBy('createTime', 'desc').get()
        .then(querySnapshot => {
          const authoredUpvotes = []
          querySnapshot.forEach(doc => {
            authoredUpvotes.push(doc.data())
          })
          return authoredUpvotes
        }),
      db.collection('comments').where('author.username', '==', req.params.username).orderBy('createTime', 'desc').get()
        .then(querySnapshot => {
          const comments = []
          querySnapshot.forEach(doc => {
            comments.push(doc.data())
          })
          return comments
        }),
      db.collection('decisions').where('author.username', '==', req.params.username).orderBy('createTime', 'desc').get()
        .then(querySnapshot => {
          const decisions = []
          querySnapshot.forEach(doc => {
            decisions.push(doc.data())
          })
          return decisions
        })
    ])
      .catch(error => {
        console.error(error)
        const publicError = new Error('Server is struggling with its database queries.')
        throw publicError
      })
    const { pictureUrl } = userWithPrivateDetails
    const user = { pictureUrl, visibleAuthoredUpvotes, visibleAuthoredComments, visibleAuthoredDecisions }
    return res.status(200).json(user)
  } catch (error) {
    console.error(error)
    res.status(error.code || 500).json({ message: error.message })
  }
}

exports.uploadProfilePicture = async (req, res) => {
  // Currently saving file locally, then uploading to cloud storage
  // See https://cloud.google.com/storage/docs/streaming to use streaming transfer, skipping temp files step
  // TODO to generify for banner photo too, send a 'target: profile or target: banner' body param.
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
    console.error(error)
    return res.status(error.code || 500).json({ message: error.message })
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
