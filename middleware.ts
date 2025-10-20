import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/privacy',
  '/terms',
  '/unsubscribe(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/stripe',
  '/api/webhooks/resend',
])

export default clerkMiddleware((auth, request) => {
  if (isPublicRoute(request)) {
    return
  }

  auth().protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
