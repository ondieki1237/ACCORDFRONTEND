"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, ChevronLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { authService, type User } from "@/lib/auth";

interface Sender {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface GroupCommunicationItem {
  _id: string;
  type: "group" | "personal";
  groupId?: string;
  subject?: string;
  content: string;
  sender: Sender;
  createdAt: string;
  readBy?: string[];
}

export default function GroupCommunication() {
  const [user, setUser] = useState<User | null>(null);
  const [communications, setCommunications] = useState<GroupCommunicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
      // ignore
    }
    router.push("/dashboard");
  }, [router]);

  const fetchCommunications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams({ limit: "50" });
      const url = `http://localhost:5000/api/communications/group?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch communications");
      const data = await res.json();
      setCommunications(Array.isArray(data.data) ? data.data.sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : []);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);

      // Mark messages as read
      const unreadMessages = data.data.filter((msg: GroupCommunicationItem) => 
        !msg.readBy?.includes(user?._id) && msg.sender._id !== user?._id
      );
      for (const msg of unreadMessages) {
        await fetch(`http://localhost:5000/api/communications/${msg._id}/read`, {
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
        description: "Could not load communications.",
        variant: "destructive",
      });
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await authService.getCurrentUser();
        if (!mounted) return;
        setUser(u);
      } catch {
        // ignore
      }
      fetchCommunications();
    })();
    return () => { mounted = false; };
  }, [fetchCommunications]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [communications.length]);

  const handleRefresh = () => {
    fetchCommunications();
  };

  const handleSendCommunication = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: GroupCommunicationItem = {
      _id: tempId,
      type: "group",
      groupId: "sales",
      content,
      sender: user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: (user as any).email } : { _id: "me", firstName: "Me", lastName: "", email: "" },
      createdAt: new Date().toISOString(),
    };
    setCommunications(prev => [...prev, optimistic]);
    setContent("");

    try {
      const token = localStorage.getItem("accessToken");
      const body = {
        type: "group",
        groupId: "sales",
        content: optimistic.content,
        attachments: [] as any[],
      };

      const res = await fetch("http://localhost:5000/api/communications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to send communication");
      }

      await fetchCommunications();
    } catch (err: any) {
      setCommunications(prev => prev.filter(m => m._id !== tempId));
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

  const renderBubble = (comm: GroupCommunicationItem) => {
    const isMine = user && comm.sender && (comm.sender._id === (user as any)._id || comm.sender.email === (user as any).email);
    return (
      <div key={comm._id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
        <div className={`max-w-[70%] px-3 py-2 rounded-lg break-words relative ${isMine ? "bg-[#00aeef] text-white rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none border"}`}>
          {!isMine && (
            <div className="text-xs text-gray-500 mb-1">
              {comm.sender?.firstName} {comm.sender?.lastName}
            </div>
          )}
          <div className="text-sm">{comm.content}</div>
          <div className={`text-[10px] mt-1 ${isMine ? "text-white/70 text-right" : "text-gray-500"}`}>
            {formatTimestamp(comm.createdAt)}
          </div>
          {isMine && comm.readBy?.length && <div className="text-[10px] text-blue-300 text-right">✓✓</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00aeef] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-white">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <MessageCircle className="w-6 h-6" />
          <div>
            <div className="font-semibold">Sales Group</div>
            <div className="text-xs">Group Chat</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-[url('/whatsapp-bg.png')] bg-repeat bg-contain">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-[70%] rounded-lg" />)}
          </div>
        ) : communications.length === 0 ? (
          <div className="text-center text-sm text-gray-600 mt-8">Start the conversation</div>
        ) : (
          <div className="space-y-2">
            {communications.map(renderBubble)}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 bg-white border-t">
        <div className="flex items-center gap-2">
          <Textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="Type a message..." 
            rows={1} 
            className="flex-1 resize-none rounded-full border-gray-300 focus:border-[#00aeef]" 
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendCommunication(); }}}
          />
          <Button 
            onClick={() => handleSendCommunication()} 
            className="bg-[#00aeef] hover:bg-[#0095d5] text-white rounded-full p-2" 
            disabled={isSending}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}