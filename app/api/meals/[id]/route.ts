import { type NextRequest, NextResponse } from "next/server";
import { readData, updateData, User } from "@/lib/json-utils";

// GET /api/users/[email] - Récupérer un utilisateur par email
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



// PUT /api/users/[id] - Mettre à jour un utilisateur
export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const { slug } = params
    const updatedUserData = await request.json()

    // Validation de base
    if (!updatedUserData.name || !updatedUserData.email || !updatedUserData.role) {
      return NextResponse.json({ error: "Données utilisateur incomplètes" }, { status: 400 })
    }

    let userFound = false

    await updateData("users", (users) => {
      const userIndex = users.findIndex((user) => user.id === slug)

      if (userIndex === -1) {
        return users
      }

      userFound = true
      console.log("userFound : ",userFound)

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const emailExists = users.some((user, index) => user.email === updatedUserData.email && index !== userIndex)

      if (emailExists) {
        throw new Error("Cet email est déjà utilisé par un autre utilisateur")
      }

      // Mettre à jour l'utilisateur
      users[userIndex] = {
        ...users[userIndex],
        name: updatedUserData.name,
        email: updatedUserData.email,
        role: updatedUserData.role,
      }

      return [...users]
    })

    if (!userFound) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'utilisateur",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/users/[id] - Supprimer un utilisateur
export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const data = await readData()

    // Vérifier si l'utilisateur existe
    const userToDelete = data.users.find((user) => user.id === slug)

    if (!userToDelete) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier si c'est le dernier administrateur
    if (userToDelete.role === "admin") {
      const adminCount = data.users.filter((user) => user.role === "admin").length
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error: "Impossible de supprimer le dernier administrateur",
          },
          { status: 400 },
        )
      }
    }

    // Supprimer l'utilisateur
    await updateData("users", (users) => users.filter((user) => user.id !== slug))

    // Supprimer les sélections de cet utilisateur
    await updateData("userSelections", (selections) => selections.filter((selection) => selection.userId !== slug))

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de l'utilisateur",
      },
      { status: 500 },
    )
  }
}
