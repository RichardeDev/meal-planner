import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignupConfirmationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Inscription en attente de validation</CardTitle>
          <CardDescription>
            Votre demande d'inscription a été envoyée avec succès et est en attente de validation par un administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Vous recevrez un email de confirmation dès que votre compte sera validé. Vous pourrez alors vous connecter à
            l'application.
          </p>
          <p className="text-sm font-medium">Merci de votre patience!</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/login">Retour à la page de connexion</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
