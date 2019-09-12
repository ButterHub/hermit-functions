const {db} = require('../util/admin')

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
  .catch((err) => console.log(err))
}

exports.createDecision = (req, res) => {
  const {title, context} = req.body
  const {user} = req
  const decision = {
    context, user, title,
    createTime: new Date().toISOString()
  }
  db.collection('decisions').add(decision).then(doc => {
    return res.json(decision)
  }).catch(err => {
    return res.status(500).json({message: "Unable to create user."}, err)
  })
}

exports.deleteDecision = (req, res) => {
  db.collection('decisions').doc(req.params.decisionId).get()
  .then(doc => {
    if (!doc.exists) {
      const error = new Error("Document does not exist.")
      error.code = 400
      throw error;
    }
    if ( !doc.userId === req.user.user_id ) {
      const error = new Error("You cannot delete this decision.")
      error.code = 404
      throw error;
    }
    return db.collection('decisions').doc(req.params.decisionId).delete()
  })
  .then(() => res.status(200).end())
  .catch(error => {
    console.log(`ERROR is ${error}`)
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
    .orderBy('createTime', 'desc') // TODO add createTime to code/ docs
    .where('objectId', '==', req.params.decisionId).get()
    .then(querySnapshot => {
      comments = []
      querySnapshot.forEach(doc => {
        comments.push(doc.data())
      })
      return comments
    }),
    db.collection('upvotes').where('objectId', '==', req.params.decisionId).get()
    .then(querySnapshot => {
      upvotes = []
      querySnapshot.forEach(doc => {
        upvotes.push(doc.data())
      })
      return upvotes
    })
  ])
  .then(([decision, comments, upvotes]) => {
    return res.json({...decision, comments, upvotes})
  })
  .catch(error => {
    console.log(error)
    return res.status(error.code).json({ message: error.message})
  })
}