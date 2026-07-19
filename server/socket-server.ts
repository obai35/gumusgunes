import { createServer } from 'http'
import { Server } from 'socket.io'

const EMIT_API_KEY = process.env.SOCKET_EMIT_API_KEY

const httpServer = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/emit') {
    const auth = req.headers['authorization']
    if (!EMIT_API_KEY || auth !== `Bearer ${EMIT_API_KEY}`) {
      res.writeHead(401)
      res.end('unauthorized')
      return
    }
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const { event, data } = JSON.parse(body)
        io.emit(event, data)
        res.writeHead(200)
        res.end('ok')
      } catch {
        res.writeHead(400)
        res.end('bad request')
      }
    })
    return
  }
  res.writeHead(404)
  res.end()
})

const ALLOWED_SOCKET_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim())

const io = new Server(httpServer, {
  cors: { origin: ALLOWED_SOCKET_ORIGINS, methods: ['GET', 'POST'] },
})

io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('Authentication required'))
  try {
    const jwt = require('jsonwebtoken')
    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) return next(new Error('Server configuration error: JWT secret not set'))
    const payload = jwt.verify(token, secret)
    ;(socket as any).admin = payload
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  console.log(`Admin connected: ${(socket as any).admin?.adminId || 'unknown'}`)
  socket.join('admins')

  socket.on('disconnect', () => {
    console.log('Admin disconnected')
  })
})

const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10)
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})
