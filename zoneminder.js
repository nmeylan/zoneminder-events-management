const got = require('got')

class Zoneminder {
  constructor({host, isInsecure}) {
    this.host = host.endsWith('/') ? host : `${host}/`
    this.username = null
    this.password = null
    this.isInsecure = isInsecure
    this.token = null
    this.httpClient = got.extend({
      https: {
        rejectUnauthorized: !this.isInsecure,
      },
      hooks: {
        afterResponse: [
          async (response, retryWithMergedOptions) => {
            if (response.statusCode === 401 && !response.requestUrl.endsWith('login.json')) {
              if (this.token
                && (Date.now() - this.token.access_token_issued_at > this.token.access_token_expires) // access token expired
                && (Date.now() - this.token.refresh_token_issued_at < this.token.refresh_token_expires) // refresh token valid
              ) {
                await this.refreshToken()
              } else {
                await this.login()
              }
              const updatedOptions = {
                searchParams: {token: this.token.access_token}
              }
              // Make a new retry
              return retryWithMergedOptions(got.mergeOptions(this.httpClient.defaults.options, updatedOptions))
            }
            return response
          }
        ],
      }
    })
  }

  login(username, password) {
    if (username && password) {
      this.username = username
      this.password = password
    }
    return new Promise(async (resolve, reject) => {
      if (!this.username && !this.password) {
        return reject(new Error('Empty username and/or password'))
      }
      try {
        const token = await this.httpClient.post(`${this.host}api/host/login.json`, {
          form: {user: this.username, pass: this.password}
        })
          .json()

        this.token = {
          ...token,
          // Don't want to read jwt to get iat, setting issued datetime manually.
          access_token_issued_at: Date.now() - 1000, refresh_token_issued_at: Date.now() - 1000
        }
        resolve(this.token)
      } catch(e) {
        reject(e)
      }
    })
  }

  refreshToken() {
    if (!this.token) {
      return
    } else {
      this.login()
    }
    (async () => {
      try {
        const response = await this.httpClient.get(`${this.host}api/host/login.json?token=${this.token.refresh_token}`, {}).json()
        this.token.access_token = response.access_token
        this.token.access_token_issued_at = Date.now() - 1000
      } catch(e) {
        await this.login()
      }
    })()
  }

  downloadImage(url, callback) {
    return new Promise((resolve) => {
      this.httpClient.get(url, {
        responseType: 'buffer',
      })
        .then(response => {
          callback(response.body.toString('base64'))
          resolve()
        }).catch(() => {
        resolve()
      })
    })
  }

  async getEvents() {
    if (!this.token) {
      await this.login()
    }
    return new Promise(async (resolve) => {
      const getEvent = (page) => {
        return this.httpClient.get(`${this.host}api/events.json?token=${this.token.access_token}&page=${page}`).json()
      }

      function lowerEventKeys(event) {
        Object.keys(event).forEach(key => {
          event[key[0].toLocaleLowerCase() + key.slice(1)] = event[key]
          delete event[key]
        })
      }

      const {pagination, events} = await getEvent(1)
      let res = events
      for (let i = 2; i <= pagination.pageCount; i++) {
        const {events} = await getEvent(1)
        res = [res, ...events]
      }
      res = res.map(r => r.Event)

      const imagesDownloadPromises = []

      res.forEach(event => {
        lowerEventKeys(event)
        imagesDownloadPromises.push(
          this.downloadImage(`${this.host}index.php?token=${this.token.access_token}&eid=${event.id}&fid=snapshot&view=image&width=500&height=300`, (img) => event.snapshot = img))
        imagesDownloadPromises.push(
          this.downloadImage(`${this.host}index.php?token=${this.token.access_token}&eid=${event.id}&fid=objdetect&view=image&width=500&height=300`, (img) => event.objdetect = img))
      })
      await Promise.all(imagesDownloadPromises)
      resolve(res)
    })
  }

  getSnapshot(eventId) {
    return new Promise(async resolve => {
      if (!this.token) {
        await this.login()
      }
      const imagesDownloadPromises = []
      const event = {}
      imagesDownloadPromises.push(
        this.downloadImage(`${this.host}index.php?token=${this.token.access_token}&eid=${eventId}&fid=snapshot&view=image`, (img) => event.snapshot = img))
      imagesDownloadPromises.push(
        this.downloadImage(`${this.host}index.php?token=${this.token.access_token}&eid=${eventId}&fid=objdetect&view=image`, (img) => event.objdetect = img))
      await Promise.all(imagesDownloadPromises)
      resolve(event)
    })
  }

  async getStream(eventId) {
    if (!this.token) {
      await this.login()
    }
    try {
      return this.httpClient.stream(`${this.host}cgi-bin/nph-zms?token=${this.token.access_token}&mode=jpeg&frame=1&scale=100&rate=100&maxfps=60&replay=none&source=event&event=${eventId}`)
    } catch (e) {
      console.error(e)
    }
  }

  deleteEvents(eventIds) {
    return Promise.all(eventIds.map(eventId => this.httpClient.delete(`${this.host}api/events/${eventId}.json?token=${this.token.access_token}`)))
  }
}

module.exports = Zoneminder