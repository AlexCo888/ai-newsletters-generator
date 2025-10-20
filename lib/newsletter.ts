import { z } from 'zod'

export const newsletterSectionSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  pullQuote: z.string().optional(),
  linkSuggestions: z.array(z.string().url()).optional(),
})

export const newsletterCtaSchema = z.object({
  headline: z.string().optional(),
  buttonLabel: z.string().optional(),
  buttonUrl: z.string().url().nullable().optional(),
})

export const newsletterContentSchema = z.object({
  title: z.string().min(1),
  preheader: z.string().min(1),
  intro: z.string().optional(),
  sections: z.array(newsletterSectionSchema).min(1),
  outro: z.string().optional(),
  cta: newsletterCtaSchema.optional(),
})

export type NewsletterContent = z.infer<typeof newsletterContentSchema>

function isValidHttpUrl(value: unknown) {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function sanitizeNewsletterPayload(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) {
    return payload
  }

  const sections = (payload as { sections?: unknown }).sections
  if (!Array.isArray(sections)) {
    return payload
  }

  const sanitizedSections = sections.map((rawSection) => {
    if (typeof rawSection !== 'object' || rawSection === null) {
      return rawSection
    }

    const sectionRecord = { ...(rawSection as Record<string, unknown>) }
    const rawLinks = sectionRecord['linkSuggestions']

    if (!Array.isArray(rawLinks)) {
      delete sectionRecord['linkSuggestions']
      return sectionRecord
    }

    const validLinks = rawLinks.filter((value): value is string => isValidHttpUrl(value))

    if (validLinks.length === 0) {
      delete sectionRecord['linkSuggestions']
    } else {
      sectionRecord['linkSuggestions'] = validLinks
    }

    return sectionRecord
  })

  return {
    ...(payload as Record<string, unknown>),
    sections: sanitizedSections,
  }
}

export function renderNewsletterHtml(content: NewsletterContent) {
  const sections = content.sections
    .map(
      (section) => `
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e2e8f0;">
            <h3 style="margin:0;color:#0f172a;font-size:18px;">${section.title}</h3>
            <p style="margin:12px 0;color:#475569;font-size:15px;line-height:24px;">${section.summary}</p>
            ${
              section.pullQuote
                ? `<blockquote style="margin:12px 0;padding-left:16px;border-left:3px solid #2563eb;color:#1e293b;font-style:italic;">${section.pullQuote}</blockquote>`
                : ''
            }
            ${
              section.linkSuggestions?.length
                ? `<ul>${section.linkSuggestions
                    .map((url) => `<li style="margin-bottom:8px;"><a href="${url}" style="color:#2563eb;">${url}</a></li>`)
                    .join('')}</ul>`
                : ''
            }
          </td>
        </tr>`
    )
    .join('')

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${content.title}</title>
      <style>
        body { background-color: #f8fafc; color: #0f172a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
        a { color: #2563eb; }
      </style>
    </head>
    <body>
      <center style="width:100%;padding:24px 0;">
        <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px 0;">
              <h1 style="margin:0;font-size:28px;color:#0f172a;">${content.title}</h1>
              <p style="margin:12px 0;color:#475569;font-size:15px;">${content.preheader}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;color:#475569;font-size:15px;line-height:24px;">
              ${content.intro ?? ''}
            </td>
          </tr>
          ${sections}
          ${
            content.cta?.headline
              ? `<tr>
                  <td style="padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                    <h3 style="margin:0;color:#0f172a;font-size:20px;">${content.cta.headline}</h3>
                    ${
                      content.cta.buttonLabel
                        ? `<a href="${content.cta.buttonUrl ?? '#'}" style="display:inline-block;margin-top:12px;padding:12px 28px;background:#2563eb;color:#ffffff;border-radius:9999px;font-weight:600;text-decoration:none;">${content.cta.buttonLabel}</a>`
                        : ''
                    }
                  </td>
                </tr>`
              : ''
          }
          ${
            content.outro
              ? `<tr><td style="padding:24px 32px;color:#475569;font-size:14px;">${content.outro}</td></tr>`
              : ''
          }
          <tr>
            <td style="padding:16px 32px;font-size:12px;color:#94a3b8;background:#f1f5f9;">
              You are receiving this newsletter from AI Newsletters. Unsubscribe anytime.
            </td>
          </tr>
        </table>
      </center>
    </body>
  </html>`
}
