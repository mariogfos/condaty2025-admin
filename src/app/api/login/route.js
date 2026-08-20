import { NextResponse } from "next/server";
import { init } from "@instantdb/admin";

export async function POST(request) {
  const db = init({
    appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID,
    adminToken: process.env.NEXT_PUBLIC_INSTANTDB_APP_ADMIN_TOKEN,
  });
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const token = await db.auth.createToken(
    id + "@" + process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX + ".com"
  );

  return NextResponse.json({ success: true, message: "Token válido", token });
}

export async function GET() {
  return NextResponse.json(
    { message: "Método GET no permitido" },
    { status: 405 }
  );
}
