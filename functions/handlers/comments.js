const { db } = require('../util/admin')

exports.createComment = (req, res) => {
  if (req.body.body.trim() === '') return res.status(400).json({ message: 'Comment cannot be empty' })
  const comment = {
    userId: req.user.user_id,
    objectId: req.params.objectId,
    userPictureUrl: req.user.pictureUrl,
    body: req.body.body
  }
  db.collection('comments').add(comment)
    .then(doc => {
      comment.id = doc.id
      return res.json(comment)
    })
    .catch(error => {
      console.log(error)
      res.status(500).end({ message: 'Unable to add comments. Check your request body.' })
    })
}

exports.deleteComment = (req, res) => {
  db.collection('comments').doc(req.params.commentId).get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(400).json({ message: 'Comment does not exist.' })
      }
      if (doc.data().userId !== req.user.user_id) {
        return res.status(404).json({ message: 'You cannot delete that comment.' })
      }
      return db.collection('comments').doc(req.params.commentId).delete()
    })
    .then(() => {
      return res.status(200).end()
    })
    .catch(error => {
      console.log(error)
      res.status(500).end()
    })
}
