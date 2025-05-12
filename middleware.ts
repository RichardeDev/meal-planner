import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Cette fonction s'exécute avant chaque requête
export function middleware(request: NextRequest) {
  // Vérifier si l'utilisateur tente d'accéder à une page admin
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin")

  // Vérifier si l'utilisateur tente d'accéder à une page utilisateur
  const isUserPage = request.nextUrl.pathname.startsWith("/user")

  // Si ce n'est pas une page protégée, laisser passer la requête
  if (!isAdminPage && !isUserPage) {
    return NextResponse.next()
  }

  // Récupérer le token d'authentification depuis les cookies
  const authToken = request.cookies.get("authToken")?.value

  // Si pas de token, rediriger vers la page de login
  if (!authToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Pour les pages admin, vérifier si l'utilisateur est admin
  if (isAdminPage) {
    const userRole = request.cookies.get("userRole")?.value

    if (userRole !== "admin") {
      // Rediriger vers la page utilisateur si l'utilisateur n'est pas admin
      return NextResponse.redirect(new URL("/user/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

// Configurer le middleware pour s'exécuter uniquement sur certains chemins
export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
}
