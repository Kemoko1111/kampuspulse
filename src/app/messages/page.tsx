"use client";

import { motion } from "framer-motion";
import NextImage from "next/image";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send, Search, Phone, Video,
  Image as ImageIcon, Smile, ArrowLeft, Loader2,
} from "lucide-react";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { useRealtimeMessages } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, startConversation } from "@/lib/api-client";
import { toast } from "react-hot-toast";
import type { ChatRoom, Message } from "@/types";

type RoomMessage = Pick<Message, "id" | "content" | "type" | "is_read" | "created_at" | "sender_id">;

type RoomFromApi = ChatRoom & { messages?: RoomMessage[] };

interface ParticipantProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  phone?: string;
}

function typeColor(type: string) {
  return type === "vendor"
    ? "from-blue-600 to-blue-400"
    : type === "rider"
      ? "from-purple-600 to-purple-400"
      : "from-emerald-600 to-emerald-400";
}

function formatMessageTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessagesPage() {
  // chat_rooms.participants and messages.sender_id both store the PROFILE id
  // (not the auth user id) — using user.id here made every "other participant"
  // lookup miss (→ "Unknown User"), counted your own messages as unread, and
  // rendered your own messages as if the other person sent them.
  const { profile } = useAuth();
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState<RoomFromApi[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [participantMap, setParticipantMap] = useState<Record<string, ParticipantProfile>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingDebounce = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    loading: messagesLoading,
    isTyping,
    sendMessage,
    sendTypingIndicator,
  } = useRealtimeMessages(activeConvo);

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    const res = await fetch("/api/messages/rooms");
    if (res.ok) {
      const { data } = await res.json();
      setRooms(data || []);
    }
    setRoomsLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Deep-link entry point: /messages?user=<recipientProfileId> (used by every
  // "Message"/"Chat" button across the app). Create-or-open that conversation,
  // select it, and strip the param so a refresh doesn't re-trigger it. Read
  // from window.location to avoid needing a useSearchParams Suspense boundary.
  useEffect(() => {
    if (!profile?.id) return;
    const recipientId = new URLSearchParams(window.location.search).get("user");
    if (!recipientId || recipientId === profile.id) return;
    let cancelled = false;
    (async () => {
      const roomId = await startConversation(recipientId);
      if (cancelled || !roomId) return;
      await fetchRooms();
      if (!cancelled) setActiveConvo(roomId);
      window.history.replaceState(null, "", "/messages");
    })();
    return () => { cancelled = true; };
  }, [profile?.id, fetchRooms]);

  useEffect(() => {
    if (!profile || rooms.length === 0) return;

    const otherIds = rooms
      .map((room) => room.participants.find((p) => p !== profile.id))
      .filter((id): id is string => !!id);

    if (otherIds.length === 0) return;

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, phone")
      .in("id", [...new Set(otherIds)])
      .then(({ data }) => {
        if (data) {
          const map: Record<string, ParticipantProfile> = {};
          (data as ParticipantProfile[]).forEach((p) => { map[p.id] = p; });
          setParticipantMap(map);
        }
      });
  }, [rooms, profile]);

  const getOtherParticipant = useCallback(
    (room: RoomFromApi) => {
      if (!profile) return null;
      const otherId = room.participants.find((p) => p !== profile.id);
      return otherId ? participantMap[otherId] : null;
    },
    [profile, participantMap]
  );

  const getRoomMeta = useCallback(
    (room: RoomFromApi) => {
      const other = getOtherParticipant(room);
      const name = room.is_group
        ? room.group_name || "Group Chat"
        : other?.full_name || "Unknown User";
      const sortedMessages = [...(room.messages || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastMsg = sortedMessages[0];
      const unread = (room.messages || []).filter(
        (m) => !m.is_read && m.sender_id !== profile?.id
      ).length;

      return {
        name,
        avatar: getInitials(name),
        role: other?.role || "student",
        lastMessage: lastMsg?.content || "No messages yet",
        time: room.last_message_at
          ? formatRelativeTime(room.last_message_at)
          : lastMsg
            ? formatRelativeTime(lastMsg.created_at)
            : "",
        unread,
      };
    },
    [getOtherParticipant, profile?.id]
  );

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((room) => getRoomMeta(room).name.toLowerCase().includes(q));
  }, [rooms, search, getRoomMeta]);

  const activeConvoData = rooms.find((c) => c.id === activeConvo);
  const activeMeta = activeConvoData ? getRoomMeta(activeConvoData) : null;
  const activeOther = activeConvoData ? getOtherParticipant(activeConvoData) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => clearTimeout(typingDebounce.current);
  }, []);

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (value.trim()) {
      sendTypingIndicator(true);
      clearTimeout(typingDebounce.current);
      typingDebounce.current = setTimeout(() => sendTypingIndicator(false), 2000);
    } else {
      sendTypingIndicator(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConvo) return;
    const ok = await sendMessage(newMessage);
    if (ok) {
      setNewMessage("");
      sendTypingIndicator(false);
      fetchRooms();
    }
  };

  const handleImageButtonClick = () => {
    if (!activeConvo || uploadingImage) return;
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeConvo) return;

    setUploadingImage(true);
    try {
      // NOTE: reusing the "product-images" bucket since it's the only public,
      // generically-allowed image bucket in uploadSchema; task-attachments/
      // rider-documents are private (RLS-gated) so their public URLs would
      // 400 when rendered directly in the chat bubble. A dedicated
      // "message-attachments" bucket would be the cleaner long-term fix.
      const res = await uploadFile("product-images", file);
      if (!res.ok) {
        toast.error("Failed to upload image");
        return;
      }
      const { data } = await res.json();
      const ok = await sendMessage(data.url, "image");
      if (ok) {
        fetchRooms();
      } else {
        toast.error("Failed to send image");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4">
          <h1 className="font-display font-black text-3xl">Messages</h1>
          <p className="text-muted-foreground text-sm">Chat with vendors, riders, and task workers</p>
        </div>

        <div className="glass-card overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
          <div className="flex h-full">
            {/* ── SIDEBAR ── */}
            <div className={cn(
              "flex flex-col border-r border-white/5 transition-all",
              activeConvo ? "hidden lg:flex lg:w-80" : "w-full lg:w-80"
            )}>
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search conversations..." className="input-premium pl-9 py-2 text-sm" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {roomsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const meta = getRoomMeta(room);
                    return (
                      <button key={room.id} id={`convo-${room.id}`}
                        onClick={() => setActiveConvo(room.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-all border-b border-white/3",
                          activeConvo === room.id && "bg-blue-500/10 border-r-2 border-r-blue-500"
                        )}>
                        <div className="relative flex-shrink-0">
                          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${typeColor(meta.role)} flex items-center justify-center text-white text-xs font-bold`}>
                            {meta.avatar}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-sm text-foreground">{meta.name}</span>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{meta.time}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">{meta.lastMessage}</p>
                            {meta.unread > 0 && (
                              <span className="ml-2 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {meta.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── CHAT WINDOW ── */}
            {activeConvo ? (
              <div className={cn("flex flex-col flex-1", activeConvo ? "flex" : "hidden lg:flex")}>
                <div className="flex items-center gap-3 p-4 border-b border-white/5">
                  <button onClick={() => setActiveConvo(null)} className="lg:hidden w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${typeColor(activeMeta?.role || "student")} flex items-center justify-center text-white text-xs font-bold`}>
                      {activeMeta?.avatar}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{activeMeta?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {isTyping ? "typing..." : "Chat"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeOther?.phone ? (
                      <a href={`tel:${activeOther.phone}`}
                        title={`Call ${activeOther.full_name}`}
                        className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => toast("No phone number on file for this user")}
                        title="No phone number available"
                        className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center opacity-50 hover:bg-white/10 transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => toast("In-app video calling is coming soon")}
                      title="Video call (coming soon)"
                      className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.sender_id === profile?.id;
                      return (
                        <motion.div key={msg.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5",
                            isMe
                              ? "bg-blue-500 text-white rounded-br-sm"
                              : "glass border border-white/10 text-foreground rounded-bl-sm"
                          )}>
                            {msg.type === "image" ? (
                              <a href={msg.content} target="_blank" rel="noopener noreferrer" className="block">
                                <NextImage
                                  src={msg.content}
                                  alt="Shared image"
                                  width={220}
                                  height={220}
                                  className="rounded-xl object-cover max-w-full h-auto"
                                />
                              </a>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}
                            <p className={cn("text-[10px] mt-1", isMe ? "text-blue-200" : "text-muted-foreground")}>
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="glass border border-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageSelected}
                      className="hidden"
                    />
                    <button onClick={handleImageButtonClick} disabled={uploadingImage}
                      className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0 disabled:opacity-50">
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <button className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0">
                      <Smile className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <input id="chat-input" type="text" value={newMessage}
                      onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message..." className="input-premium flex-1 py-2.5 text-sm" />
                    <button id="send-message-btn" onClick={handleSendMessage} disabled={!newMessage.trim()}
                      className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-all disabled:opacity-50 flex-shrink-0">
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex flex-1 items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1">Your Messages</h3>
                  <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
