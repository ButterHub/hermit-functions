const { db } = require('../util/admin')

exports.createDecisionComponent = async (req, res) => {
    const { headline, summary, deadline } = req.body
    try {
        const decisionComponentCollection = db.collection('decisionComponents')
        const decisionComponent = {
            decisionId: req.params.decisionId,
            headline,
            summary,
            deadline,
            upvotes: 0,
            downvotes: 0
        }
    
        const doc = await decisionComponentCollection.add(decisionComponent)
        decisionComponent.decisionComponentId = doc.id
        return res.status(201).json(decisionComponent)
    }
    catch(error) {
        console.error(error)
        return res.status(500).json({"message": error.message})
    }
}

exports.editDecisionComponent = (req, res) => {
    // TODO implement editing decision component
    res.status(501).end()
}