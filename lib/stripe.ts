import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Casting because stripe@16 types only enumerate '2024-06-20'; upgrade SDK to drop this.
  apiVersion: '2025-09-30.clover' as unknown as Stripe.LatestApiVersion,
})
