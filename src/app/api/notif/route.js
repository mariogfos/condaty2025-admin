import { NextResponse } from "next/server";
import { init, id } from "@instantdb/admin";

export async function POST(request) {
  try {
    // Leer el cuerpo como texto primero
    const rawBody = await request.text();
    console.log("Raw body:", rawBody);

    let body;
    try {
      // Parsear manualmente el JSON
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        {
          message: "JSON inválido en el cuerpo de la solicitud",
          error: parseError.message,
        },
        { status: 400 }
      );
    }

    const { id: _id, payload, channel, event, client_id } = body;
    console.log("Parsed body:", { _id, payload, channel, event, client_id });

    // Validación de seguridad
    if (!_id || _id != process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const db = await init({
      appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID,
      adminToken: process.env.NEXT_PUBLIC_INSTANTDB_APP_ADMIN_TOKEN,
    });

    const res = await db.transact([
      db.tx.notif[id()].update({
        from: _id,
        payload,
        channel,
        event,
        created_at: Date.now(),
        client_id: client_id,
      }),
    ]);

    return NextResponse.json({ success: true, message: res });
  } catch (error) {
    console.error("Error en el endpoint /api/notif:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Método GET no permitido" },
    { status: 405 }
  );
}

// import { NextResponse } from "next/server";
// import { init, id } from "@instantdb/admin";

// export async function POST(request) {
//   const db = await init({
//     appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID,
//     adminToken: process.env.NEXT_PUBLIC_INSTANTDB_APP_ADMIN_TOKEN,
//   });
//   const { id: _id, payload, channel, event } = await request.json();
//   // if (!_id) {
//   console.log(
//     "instant:",
//     id,
//     process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX
//   );
//   if (!_id || _id != process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX) {
//     return NextResponse.json({ message: "No autorizado" }, { status: 401 });
//   }

//   const res = await db.transact([
//     db.tx.notif[id()].update({
//       from: _id,
//       payload,
//       channel,
//       event,
//       created_at: Date.now(),
//     }),
//   ]);
//   return NextResponse.json({ success: true, message: res });
// }

// export async function GET() {
//   return NextResponse.json(
//     { message: "Método GET no permitido" },
//     { status: 405 }
//   );
// }
