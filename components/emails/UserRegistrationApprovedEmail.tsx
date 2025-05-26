import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components"

interface ApprovedEmailProps {
  name: string
  appName?: string
  appUrl?: string
}

export const UserRegistrationApprovedEmail = ({
  name,
  appName = "Planificateur de Repas",
  appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
}: ApprovedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Votre compte a été approuvé</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>Bonjour {name},</Text>
          <Text style={paragraph}>
            Votre inscription a été approuvée par un administrateur.
          </Text>
          <Section style={{ textAlign: "center" }}>
            <Button href={`${appUrl}/login`} style={button}>
              Se connecter
            </Button>
          </Section>
          <Text style={footer}>{appName}</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: "#ffffff", fontFamily: "Arial" }
const container = { padding: "20px" }
const paragraph = { fontSize: "16px", lineHeight: "24px" }
const button = {
  backgroundColor: "#4F46E5",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "5px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
}
const footer = { fontSize: "12px", color: "#999", marginTop: "20px" }

export default UserRegistrationApprovedEmail