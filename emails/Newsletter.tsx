import { Html, Body, Container, Heading, Text, Hr, Link, Section } from '@react-email/components'

type SectionT = { title: string; summary: string; linkSuggestions?: string[] }

export default function Newsletter({
  title = 'Your AI Newsletter',
  intro,
  sections = [],
  outro,
  palette,
}: {
  title?: string
  intro?: string
  sections?: SectionT[]
  outro?: string
  palette?: { primary?: string; accent?: string }
}) {
  const primary = palette?.primary ?? '#0f172a'
  const accent = palette?.accent ?? '#2563eb'
  return (
    <Html>
      <Body style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <Container style={{ backgroundColor: 'white', margin: '24px auto', padding: 24, borderRadius: 8, width: 640 }}>
          <Heading style={{ margin: '0 0 8px', color: primary }}>{title}</Heading>
          {intro && <Text style={{ color: '#475569', fontSize: 16 }}>{intro}</Text>}
          <Hr />
          {sections.map((s, i) => (
            <Section key={i} style={{ marginBottom: 16 }}>
              <Heading as="h3" style={{ margin: 0, color: primary }}>
                {s.title}
              </Heading>
              <Text style={{ color: '#334155' }}>{s.summary}</Text>
              {!!s.linkSuggestions?.length && (
                <ul>
                  {s.linkSuggestions.map((l, j) => (
                    <li key={j}>
                      <Link href={l} style={{ color: accent }}>
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          ))}
          {outro && (
            <>
              <Hr />
              <Text style={{ color: '#475569' }}>{outro}</Text>
            </>
          )}
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            You are receiving this newsletter from AI Newsletters.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
