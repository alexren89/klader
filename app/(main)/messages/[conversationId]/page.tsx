"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Send, ChevronLeft, DollarSign, Check, X, Loader2 } from "lucide-react";
import { pusherClient } from "@/lib/pusher";
import { formatRelativeTime, formatPrice } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  content: string;
  messageType: string;
  offerAmount?: number;
  offerStatus?: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatar?: string };
}

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer: { id: string; name: string; avatar?: string };
  seller: { id: string; name: string; avatar?: string };
  listing: { id: string; title: string; images: string[]; price: number; status: string };
}

export default function ChatPage() {
  const { conversationId } = useParams();
  const { data: session } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [convoRes, msgRes] = await Promise.all([
        fetch(`/api/conversations/${conversationId}`),
        fetch(`/api/conversations/${conversationId}/messages`),
      ]);
      if (convoRes.ok) setConversation(await convoRes.json());
      if (msgRes.ok) setMessages(await msgRes.json());
    };
    fetchData();
  }, [conversationId]);

  useEffect(() => {
    if (!pusherClient) return;
    const channel = pusherClient.subscribe(`conversation-${conversationId}`);
    channel.bind("new-message", (message: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });
    return () => {
      pusherClient!.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !offerMode) return;
    if (offerMode && !offerAmount) return;

    setSending(true);
    try {
      const body = offerMode
        ? {
            content: `Oferta: ${formatPrice(parseFloat(offerAmount))}`,
            messageType: "offer",
            offerAmount: parseFloat(offerAmount),
          }
        : { content: input.trim(), messageType: "text" };

      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) =>
          prev.find((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]
        );
        setInput("");
        setOfferAmount("");
        setOfferMode(false);
      }
    } finally {
      setSending(false);
    }
  };

  const handleOfferAction = async (messageId: string, action: "accept" | "reject") => {
    await fetch(`/api/conversations/${conversationId}/offers/${messageId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, offerStatus: action === "accept" ? "accepted" : "rejected" }
          : m
      )
    );
  };

  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage-500" />
      </div>
    );
  }

  const isbuyer = session?.user?.id === conversation.buyerId;
  const otherUser = isbuyer ? conversation.seller : conversation.buyer;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link href="/messages" className="text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-5 w-5" />
          </Link>

          {otherUser.avatar ? (
            <Image
              src={otherUser.avatar}
              alt={otherUser.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 text-sage-700 font-semibold">
              {otherUser.name[0]?.toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{otherUser.name}</p>
            <p className="text-xs text-gray-500 truncate">{conversation.listing.title}</p>
          </div>

          {/* Listing reference */}
          <Link
            href={`/listings/${conversation.listing.id}`}
            className="shrink-0 flex items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
          >
            {conversation.listing.images[0] && (
              <div className="relative h-8 w-8 rounded overflow-hidden">
                <Image
                  src={conversation.listing.images[0]}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span className="text-xs font-medium text-gray-700">
              {formatPrice(conversation.listing.price)}
            </span>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Inicia la conversación sobre{" "}
              <span className="font-medium text-gray-600">
                {conversation.listing.title}
              </span>
            </div>
          )}

          {messages.map((message) => {
            const isMine = message.senderId === session?.user?.id;

            if (message.messageType === "offer") {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="rounded-xl border border-earth-200 bg-earth-50 p-4 max-w-xs w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-earth-600" />
                      <span className="text-sm font-semibold text-earth-700">
                        Oferta de precio
                      </span>
                    </div>
                    <p className="text-xl font-bold text-earth-700 mb-2">
                      {formatPrice(message.offerAmount || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      De: {message.sender.name}
                    </p>

                    {message.offerStatus === "pending" &&
                      !isMine &&
                      isbuyer === false && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOfferAction(message.id, "accept")}
                            className="btn-primary flex-1 justify-center py-1.5 text-xs"
                          >
                            <Check className="h-3 w-3" />
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleOfferAction(message.id, "reject")}
                            className="btn-ghost flex-1 justify-center py-1.5 text-xs text-red-600"
                          >
                            <X className="h-3 w-3" />
                            Rechazar
                          </button>
                        </div>
                      )}

                    {message.offerStatus === "accepted" && (
                      <span className="text-xs text-sage-600 font-medium">
                        ✓ Oferta aceptada
                      </span>
                    )}
                    {message.offerStatus === "rejected" && (
                      <span className="text-xs text-red-500 font-medium">
                        ✗ Oferta rechazada
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}
              >
                {!isMine &&
                  (message.sender.avatar ? (
                    <Image
                      src={message.sender.avatar}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover shrink-0 mt-1"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 mt-1 items-center justify-center rounded-full bg-sage-100 text-sage-700 text-xs font-semibold">
                      {message.sender.name[0]?.toUpperCase()}
                    </div>
                  ))}

                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "bg-sage-600 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isMine ? "text-sage-200" : "text-gray-400"
                    }`}
                  >
                    {formatRelativeTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-2xl">
          {offerMode && (
            <div className="mb-2 rounded-lg bg-earth-50 border border-earth-200 p-3 flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-earth-600" />
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Monto de la oferta"
                className="flex-1 bg-transparent text-sm font-medium text-earth-700 outline-none placeholder-earth-400"
                min="0.01"
                step="0.01"
                autoFocus
              />
              <button
                onClick={() => {
                  setOfferMode(false);
                  setOfferAmount("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {!isbuyer === false && (
              <button
                onClick={() => setOfferMode(!offerMode)}
                className={`rounded-lg p-2.5 transition-colors ${
                  offerMode
                    ? "bg-earth-100 text-earth-700"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
                title="Hacer oferta"
              >
                <DollarSign className="h-5 w-5" />
              </button>
            )}

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  offerMode ? "Mensaje opcional con la oferta..." : "Escribe un mensaje..."
                }
                className="input-field resize-none min-h-[42px] max-h-32 py-2.5"
                rows={1}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={sending || (!input.trim() && !offerMode)}
              className="btn-primary p-2.5 rounded-lg disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
