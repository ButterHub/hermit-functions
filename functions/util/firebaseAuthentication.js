const {admin, db} = require('../util/admin');

exports.firebaseAuthentication = (req, res, next) => {
    const token = getAuthTokenFromHeader(req.headers.authorization)
    admin.auth().verifyIdToken(token)
    .then(decodedIdToken => {
      return db.collection('users').where('authUID', '==', decodedIdToken.user_id).limit(1).get()
    })
    .then(userQuerySnapshot => {
      if (userQuerySnapshot.empty) {
        throw new Error("User does not exist.")
      }
      const userDoc = userQuerySnapshot.docs[0]
      req.user = {
        username: userDoc.id,
        name: userDoc.data().name,
        pictureUrl: userDoc.data().pictureUrl
      }
    })
    .then(() => next())
    .catch(error => {
      console.error(error)
      return res.status(error.code || 500).json({message: error.message})
    })

}

function getAuthTokenFromHeader(authorizationHeader) {
  if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
      return authorizationHeader.split(' ')[1]
  } else {
    const error = new Error("Authorization header (Bearer token) not provided. e.g. 'Authorization: Bearer 1231248y123hrinewjbfoqiu23gr52grfqbaefb'")
    error.code = 400
    throw error
  }
}