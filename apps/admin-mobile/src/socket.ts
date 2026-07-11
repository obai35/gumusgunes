const SOCKET_URL = 'https://gumusgunes-socket.up.railway.app'

let socket: any = null
let ioMod: any = null
let secureStore: any = null

async function getIo() {
  if (!ioMod) {
    const mod = await import('socket.io-client')
    ioMod = mod
  }
  return ioMod
}

async function getSecureStore() {
  if (!secureStore) {
    const mod = await import('expo-secure-store')
    secureStore = mod
  }
  return secureStore
}

export async function connectSocket() {
  if (socket?.connected) return socket

  const store = await getSecureStore()
  const token = await store.getItemAsync('admin_token')
  if (!token) throw new Error('Not authenticated')

  const { io } = await getIo()
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => console.log('Socket connected'))
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason))
  socket.on('connect_error', (err) => console.log('Socket error:', err.message))

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket(): any {
  return socket
}
