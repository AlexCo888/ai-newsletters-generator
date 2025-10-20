import { createOpenAI } from '@ai-sdk/openai'

if (!process.env.AI_GATEWAY_API_KEY) {
  console.warn('AI_GATEWAY_API_KEY is not set. AI generation will fail until configured.')
}

export const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
})
