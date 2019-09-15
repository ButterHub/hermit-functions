exports.isValidEmail = (email) => {
    const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return emailPattern.test(email)
  }

exports.documentShouldNotExist = (doc, errorCode, errorMessage) => {
    // TODO does this change the docType value outside of this scope?
    // TODO instead of passing in a docType, can't I get a collection name from the doc response
    if (doc.exists) {
        const error = new Error(errorMessage)
        error.code = errorCode
        throw error
      }
}

exports.documentShouldExist = (doc, errorCode, errorMessage) => {
    if (doc.exists) {
        const error = new Error(errorMessage)
        error.code = errorCode
        throw error
      }
}