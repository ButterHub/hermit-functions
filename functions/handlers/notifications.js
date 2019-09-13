const { db }= require('../util/admin')

exports.createNotificationOnUpvote = (snap, context) => {
  const vote = snap.data()
  // Get 
  if (vote.up === true) {

  }
}

// TODO CREATE helper function, to get back the document from correct collection, based on objectId

// To consider? Move from upvoting and commenting on objectIds?