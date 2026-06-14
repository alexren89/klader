import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id")!;
  const channel = params.get("channel_name")!;

  // Verify the user has access to this channel
  const conversationId = channel.replace("conversation-", "");

  const auth = pusherServer.authorizeChannel(socketId, channel, {
    user_id: session.user.id,
  });

  return NextResponse.json(auth);
}
