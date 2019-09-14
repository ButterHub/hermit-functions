const { db } = require('../util/admin')

exports.createNotificationOnDecisionUpvote = async snap => {
  try {
    const vote = snap.data()
    const decisionDoc = await db.collection('decisions').doc(vote.decisionId).get()
    if (!decisionDoc.exists) {
      const error = new Error('Decision does not exist.')
      error.code = 400
      throw error
    }
    const decision = decisionDoc.data()
    if (vote.up === true && decision.author.username !== vote.author.username) {
      const batch = db.batch()
      decision.watchers.forEach(watcher => {
        const notificationRef = db.collection('notifications').doc(`${snap.id}-${watcher}`)
        batch.set(notificationRef, {
          createTime: new Date().toISOString(),
          recipientUsername: watcher,
          sender: vote.author.username,
          type: 'upvote',
          read: false,
          decisionId: decisionDoc.id
        })
      })
      return await batch.commit()
    }
  } catch (error) {
    return console.error(error)
  }
}

exports.deleteNotificationOnDeleteDecisionUpvote = async snap => {
  const { decisionId, author } = snap.data()
  const batch = db.batch()
  const notificationsSnapshot = await db.collection('notifications')
    .where('decisionId', '==', decisionId)
    .where('sender', '==', author.username)
    .where('type', '==', 'upvote').get()
  if (notificationsSnapshot.empty) {
    return console.log('No relevant notifications found.')
  }
  notificationsSnapshot.forEach(notification => {
    batch.delete(notification.ref)
  })
  return batch.commit()
}

// TODO: Event driven using fcm: send notifications/ or push to queue for user to receive latest notifications?
exports.sendFirebaseMessagesOnNewNotification = (snap, context) => {
  // Don't add much content, just "You have unread notifications" to firebase message to user
  return console.error('Not implemented.', snap, context)
}

// TODO implement
exports.createNotificationOnDecisionComponentComment = (snap, context) => {
  return console.error('Not implemented.', snap, context)
}

// TODO implement
exports.deleteNotificationOnDeleteDecisionComponentComment = (snap, context) => {
  return console.error('Not implemented.', snap, context)
}

exports.markNotificationAsRead = async (req, res) => {
  const notificationId = req.params.notificationId
  try {
    const notificationDoc = await db.collection('notifications').doc(notificationId).get()
    if (!notificationDoc.exists) {
      const error = new Error('Notification does not exist.')
      error.code = 404
      throw error
    }
    const notification = notificationDoc.data()
    if (notification.recipient !== req.user.username) {
      const error = new Error('Notification does not belong to current user.')
      error.code = 403
      throw error
    }
    await db.collection('notifications').doc(notificationId).update({ read: true })
    notification.read = true
    return res.status(200).json(notification)
  } catch (error) {
    console.error(error)
    return res.status(error.code).json({ message: error.message })
  }
}
