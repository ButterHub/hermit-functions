const { db }= require('../util/admin')

exports.createNotificationOnDecisionUpvote = async (snap, context) => {
  try {
    const vote = snap.data()
    const decisionDoc = await db.collection('decisions').doc(vote.decisionId).get()
    if (!decisionDoc.exists) {
      const error = new Error("Decision does not exist.")
      error.code = 400
      throw error
    }
    if (vote.up === true) {
      
    }

  } catch(error) {
    return console.error(error)
  }
}

exports.deleteNotificationOnDeleteDecisionUpvote = (snap, context) => {

}

exports.createNotificationOnDecisionComponentComment = (snap, context) => {
  
}

exports.deleteNotificationOnDeleteDecisionComponentComment = (snap, context) => {

}

// array of notifications to be pulled by client (stored in user)
// Advanced/ EVENT DRIVEN option: send notifications/ or push to queue for user to receive latest notifications


exports.markNotificationAsRead = async (req, res) => {
  const notificationId = req.params.notificationId
  try {
    const notificationDoc = await db.collection('notifications').doc(notificationId).get()
    if (!notificationDoc.exists) {
      const error = new Error("Notification does not exist.")
      error.code = 404
      throw error
    }
    const notification = notificationDoc.data()
    if (notification.userId !== req.user.user_id) {
      const error = new Error("Notification does not belong to current user.")
      error.code = 403
      throw error
    }
    await db.collection('notifications').doc(notificationId).update({read: true})
    notification.read = true
    return res.status(200).json(notification)
  } catch(error) {
    console.error(error)
    return res.status(error.code).json({message: error.message})
  }
}