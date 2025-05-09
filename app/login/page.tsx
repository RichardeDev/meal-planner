"use client";

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getUserByEmail } from "@/lib/data"
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    
    const user = await getUserByEmail(email);

    if (user && user.role === "admin" && user.password === password) {
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Connexion réussie", {
        description: `Bienvenue, ${user.name}!`,
      });
      router.push("/admin/dashboard");
    } else if (user && user.role === "user" && user.password === password) {
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Connexion réussie", {
        description: `Bienvenue, ${user.name}!`,
      });
      router.push("/user/dashboard");
    } else {
      toast.error("Erreur de connexion", {
        description: "Email ou mot de passe incorrect",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>Connectez-vous à votre compte pour accéder à votre planificateur de repas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="info">Informations</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Se connecter
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="info" className="space-y-4">
              <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-4">
                <h3 className="font-medium mb-2">Comptes de démonstration:</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Administrateur:</strong>
                    <br />
                    Email: admin@example.com
                    <br />
                    Mot de passe: admin123
                  </p>
                  <p>
                    <strong>Utilisateur:</strong>
                    <br />
                    Email: user@example.com
                    <br />
                    Mot de passe: user123
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Pas encore inscrit ?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
