import { io, Socket } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'

const SOCKET_URL = 'https://gumusgunes-socket.up.railway.app'

let socket: Socket | null = null

export async function connectSocket() {
  if (socket?.connected) return socket

  const token = await SecureStore.getItemAsync('admin_token')
  if (!token) throw new Error('Not authenticated')

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

export function getSocket(): Socket | null {
  return socket
}
