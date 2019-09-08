const axios = require('axios')
const applicationId = process.env.unsplashApplicationId
const instance = axios.create({
  baseURL: "https://api.unsplash.com/",
  timeout: 1000,
  headers: {
    "Accept-Version": "v1",
    'Authorization': `Client-ID ${applicationId}`
  }
})

const getDefaultProfilePicture = async () => {
  return await getRandomPictureFromUnsplash().then(pictureUrl => pictureUrl).catch(error => {
    console.log(error)
    return "https://images.unsplash.com/photo-1533518463841-d62e1fc91373?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max"
  })
}

const getRandomPictureFromUnsplash = () => {
  const randomNumber = Math.round(Math.random()*50)
  return instance.get(`search/photos?query=animals%20profile&page=${randomNumber}&per_page=1`)
  .then(res => {
    return res.data.results[0].urls.regular
  })
}

  module.exports = { getDefaultProfilePicture }