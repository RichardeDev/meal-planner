import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface RejectedEmailProps {
  name: string
  appName?: string
}

export const UserRegistrationRejectedEmail = ({
  name,
  appName = "Planificateur de Repas",
}: RejectedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Votre inscription a été rejetée</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>Bonjour {name},</Text>
          <Text style={paragraph}>
            Nous sommes désolés, mais votre inscription a été rejetée. Veuillez nous contacter pour plus d'informations.
          </Text>
          <Text style={footer}>{appName}</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: "#ffffff", fontFamily: "Arial" }
const container = { padding: "20px" }
const paragraph = { fontSize: "16px", lineHeight: "24px" }
const footer = { fontSize: "12px", color: "#999" }