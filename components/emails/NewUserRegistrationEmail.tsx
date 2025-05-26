import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components"

interface NewUserRegistrationEmailProps {
  name: string
  email: string
  appUrl: string
}

export const NewUserRegistrationEmail = ({
  name,
  email,
  appUrl,
}: NewUserRegistrationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Nouvelle demande d'inscription</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={`${appUrl}/logo.png`} width="100" height="40" alt="Logo" style={logo} />
          <Text style={paragraph}>Bonjour,</Text>
          <Text style={paragraph}>
            Une nouvelle demande d'inscription a été reçue avec les informations suivantes :
          </Text>
          <Text style={paragraph}>
            <strong>Nom :</strong> {name}
          </Text>
          <Text style={paragraph}>
            <strong>Email :</strong> {email}
          </Text>
          <Hr style={hr} />
          <Text style={paragraph}>Veuillez valider cette demande depuis le tableau d’administration.</Text>
          <Section style={buttonContainer}>
            <Button href={`${appUrl}/admin/dashboard/users`} style={button}>
              Gérer les utilisateurs
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles optionnels
const main = { backgroundColor: "#ffffff", fontFamily: "Arial" }
const container = { padding: "20px" }
const logo = { marginBottom: "20px" }
const paragraph = { fontSize: "16px", lineHeight: "24px" }
const hr = { borderColor: "#e6e6e6", margin: "20px 0" }
const buttonContainer = { textAlign: "center" as const }
const button = {
  backgroundColor: "#4F46E5",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "5px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
}

export default NewUserRegistrationEmail