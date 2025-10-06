"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send, Users, ChevronLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { authService, type User } from "@/lib/auth";

interface Sender {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CommunicationItem {
  _id: string;
  type: "group" | "personal";
  recipients?: string[];
  sender: Sender;
  content: string;
  subject?: string;
  createdAt: string;
  readBy?: string[];
}

interface AppUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export default function PersonalizedCommunication() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showUserList, setShowUserList] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleBack = useCallback(() => {
    try {
      const prev = sessionStorage.getItem("prevPath");
      if (prev) {
        sessionStorage.removeItem("prevPath");
        router.push(prev);
        return;
      }
      if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          if (!refUrl.pathname.startsWith("/communications")) {
            window.location.href = document.referrer;
            return;
          }
        } catch {
          // ignore
        }
      }
      if (window.history.length > 1) {
        router.back();
        return;
      }
    } catch {
      // swallow
    }
    router.push("/dashboard");
  }, [router]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://accordbackend.onrender.com/api/communications/users", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not load users.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  const fetchConversation = useCallback(
    async (otherUserId: string | null) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!otherUserId) {
          setCommunications([]);
          return;
        }
        const url = `https://accordbackend.onrender.com/api/communications/personal/${otherUserId}`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch conversation");
        const data = await res.json();
        setCommunications(Array.isArray(data.data) ? data.data.sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : []);
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 40);

        // Mark messages as read
        const unreadMessages = data.data.filter((msg: CommunicationItem) => 
          !msg.readBy?.includes(user?._id) && msg.sender._id !== user?._id
        );
        for (const msg of unreadMessages) {
          await fetch(`https://accordbackend.onrender.com/api/communications/${msg._id}/read`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Could not load conversation.",
          variant: "destructive",
        });
        setCommunications([]);
      } finally {
        setLoading(false);
      }
    },
    [toast, user]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await authService.getCurrentUser();
        if (!mounted) return;
        setUser(u);
      } catch {
        // ignore auth errors
      }
      await fetchUsers();
      const prevSelected = sessionStorage.getItem("selectedUserId");
      if (prevSelected) {
        setSelectedUserId(prevSelected);
        fetchConversation(prevSelected);
        setShowUserList(false);
      } else {
        setCommunications([]);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchUsers, fetchConversation]);

  useEffect(() => {
    if (selectedUserId) {
      sessionStorage.setItem("selectedUserId", selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [communications.length]);

  const handleSelectUser = (id: string) => {
    setSelectedUserId(id);
    fetchConversation(id);
    setShowUserList(false);
  };

  const handleRefresh = () => {
    if (selectedUserId) {
      fetchConversation(selectedUserId);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!selectedUserId || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Select a recipient and enter a message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: CommunicationItem = {
      _id: tempId,
      type: "personal",
      recipients: [selectedUserId],
      sender: user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: (user as any).email } : { _id: "me", firstName: "Me", lastName: "", email: "" },
      content: message,
      createdAt: new Date().toISOString(),
    };

    setCommunications(prev => [...prev, optimistic]);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      const body = {
        type: "personal",
        recipients: [selectedUserId],
        content: optimistic.content,
      };

      const res = await fetch("https://accordbackend.onrender.com/api/communications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to send message");
      }

      await fetchConversation(selectedUserId);
    } catch (err: any) {
      setCommunications(prev => prev.filter(c => c._id !== tempId));
      toast({
        title: "Send Failed",
        description: err?.message || "Could not send message. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return isToday 
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderBubble = (comm: CommunicationItem) => {
    const isMine = user && comm.sender && (comm.sender._id === (user as any)._id || comm.sender.email === (user as any).email);
    return (
      <div key={comm._id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
        <div className={`max-w-[70%] px-3 py-2 rounded-lg break-words relative ${isMine ? "bg-[#00aeef] text-white rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none border"}`}>
          <div className="text-sm">{comm.content}</div>
          <div className={`text-[10px] mt-1 ${isMine ? "text-white/80 text-right" : "text-gray-500"}`}>
            {formatTimestamp(comm.createdAt)}
          </div>
          {isMine && comm.readBy?.length && <div className="text-[10px] text-blue-200 text-right">✓✓</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00aeef] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedUserId && !showUserList && (
            <Button variant="ghost" size="sm" onClick={() => setShowUserList(true)} className="text-white">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <MessageCircle className="w-6 h-6" />
          <div className="font-semibold">Chats</div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="text-white">Back</Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* User List (Chats List) */}
        <div className={`${showUserList ? "block" : "hidden"} sm:block bg-white p-3 overflow-y-auto`}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-[#00aeef]" />
            <div className="text-lg font-medium text-[#00aeef]">Chats</div>
          </div>
          {loadingUsers ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500 text-center">No users available.</div>
          ) : (
            <div className="space-y-2">
              {users.filter(u => u._id !== (user as any)?._id).map(u => (
                <button
                  key={u._id}
                  onClick={() => handleSelectUser(u._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${selectedUserId === u._id ? "bg-[#00aeef]/10" : "hover:bg-gray-50"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#00aeef]/20 flex items-center justify-center text-[#007bbf] font-medium">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation View */}
        <div className={`${showUserList ? "hidden" : "flex"} sm:flex flex-1 flex-col bg-[url('/whatsapp-bg.png')] bg-repeat bg-contain`}>
          <div className="bg-[#00aeef] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-[#00aeef] font-medium flex items-center justify-center">
                {selectedUserId ? users.find(u => u._id === selectedUserId)?.firstName[0] + users.find(u => u._id === selectedUserId)?.lastName[0] : "?"}
              </div>
              <div>
                <div className="font-medium">{selectedUserId ? (users.find(u=>u._id===selectedUserId)?.firstName + " " + users.find(u=>u._id===selectedUserId)?.lastName) : "Select a user"}</div>
                <div className="text-xs">{selectedUserId ? users.find(u=>u._id===selectedUserId)?.email : ""}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading || !selectedUserId}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-[70%] rounded-lg" />)}
              </div>
            ) : communications.length === 0 ? (
              <div className="text-center text-sm text-gray-600 mt-8">Start a conversation</div>
            ) : (
              <div className="space-y-2">
                {communications.map(renderBubble)}
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t">
            <div className="flex items-center gap-2">
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Type a message..." 
                rows={1} 
                className="flex-1 resize-none rounded-full border-gray-300 focus:border-[#00aeef]" 
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              />
              <Button 
                onClick={() => handleSend()} 
                className="bg-[#00aeef] hover:bg-[#0095d5] text-white rounded-full p-2" 
                disabled={isSending || !selectedUserId}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}