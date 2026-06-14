"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { MessageCircle } from "lucide-react";
import { formatRelativeTime, formatPrice } from "@/lib/utils";

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer: { id: string; name: string; avatar?: string };
  seller: { id: string; name: string; avatar?: string };
  listing: { id: string; title: string; images: string[]; price: number; status: string };
  messages: Array<{ content: string; createdAt: string; senderId: string }>;
  _count: { messages: number };
  updatedAt: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      const res = await fetch("/api/conversations");
      if (res.ok) setConversations(await res.json());
      setLoading(false);
    };
    fetch_();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mensajes</h1>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mensajes</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tienes mensajes todavía</p>
          <Link href="/browse" className="btn-primary mt-4 inline-flex">
            Explorar artículos
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((convo) => {
            const isbuyer = session?.user?.id === convo.buyerId;
            const otherUser = isbuyer ? convo.seller : convo.buyer;
            const lastMessage = convo.messages[0];
            const unread = convo._count.messages;

            return (
              <Link
                key={convo.id}
                href={`/messages/${convo.id}`}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors"
              >
                {/* Other user avatar */}
                {otherUser.avatar ? (
                  <Image
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-700 font-semibold">
                    {otherUser.name[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {otherUser.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {lastMessage ? formatRelativeTime(lastMessage.createdAt) : formatRelativeTime(convo.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-500 truncate">
                      {lastMessage
                        ? lastMessage.senderId === session?.user?.id
                          ? `Tú: ${lastMessage.content}`
                          : lastMessage.content
                        : "Inicia la conversación"}
                    </span>
                    {unread > 0 && (
                      <span className="shrink-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-sage-600 text-xs font-bold text-white ml-auto">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {convo.listing.images[0] && (
                      <div className="relative h-5 w-5 rounded overflow-hidden bg-gray-100">
                        <Image
                          src={convo.listing.images[0]}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="text-xs text-gray-400 truncate">
                      {convo.listing.title} · {formatPrice(convo.listing.price)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
