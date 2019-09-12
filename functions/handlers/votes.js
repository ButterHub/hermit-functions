const { db } = require('../util/admin')

exports.upVote = (req, res) => {
  const decision = db.collection('decisions').doc(req.params.objectId)
  const vote = { objectId: req.params.objectId, userId: req.user.user_id }
  db.collection('votes')
    .where('objectId', '==', req.params.objectId)
    .where('userId', '==', req.user.user_id)
    .get()
    .then(querySnapshot => {
      if (!querySnapshot.empty) {
        const error = new Error('User has already upvoted object.')
        error.code = 400
        throw error
      }
      return null
    })
    .then(() => {
      return decision.get()
    })
    .then(doc => {
      if (doc.exists) {
        return decision.update({ upvotes: doc.data().upvotes + 1 })
      }
      return null
    })
    .then(() => {
      return db.collection('votes').add(vote)
    })
    .then(doc => {
      vote.voteId = doc.id
      return res.status(200).json(vote)
    })
    .catch(error => {
      console.log(error)
      res.status(error.code).json({ message: error.message })
    })
}

exports.deleteVote = (req, res) => {
  const decision = db.collection('decisions').doc(req.params.objectId)
  db.collection('votes')
    .where('objectId', '==', req.params.objectId)
    .where('userId', '==', req.user.user_id)
    .get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        const error = new Error('User has not voted on object.')
        error.code = 400
        throw error
      }
      querySnapshot.forEach(doc => {
        return db.collection('votes').doc(doc.id).delete()
      })
      return decision.get()
    })
    .then(doc => {
      if (doc.exists) {
        return decision.update({ upvotes: doc.data().upvotes - 1 })
      }
      return null
    })
    .then(() => {
      return res.status(200).end()
    })
    .catch(error => {
      console.log(error)
      res.status(500).end()
    })
}

// TODO create a function that listens on the votes collection

// TODO Implement downvote
exports.downVote = (req, res) => {
  res.status(501)
}
