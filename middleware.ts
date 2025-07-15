import { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl

  const publicRoutes = ["/api/auth/login", "/api/auth/signup"]
  if (publicRoutes.some((route) => url.pathname.startsWith(route))) {
    return NextResponse.next()
  } 

  const isApiRoute = url.pathname.startsWith("/api")
  const isAdminPage = url.pathname.startsWith("/admin")
  const isUserPage = url.pathname.startsWith("/user")

  if (isAdminPage) {
    const emailCookie = request.cookies.get("userEmail")?.value
    const userRole = await get_user_role(emailCookie)

    if (!request.cookies.get("authToken")?.value) {
      url.pathname = "/login"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/user/dashboard", request.url))
    }
  }

  if (isUserPage && !isAdminPage) {
    if (!request.cookies.get("authToken")?.value) {
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

async function get_user_role(emailCookie?:string) {
  if (!emailCookie) {
    return NextResponse.json({ error: "Email non trouvé" }, { status: 400 })
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/${encodeURIComponent(emailCookie)}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.API_USER}:${process.env.API_PASSWORD}`).toString("base64")}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 })
    }

    const userData = await response.json()

    return userData.role
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle utilisateur:", error)
    return NextResponse.json({ error: "Échec de l'authentification" }, { status: 500 })
  }
}


export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/api/:path*",
  ],
}