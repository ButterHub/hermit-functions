const { db, admin } = require('../util/admin')

exports.createDecisionComponent = async (req, res) => {
    // todo add permissions to decisions/ components
    const { headline, summary, deadline } = req.body
    try {
        const decisionComponentCollection = db.collection('decisionComponents')
        const decisionComponent = {
            decisionId: req.params.decisionId,
            headline,
            summary,
            deadline,
            upvotes: 0,
            downvotes: 0,
            createTime: new Date().toISOString()
        }
        db.collection('decisions').doc(req.params.decisionId).update({
            watchers: admin.firestore.FieldValue.arrayUnion(req.user.username)
        })
        const doc = await decisionComponentCollection.add(decisionComponent)
        decisionComponent.decisionComponentId = doc.id
        return res.status(201).json(decisionComponent)
    }
    catch(error) {
        console.error(error)
        return res.status(500).json({"message": error.message})
    }
}

exports.editDecisionComponent = async (req, res) => {
    try {
        const updatedFields = {}
        const { headline, summary, deadline } = req.body
        const decisionComponentId = req.params.decisionComponentId
        if (headline && headline.trim() !== "") {
            updatedFields.headline = headline
        }
        if (summary && summary.trim() !== "") {
            updatedFields.summary = summary
        }
        if (deadline && deadline.trim() !== "") {
            updatedFields.deadline = deadline
        }
        
        if (Object.keys(updatedFields).length > 0) {
            await db.collection('decisionComponents').doc(decisionComponentId).update(updatedFields)
            return res.status(200).end()
        } else {
            return res.status(400).end()
        }
    } catch(error) {
        console.log(error)
        return res.status(500).end()
    }
}