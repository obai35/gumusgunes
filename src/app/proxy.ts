import { withAuth } from 'next-auth/middleware'

export default withAuth(function proxy() {}, {
  callbacks: {
    authorized: ({ req, token }) => {
      if (req.nextUrl.pathname === '/api/admin/seed') return true
      return !!token
    },
  },
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
