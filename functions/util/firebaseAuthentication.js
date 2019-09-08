const {admin, db} = require('../util/admin');

exports.firebaseAuthentication = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(' ')[1]
  } else {
    console.error("No token found.")
    return res.status(401).json({message: "Authorization header (Bearer token) e.g. 'bearer x2w4dvw34' not provided."})
  }
  return admin.auth().verifyIdToken(token)
  .then(decodedIdToken => {
    const {user_id, name} = decodedIdToken
    req.user = {
      user_id, name
    }
    return db.collection('users').doc(decodedIdToken.uid).get()
  })
  .then(doc => {
    if (!doc.exists) {
      throw new Error("User does not exist.")
    }
    req.user.name = doc.data().name
    return next()
  })
  .catch(error => {
    console.error(error)
    res.status(500).json({message: "Token verification failed."})
  })
}