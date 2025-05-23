// import { type NextRequest, NextResponse } from "next/server"
// import { readData } from "@/lib/json-utils"

// // GET /api/users/[email] - Récupérer un utilisateur par email
// export async function GET(request: NextRequest, { params }: { params: { email: string } }) {
//   try {
//     const { email } = params
//     const decodedEmail = decodeURIComponent(email)
//     const data = await readData()
//     const user = data.users.find((user) => user.email === decodedEmail)

//     if (!user) {
//       return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
//     }

//     return NextResponse.json(user)
//   } catch (error) {
//     return NextResponse.json({ error: "Erreur lors de la récupération de l'utilisateur" }, { status: 500 })
//   }
// }

import { type NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/json-utils";
import { sendEmail } from "@/lib/email-utils";

// GET /api/users/[email] - Récupérer un utilisateur par email
export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const resolveParams = await params;
    const { email } = resolveParams;
    const decodedEmail = decodeURIComponent(email);
    const data = await readData();
    const user = data.users.find((user) => user.email === decodedEmail);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}
