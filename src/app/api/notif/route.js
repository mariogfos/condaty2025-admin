import { NextResponse } from "next/server";
import { init, id } from "@instantdb/admin";

export async function POST(request) {
  try {
    console.log("Request headers:", request.headers);
    console.log("Request body:", await request.text()); // Antes de parsear JSON
    // Verificar que hay cuerpo en la solicitud
    if (!request.body) {
      return NextResponse.json(
        { message: "Cuerpo de solicitud vacío" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: "JSON inválido en el cuerpo de la solicitud" },
        { status: 400 }
      );
    }

    const { id: _id, payload, channel, event } = body;

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
