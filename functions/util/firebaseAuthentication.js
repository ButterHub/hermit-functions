const {admin, db} = require('../util/admin');

exports.firebaseAuthentication = async (req, res, next) => {
  try {
    const token = getAuthToken(req.headers.authorization)
    const decodedIdToken = await admin.auth().verifyIdToken(token).catch(error => {
      console.error(error)
      const publicError = new Error("Your token is not valid, try regenerating another by logging in.")
      publicError.code = 401
      throw publicError
    })
    const authUID = decodedIdToken.user_id
    const userQuerySnapshot = await db.collection('users').where('authUID', '==', authUID).limit(1).get()
    if (userQuerySnapshot.empty) {
      throw new Error("User does not exist.")
    }
    const userWithInternalData = userQuerySnapshot.docs[0].data()
    req.user = {
      username: userQuerySnapshot.docs[0].id,
      name: userWithInternalData.name,
      pictureUrl: userWithInternalData.pictureUrl
    }

    return next()
  } catch(error) {
    console.error(error)
    return res.status(error.code || 500).json({message: error.message})
  }
}

function getAuthToken(authorizationHeader) {
  if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
      return authorizationHeader.split(' ')[1]
  } else {
    const error = new Error("Authorization header (Bearer token) not provided. e.g. 'Authorization: Bearer 1231248y123hrinewjbfoqiu23gr52grfqbaefb'")
    error.code = 400
    throw error
  }
}