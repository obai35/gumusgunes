import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/emit') {
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

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('Authentication required'))
  try {
    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || '')
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
