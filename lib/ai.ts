import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModelV1 } from 'ai'

if (!process.env.AI_GATEWAY_API_KEY) {
  console.warn('AI_GATEWAY_API_KEY is not set. AI generation will fail until configured.')
}

export const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
})

export const openaiModel = (modelId: string): LanguageModelV1 =>
  openai(modelId) as unknown as LanguageModelV1
