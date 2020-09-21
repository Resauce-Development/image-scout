import ImageModel from '../classes/ImageModel.js'

import { unsplash_access_key } from '../apiKeys.js'

export default {
  inject: ['system'],
  data() {
    const api = this.system.axios.create({
      baseURL: 'https://api.unsplash.com',
      timeout: 1000,
      headers: {"Authorization" : `Client-ID ${unsplash_access_key}`} // This should be removed eventually as it shouldn't be client-side
    });
    return {
      unsplashApi: api,
      images: null,
      countOfPages: null,
      countOfImages: null,
      fetch_limit: 30,
      request_time: 0,
    }
  },
  created() {
    console.info('🎨✅ Unsplash: Loaded!')
  },
  methods: {
    unsplashFetchPhotos(search_term, current_page) {
      var timerStart = performance.now()
      console.info(`🎨🕒 Unsplash: Fetching search for "${search_term}" on page ${current_page}`, 'pending')
      const reqUrl = `/search/photos?per_page=${this.fetch_limit}&page=${current_page}&query=${search_term}`
      return this.unsplashApi.get(reqUrl)
        .then(({data}) => {
          console.info(`🎨✅ Unsplash: Fetching search for "${search_term}" on page ${current_page}`, 'succeeded', data)
          let results = []
          data.results.forEach(res => {
            const image = new ImageModel(
              res,
              `Photo by ${res.user.name}`, 
              res.alt_description, 
              res.urls.thumb, 
              res.links.download, 
              res.links.html,
              res.user.links.html
            )
            if(res.tags) { image.setTags(res.tags.map(item => item['title'])) }
            results.push(image)
          })
          this.images = results
          this.countOfImages = data.total
          this.countOfPages = data.total_pages
        })
        .catch(err => console.warn(`🎨❌ Unsplash: Fetched search for "${search_term}" on page ${current_page}`, 'failed', err))
        .then(() => {
          var timerEnd = performance.now()
          this.request_time = parseFloat(timerEnd-timerStart/1000).toFixed(12)
        })
    },
    unsplashFetchRandomPhotos() {
      let random;
      if(random = sessionStorage.getItem('unsplash_random_images')) {
        console.info('🎨🕒 Unsplash: Fetching random images from the sessionStorage', 'pending')
        return new Promise( (resolve, reject) => {
          let data = JSON.parse(random)
          try {
            this.images = data
            this.countOfImages = data.length
            this.countOfPages = null
          } catch (error) { 
            reject(error) 
          }
          resolve(data)
        })
        .then(data => console.info('🎨✅ Unsplash: Fetching random images from the sessionStorage', 'succeeded', data))
        .catch(err => console.warn('🎨❌ Unsplash: Fetching random images from sessionStorage', 'failed', err))
      } else {
        console.info('🎨 Unsplash: Fetching random images from the UnsplashAPI')
        const reqUrl = `/photos/random?featured=true&count=${this.fetch_limit}`
        return this.unsplashApi.get(reqUrl)
          .then(({data}) => {
            console.info('🎨✅ Unsplash: Fetching random images from the UnsplashAPI', 'succeeded', data)
            let results = []
            data.forEach(res => {
              const image = new ImageModel(
                res,
                `Photo by ${res.user.name}`, 
                res.alt_description, 
                res.urls.thumb, 
                res.links.download,
                res.links.html,
                res.user.links.html
              )
              if(res.tags) { image.setTags(res.tags.map(item => item['title'])) }
              results.push(image)
            })
            this.images = results
            this.countOfImages = data.length
            this.countOfPages = null
            sessionStorage.setItem('unsplash_random_images', JSON.stringify(results))
          })
          .catch(err => console.warn('🎨❌ Unsplash: Fetching random images from the UnsplashAPI', 'failed', err))
      }
    }
  }
}