const {db, admin} = require('../util/admin')

exports.getAllDecisions = (req, res) => {
  db.collection('decisions')
  .orderBy('createTime', 'desc')
  .get()
  .then(data => {
    let decisions = []
    data.forEach(doc => {
      decisions.push({
        decisionId: doc.id,
        ...doc.data()
      })
    })
    return res.json(decisions)
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).end()
  })
}

exports.createDecision = (req, res) => {
  const {context, importance, status, headline, advisors, conclusion} = req.body
  const {user} = req
  const decision = {
    context, importance, status, headline, advisors, conclusion,
    upvotes: 0,
    downvotes: 0,
    files: [],
    createTime: new Date().toISOString(),
    watchers: [req.user.username],
    author: user
  }
  db.collection('decisions').add(decision).then(doc => {
    decision.decisionId = doc.id
    return res.json(decision)
  }).catch(err => {
    return res.status(500).json({message: "Unable to create user."}, err)
  })
}

exports.deleteDecision = (req, res) => {
  db.collection('decisions').doc(req.params.decisionId).get()
  .then(decisionDoc => {
    if (!decisionDoc.exists) {
      const error = new Error("Document does not exist.")
      error.code = 400
      throw error;
    }
    if ( !decisionDoc.author.username === req.user.username ) {
      const error = new Error("You cannot delete this decision.")
      error.code = 404
      throw error;
    }
    return db.collection('decisions').doc(req.params.decisionId).delete()
  })
  .then(() => res.status(200).end())
  .catch(error => {
    console.error(error)
    res.status(error.code).json({message: error.message})
  })
}

exports.getDecision = (req, res) => {
  Promise.all([
    db.doc(`/decisions/${req.params.decisionId}`).get()
  .then(doc => {
    if (!doc.exists) {
      const error = new Error("Decision does not exist.")
      error.code = 404
      throw error
    }
    return doc.data()
  }),
    db.collection('comments')
    .orderBy('createTime', 'desc')
    .where('decisionComponentId', '==', req.params.decisionId).get()
    .then(querySnapshot => {
      const comments = []
      querySnapshot.forEach(doc => {
        comments.push(doc.data())
      })
      return comments
    }),
    db.collection('decisionVotes').where('decisionId', '==', req.params.decisionId).get()
    .then(querySnapshot => {
      const upvotes = []
      querySnapshot.forEach(doc => {
        upvotes.push(doc.data())
      })
      return upvotes
    })
  ])
  .then(([decision, comments, decisionUpvotes]) => {
    return res.json({...decision, comments, decisionUpvotes})
  })
  .catch(error => {
    console.error(error)
    return res.status(error.code).json({ message: error.message})
  })
}

exports.watchDecision = async (req, res) => {
  try {
      await db.collection('decisions').doc(req.params.decisionId).update({
        watchers: admin.firestore.FieldValue.arrayUnion(req.user.username)
    })
    res.status(200).end()
  } catch(error) {
    console.error(error)
    return res.status(500).json({ error: error.message})
  }
}

exports.unwatchDecision = async (req, res) => {
  try {
    await db.collection('decisions').doc(req.params.decisionId).update({
      watchers: admin.firestore.FieldValue.arrayRemove(req.user.username)
  })
  res.status(200).end()
} catch(error) {
  console.error(error)
  return res.status(500).json({ error: error.message})
}
}