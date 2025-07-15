import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type PendingUser } from "@/lib/json-utils"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const resolveParams = await context.params;
    const { slug } = resolveParams;
    const decodedEmail = decodeURIComponent(slug);
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
