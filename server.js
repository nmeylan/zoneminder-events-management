const Koa = require('koa')
const next = require('next')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const session = require('koa-encrypted-session')
const Zoneminder = require('./zoneminder')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'

const app = next({dev})
const handle = app.getRequestHandler()

if (!process.env.ZM_HOST) {
  console.error('ZM_HOST env was not found.\n Please provide ZM_HOST which is the root url to contact zoneminder, e.g: https://YOUR_HOST:PORT/zm/')
  process.exit(1)
}
if (process.env.ZM_TLS_INSECURE === 'true') {
  console.warn('ZM_TLS_INSECURE was set to true, peer verifier is disabled')
}
if (process.env.SESSION_COOKIE_INSECURE === 'true') {
  console.warn('SESSION_COOKIE_INSECURE was set to true, session cookie secure flag is not set')
}
if (!process.env.SESSION_DURATION_IN_MS) {
  console.info('SESSION_DURATION_IN_MS was not found, using default value: 1 year')
}

app.prepare().then(() => {
  const server = new Koa()
  const router = new Router()
  const zoneminder = new Zoneminder({
    host: process.env.ZM_HOST,
    isInsecure: process.env.ZM_TLS_INSECURE === 'true'
  })

  if (!process.env.SESSION_COOKIE_SALT) {
    console.warn('SESSION_COOKIE_SALT env was not found, a default value is used for cookie salt, while it works it is a severe security issue.\nPlease provide SESSION_COOKIE_SALT with an at least 32 bytes salt.')
  }
  if (!process.env.SESSION_COOKIE_SECRET) {
    console.warn('SESSION_COOKIE_SECRET env was not found, a default value is used for cookie secretKey, while it works it is a severe security issue.\nPlease provide SESSION_COOKIE_SECRET with an at least 32 bytes secret key.')
  }

  server.use(session({
    key: 'session',
    maxAge: process.env.SESSION_DURATION_IN_MS || 365 * 24 * 60 * 60 * 1000, // one year
    autoCommit: true,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false,
    renew: true,
    secure: process.env.SESSION_COOKIE_INSECURE !== 'true',
    salt: process.env.SESSION_COOKIE_SALT || Buffer.from('-KaNdRgUkXp2s5v8y2dmb8apxbgy/B?E(H+MbQeShVmYq3t6w9z$C&F', 'base64'),
    secretKey: process.env.SESSION_COOKIE_SECRET || Buffer.from('y*B)E@GbKeNhRkUpWrZs2lpowu/x?z(C-EaHcMfPjSmUqXs!v$', 'base64'),
    sameSite: true,
  }, server))

  server.use(async (ctx, next) => {
    if (ctx.session && !zoneminder.username && !zoneminder.password) {
      zoneminder.username = ctx.session.username
      zoneminder.password = ctx.session.password
    }
    await next()
  })

  server.use(async (ctx, next) => {
    if (ctx.path === '/login' || ctx.path === '/api/login' || ctx.path.startsWith('/_next')) {
      await next()
      return
    }
    if (ctx.session.isAuthenticated) {
      await next()
    } else {
      ctx.redirect('/login')
      ctx.respond = true
    }
  })

  server.use(bodyParser())

  router.get('/api/events', async (ctx) => {
    const events = await zoneminder.getEvents()
    ctx.body = events
    ctx.respond = true
  })

  router.post('/api/login', async (ctx) => {
    try {
      await zoneminder.login(ctx.request.body.username, ctx.request.body.password)
      ctx.session.username = ctx.request.body.username
      ctx.session.password = ctx.request.body.password
      ctx.session.isAuthenticated = true
      ctx.res.statusCode = 200
    } catch (e) {
      ctx.res.statusCode = 400
    }
    ctx.respond = true
  })

  router.delete('/api/logout', async (ctx) => {
    ctx.session = null
    zoneminder.username = null
    zoneminder.password = null
    ctx.respond = true
  })

  router.get('/api/events/:id/snapshot', async (ctx) => {
    ctx.body = await zoneminder.getSnapshot(ctx.params.id)
    ctx.respond = true
  })
  router.get('/api/events/:id/stream', async (ctx) => {
    try {
      ctx.body = await zoneminder.getStream(ctx.params.id)
    } catch (e) {
      console.error(e)
    }
    ctx.respond = true
  })

  router.delete('/api/events/bulk-delete', async (ctx) => {
    await zoneminder.deleteEvents(ctx.request.body.events)
    ctx.respond = true
  })

  router.all('*', async (ctx) => {
    await handle(ctx.req, ctx.res)
    ctx.respond = false
  })

  server.use(async (ctx, next) => {
    ctx.res.statusCode = 200
    await next()
  })

  server.use(router.routes())
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
