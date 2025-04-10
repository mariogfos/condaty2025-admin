import { NextResponse } from "next/server";
import { init, id } from "@instantdb/admin";

export async function POST(request) {
  const db = await init({
    appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID,
    adminToken: process.env.NEXT_PUBLIC_INSTANTDB_APP_ADMIN_TOKEN,
  });
  const { id: _id, payload, channel, event } = await request.json();
  // if (!_id) {
  console.log(
    "instant:",
    id,
    process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX
  );
  if (!_id || _id != process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

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
}

export async function GET() {
  return NextResponse.json(
    { message: "Método GET no permitido" },
    { status: 405 }
  );
}
