import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

export type NewsletterSection = {
  title: string
  summary: string
  linkSuggestions?: string[]
  highlights?: string[]
  pullQuote?: string
}

export type NewsletterTemplateProps = {
  title?: string
  preheader?: string
  intro?: string
  heroImage?: string
  sections?: NewsletterSection[]
  cta?: { label: string; url: string }
  outro?: string
  palette?: { background?: string; surface?: string; primary?: string; accent?: string }
  unsubscribeUrl?: string
  senderName?: string
  supportEmail?: string
}

export default function Newsletter({
  title = 'Your AI Newsletter',
  preheader = 'Curated insights just for you',
  intro,
  heroImage,
  sections = [],
  cta,
  outro,
  palette,
  unsubscribeUrl,
  senderName = 'AI Newsletters',
  supportEmail,
}: NewsletterTemplateProps) {
  const colors = {
    background: palette?.background ?? '#f1f5f9',
    surface: palette?.surface ?? '#ffffff',
    primary: palette?.primary ?? '#0f172a',
    accent: palette?.accent ?? '#2563eb',
  }

  return (
    <Tailwind>
      <Html>
        <Head>
          <Font fontFamily="Inter" fallbackFontFamily="Helvetica" />
        </Head>
        <Preview>{preheader}</Preview>
        <Body className="m-0 bg-slate-100 px-4 py-8 font-sans text-slate-900" style={{ backgroundColor: colors.background }}>
          <Container className="mx-auto max-w-[640px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm" style={{ backgroundColor: colors.surface }}>
            <Heading className="mb-2 text-3xl font-semibold" style={{ color: colors.primary }}>
              {title}
            </Heading>
            {intro && <Text className="text-base leading-6 text-slate-600">{intro}</Text>}
            {heroImage && (
              <Section className="my-6 overflow-hidden rounded-lg">
                <Img src={heroImage} alt="Featured" className="w-full" />
              </Section>
            )}
            <Hr className="my-6 border-slate-200" />
            {sections.map((section, index) => (
              <Section key={index} className="mb-6">
                <Heading as="h3" className="mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                  {section.title}
                </Heading>
                <Text className="text-base leading-6 text-slate-700">{section.summary}</Text>
                {section.highlights && section.highlights.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {section.highlights.map((highlight, highlightIndex) => (
                      <li key={highlightIndex}>{highlight}</li>
                    ))}
                  </ul>
                )}
                {section.linkSuggestions && section.linkSuggestions.length > 0 && (
                  <Row className="mt-3">
                    {section.linkSuggestions.map((link, linkIndex) => (
                      <Column key={linkIndex} className="pr-2">
                        <a href={link} style={{ color: colors.accent }}>
                          {link.replace(/^https?:\/\//, '')}
                        </a>
                      </Column>
                    ))}
                  </Row>
                )}
                {section.pullQuote && (
                  <Section className="mt-4 rounded-lg bg-slate-100 p-4">
                    <Text className="text-base italic text-slate-700">“{section.pullQuote}”</Text>
                  </Section>
                )}
              </Section>
            ))}
            {cta && (
              <Section className="my-6 text-center">
                <Button
                  className="inline-block rounded-full px-6 py-3 text-base font-semibold text-white"
                  style={{ backgroundColor: colors.accent }}
                  href={cta.url}
                >
                  {cta.label}
                </Button>
              </Section>
            )}
            {outro && (
              <Text className="mt-6 text-base leading-6 text-slate-600">{outro}</Text>
            )}
            <Hr className="my-6 border-slate-200" />
            <Text className="text-xs leading-5 text-slate-500">
              Sent by {senderName}. {supportEmail ? (
                <>
                  Need help? <a href={`mailto:${supportEmail}`} style={{ color: colors.accent }}>Contact support</a>.
                </>
              ) : null}
            </Text>
            <Text className="text-xs leading-5 text-slate-500">
              You are receiving this because you subscribed to receive updates.{' '}
              {unsubscribeUrl ? (
                <a href={unsubscribeUrl} style={{ color: colors.accent }}>
                  Unsubscribe
                </a>
              ) : (
                'Manage your preferences in your account settings.'
              )}
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
