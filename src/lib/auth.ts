import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword } from './auth-utils'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const admin = await db.admin.findUnique({ where: { email: credentials.email } })
        if (!admin) return null
        const valid = await verifyPassword(credentials.password, admin.password)
        if (!valid) return null
        return { id: admin.id, email: admin.email, name: admin.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.email = user.email }
      const admin = await db.admin.findUnique({ where: { id: token.id as string } })
      if (admin) token.storeId = admin.storeId
      return token
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.id as string; session.user.storeId = token.storeId as string }
      return session
    },
  },
}
