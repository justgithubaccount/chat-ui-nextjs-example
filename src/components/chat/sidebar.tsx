"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "../theme-toggle";
import { signOut, useSession } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { chats, currentChatId, addChat, deleteChat, setChats } = useChatStore();

  useEffect(() => {
    // Load chats from API
    const loadChats = async () => {
      try {
        const response = await fetch("/api/chats");
        if (response.ok) {
          const data = await response.json();
          setChats(data);
        }
      } catch (error) {
        console.error("Failed to load chats:", error);
      }
    };

    if (session) {
      loadChats();
    }
  }, [session, setChats]);

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (response.ok) {
        const chat = await response.json();
        addChat(chat);
        router.push(`/chat/${chat.id}`);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        deleteChat(chatId);
        if (currentChatId === chatId) {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  return (
    <div className="w-64 border-r bg-muted/20 flex flex-col h-screen">
      <div className="p-4 border-b">
        <Button onClick={handleNewChat} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className={`flex items-center gap-2 p-3 rounded-lg hover:bg-accent group mb-1 ${
              pathname === `/chat/${chat.id}` ? "bg-accent" : ""
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{chat.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(new Date(chat.updatedAt))}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={(e) => handleDeleteChat(chat.id, e)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t space-y-2">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          {session && (
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          )}
        </div>
        {session?.user && (
          <div className="text-xs text-muted-foreground">
            {session.user.email}
          </div>
        )}
      </div>
    </div>
  );
}
