import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'

export type NewsletterSection = {
  title: string
  summary: string
  linkSuggestions?: string[]
  pullQuote?: string
}

type NewsletterProps = {
  title?: string
  intro?: string
  sections?: NewsletterSection[]
  outro?: string
  palette?: {
    primary?: string
    accent?: string
    background?: string
  }
  preheader?: string
}

export default function Newsletter({
  title = 'Your AI Newsletter',
  intro,
  sections = [],
  outro,
  palette,
  preheader = 'Fresh insights tailored to you',
}: NewsletterProps) {
  const primary = palette?.primary ?? '#0f172a'
  const accent = palette?.accent ?? '#2563eb'
  const background = palette?.background ?? '#f8fafc'

  return (
    <Html>
      <Head>
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background-color: #0b1120 !important; color: #e2e8f0 !important; }
            a { color: #60a5fa !important; }
            .card { background-color: #1e293b !important; }
          }
        `}</style>
      </Head>
      <Preview>{preheader}</Preview>
      <Body style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', backgroundColor: background, color: primary }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '24px auto', padding: 24, borderRadius: 12, width: '100%', maxWidth: 640 }}>
          <Heading style={{ margin: '0 0 8px', color: primary }}>{title}</Heading>
          {intro && <Text style={{ color: '#475569', fontSize: 16, lineHeight: '24px' }}>{intro}</Text>}
          <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

          {sections.map((section, index) => (
            <Section key={index} className="card" style={{ marginBottom: 24, backgroundColor: '#f8fafc', padding: 20, borderRadius: 12 }}>
              <Heading as="h3" style={{ margin: '0 0 8px', color: primary, fontSize: 20 }}>{section.title}</Heading>
              <Text style={{ color: '#334155', fontSize: 15, lineHeight: '22px' }}>{section.summary}</Text>
              {section.pullQuote && (
                <Text style={{ color: accent, fontSize: 16, fontStyle: 'italic', marginTop: 12 }}>&ldquo;{section.pullQuote}&rdquo;</Text>
              )}
              {!!section.linkSuggestions?.length && (
                <ul style={{ paddingLeft: 20, marginTop: 12 }}>
                  {section.linkSuggestions.map((link, linkIndex) => (
                    <li key={linkIndex} style={{ marginBottom: 6 }}>
                      <Link href={link} style={{ color: accent, textDecoration: 'underline' }}>
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          ))}

          {outro && (
            <>
              <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />
              <Text style={{ color: '#475569' }}>{outro}</Text>
            </>
          )}

          <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            You are receiving this newsletter from AI Newsletters. Unsubscribe anytime from your settings.
          </Text>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            123 Market Street, Suite 100, San Francisco, CA 94105
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
