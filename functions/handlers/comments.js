const { db, admin } = require('../util/admin')

exports.createComment = async (req, res) => {
  const { user } = req
  try {
    if (req.body.body.trim() === '') return res.status(400).json({ body: 'Comment body must not be empty' })
    const comment = {
      username: req.user.username,
      decisionComponentId: req.params.decisionComponentId,
      author: user,
      body: req.body.body
    }
    const decisionComponentDoc = await db.collection('decisionComponents').doc(req.params.decisionComponentId).get()
    if (!decisionComponentDoc.exists) {
      const error = new Error('Decision component does not exist.')
      error.code = 400
      throw error
    }
    db.collection('decisions').doc(decisionComponentDoc.data().decisionId).update({
      watchers: admin.firestore.FieldValue.arrayUnion(req.user.username)
    })
    const commentDoc = await db.collection('comments').add(comment)
    comment.id = commentDoc.id
    return res.json(comment)
  } catch (error) {
    console.error(error)
    return res.status(error.code).json({ message: 'Unable to create comment.' })
  }
}

exports.deleteComment = (req, res) => {
  db.collection('comments').doc(req.params.commentId).get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(400).json({ message: 'Comment does not exist.' })
      }
      if (doc.data().username !== req.user.username) {
        return res.status(404).json({ message: 'You cannot delete that comment.' })
      }
      return db.collection('comments').doc(req.params.commentId).delete()
    })
    .then(() => {
      return res.status(200).end()
    })
    .catch(error => {
      console.error(error)
      res.status(500).end()
    })
}
