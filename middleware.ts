import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware({
  publicRoutes: [
    '/',
    '/pricing',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/stripe',
    '/api/webhooks/resend',
  ],
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
