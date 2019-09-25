

exports.errorHandler = (error, req, res, next) => {
    console.error(error)
    if (error.code === "auth/invalid-email") error.code = 400
    else if (typeof error.code === "string") {
        error.code = 500
    }
    return res.status(error.code || 500).json({ message: error.message })
    // message: "Internal server error."
}


// TODO use express error handling middleware
exports.asyncHandler = () => {

}