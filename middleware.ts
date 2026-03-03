import { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl

  const publicRoutes = ["/api/auth/login", "/api/auth/signup", "/api/selections"]
  if (publicRoutes.some((route) => url.pathname.startsWith(route))) {
    return NextResponse.next()
  } 

  const isApiRoute = url.pathname.startsWith("/api")
  const isAdminPage = url.pathname.startsWith("/admin")
  const isUserPage = url.pathname.startsWith("/user")

  const authToken = request.cookies.get("authToken")?.value
  console.log(`Your authToken: ${authToken}`)

  if (isAdminPage) {

    if (!authToken) {
      url.pathname = "/login"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    
    const decodedToken = JSON.parse(Buffer.from(authToken, "base64").toString("utf-8"))

    if (decodedToken.role !== "admin") {
      return NextResponse.redirect(new URL("/user/dashboard", request.url))
    }
  }

  if (isUserPage && !isAdminPage) {
    if (!authToken) {
      url.pathname = "/login"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  if (isApiRoute && !url.pathname.startsWith("/api/auth")) {
    const basicAuth = request.headers.get("authorization")

    if (!basicAuth || !basicAuth.startsWith("Basic ")) {
      return unauthorizedResponse()
    }

    try {
      const encodedCredentials = basicAuth.split(" ")[1]
      const credentials = Buffer.from(encodedCredentials, "base64").toString("utf-8")
      const [username, password] = credentials.split(":")
      const validUser = process.env.API_USER!
      const validPassword = process.env.API_PASSWORD!

      if (!validUser || !validPassword) {
        throw new Error("Variables d'environnement manquantes")
      }

      if (username === validUser && password === validPassword) {
        return NextResponse.next()
      }

      return unauthorizedResponse()
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error)
      return NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 }
      )
    }
  }

  return NextResponse.next()
}

function unauthorizedResponse() {
  return new NextResponse(
    JSON.stringify({ error: "Accès refusé - Authentification requise" }),
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    }
  )
}


export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/api/:path*",
  ],
}