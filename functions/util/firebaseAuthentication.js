const { admin, db } = require('../util/admin')

exports.firebaseAuthentication = async (req, res, next) => {
  try {
    const token = getAuthTokenFromHeader(req.headers.authorization)
    const decodedIdToken = await admin.auth().verifyIdToken(token).catch(error => {
      console.error(error)
      throw new Error('Token invalid, please log in again or provide a valid token.')
    })
    const userQuerySnapshot = await db.collection('users').where('authUID', '==', decodedIdToken.user_id).limit(1).get()
    if (userQuerySnapshot.empty) {
      throw new Error('User does not exist.')
    }
    const userDoc = userQuerySnapshot.docs[0]
    const user = {
      username: userDoc.id,
      name: userDoc.data().name,
      pictureUrl: userDoc.data().pictureUrl
    }
    // False positive eslint rule broken below: require-atomic-updates https://github.com/eslint/eslint/issues/11899
    req.user = user
    console.log(req.user.username)
    return next()
  } catch (error) {
    console.error(error)
    return res.status(error.code || 500).json({ message: error.message })
  }
}

function getAuthTokenFromHeader (authorizationHeader) {
  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.split(' ')[1]
  } else {
    const error = new Error("Authorization header (Bearer token) not provided. e.g. 'Authorization: Bearer 1231248y123hrinewjbfoqiu23gr52grfqbaefb'")
    error.code = 400
    throw error
  }
}
