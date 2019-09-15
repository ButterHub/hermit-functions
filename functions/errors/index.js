exports.RegisteredEmailError = require('./RegisteredEmailError')
exports.RegisteredUsernameError = require('./RegisteredUsernameError')

exports.sendErrorResponse = (error, res) => {
    console.error(error)
    if (error.code === "auth/invalid-email") error.code = 400
    return res.status(error.code || 500).json({ message: error.message })
}