import Pusher from "pusher";
import PusherClient from "pusher-js";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "",
  secret: process.env.PUSHER_APP_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
  useTLS: true,
});

// Lazy singleton so a missing key doesn't crash the module
let _pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  if (!key || key === "your-app-key") return null;
  if (!_pusherClient) {
    _pusherClient = new PusherClient(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
    });
  }
  return _pusherClient;
}

// Keep named export for backwards compatibility but make it lazy too
export const pusherClient = typeof window !== "undefined"
  ? (() => {
      const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
      if (!key || key === "your-app-key") return null as unknown as PusherClient;
      return new PusherClient(key, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
      });
    })()
  : null as unknown as PusherClient;
