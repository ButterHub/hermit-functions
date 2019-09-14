const { db } = require('../util/admin')

exports.upvoteDecision = (req, res) => {
  const decision = db.collection('decisions').doc(req.params.decisionId)
  const vote = { 
    decisionId: req.params.decisionId,
    author: req.user,
    up: true,
    createTime: new Date().toISOString()
   }
  db.collection('decisionVotes')
    .where('decisionId', '==', req.params.decisionId)
    .where('author.username', '==', req.user.username)
    .get()
    .then(querySnapshot => {
      if (!querySnapshot.empty) {
        const error = new Error('User has already upvoted decision.')
        error.code = 400
        throw error
      }
      return null
    })
    .then(() => {
      return decision.get()
    })
    .then(doc => {
      if (!doc.exists) {
        const error = new Error("Decision does not exist.")
        error.code = 400
        throw error
      }
      return decision.update({ upvotes: doc.data().upvotes + 1 })
    })
    .then(() => {
      return db.collection('decisionVotes').add(vote)
    })
    .then(doc => {
      vote.voteId = doc.id
      return res.status(200).json(vote)
    })
    .catch(error => {
      console.error(error)
      res.status(error.code).json({ message: error.message })
    })
}

exports.deleteVoteOnDecision = (req, res) => {
  const decision = db.collection('decisions').doc(req.params.decisionId)
  db.collection('decisionVotes')
    .where('decisionId', '==', req.params.decisionId)
    .where('author.username', '==', req.user.username)
    .get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        const error = new Error('User has not voted on decision.')
        error.code = 400
        throw error
      }
      querySnapshot.forEach(doc => {
        return db.collection('decisionVotes').doc(doc.id).delete()
      })
      return decision.get()
    })
    .then(doc => {
      if (!doc.exists) {
        const error = new Error("Decision does not exist.")
        error.code = 400
        throw error  
      }
      return decision.update({ upvotes: doc.data().upvotes - 1 })
    })
    .then(() => {
      return res.status(200).end()
    })
    .catch(error => {
      console.error(error)
      res.status(500).end()
    })
}

// TODO Implement downvote
exports.downVoteDecision = (req, res) => {
  res.status(501).end()
}

// TODO implement
exports.upvoteDecisionComponent = (req, res) => {
  res.status(501).end()
}

// TODO implement
exports.deleteVoteOnDecisionComponent = (req, res) => {
  res.status(501).end()
}

// TODO implement
exports.downVoteDecisionComponent = (req, res) => {
  res.status(501).end()
}

