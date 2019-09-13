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
// EVENT DRIVEN: send notifications/ or push to queue for user to receive latest notifications