import axios from "axios";
import { api } from "../../../shared/lib/axios";
import { socket } from "../../../shared/lib/socket";
import type {
  AppUser,
  ChatListItem,
  Message,
  TabKey,
} from "../types/chat";
import { sortChats } from "../utils/chatHelpers";

type UseChatActionsParams = {
  user: AppUser | null;
  selectedChat: ChatListItem | null;
  setChats: React.Dispatch<React.SetStateAction<ChatListItem[]>>;
  setSelectedChat: React.Dispatch<React.SetStateAction<ChatListItem | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  setFoundUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  setFindContactQuery: React.Dispatch<React.SetStateAction<string>>;
  setActiveTab: React.Dispatch<React.SetStateAction<TabKey>>;
  loadChatsAndReturn: () => Promise<ChatListItem[]>;
  loadChats: () => Promise<void>;
  loadContacts: () => Promise<void>;
};

export function useChatActions({
  user,
  selectedChat,
  setChats,
  setSelectedChat,
  setMessages,
  setContent,
  setFoundUser,
  setFindContactQuery,
  setActiveTab,
  loadChatsAndReturn,
  loadChats,
  loadContacts,
}: UseChatActionsParams) {
  function updateChatLastMessage(chatId: string, lastMessage: any) {
    setChats((prev) =>
      sortChats(
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                lastMessage,
                lastMessageAt: lastMessage.createdAt,
              }
            : chat
        )
      )
    );

    setSelectedChat((prev) =>
      prev && prev.id === chatId
        ? {
            ...prev,
            lastMessage,
            lastMessageAt: lastMessage.createdAt,
          }
        : prev
    );
  }

  // =============================
  // OPEN CHAT
  // =============================
  async function openChatByUser(targetUserId: string) {
    try {
      const { data } = await api.post("/chats", { targetUserId });

      const chatId = data.id as string;

      const updatedChats = await loadChatsAndReturn();

      const matchedChat =
        updatedChats.find((chat) => chat.id === chatId) || null;

      if (!matchedChat) return;

      setActiveTab("chats");
      setSelectedChat(matchedChat);

      socket.emit("chat:join", matchedChat.id);
      socket.emit("chat:active", { chatId: matchedChat.id });

      const { data: messagesData } = await api.get(
        `/messages/${matchedChat.id}`
      );

      setMessages(messagesData);

      if (user) {
        socket.emit("message:read", {
          chatId: matchedChat.id,
          userId: user.id,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  // =============================
  // SELECT CHAT
  // =============================
  async function handleSelectChat(chat: ChatListItem) {
    try {
      setSelectedChat(chat);

      socket.emit("chat:join", chat.id);
      socket.emit("chat:active", { chatId: chat.id });

      const { data } = await api.get(`/messages/${chat.id}`);

      setMessages(data);

      if (user) {
        socket.emit("message:read", {
          chatId: chat.id,
          userId: user.id,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  // =============================
  // SEND MESSAGE
  // =============================
  function sendMessage(content: string) {
    if (!content.trim() || !selectedChat || !user) return;

    const messageContent = content.trim();
    const now = new Date().toISOString();

    socket.emit("message:send", {
      chatId: selectedChat.id,
      senderId: user.id,
      content: messageContent,
    });

    setContent("");

    socket.emit("typing:stop", {
      chatId: selectedChat.id,
      userId: user.id,
    });

    updateChatLastMessage(selectedChat.id, {
      id: `preview-${Date.now()}`,
      content: messageContent,
      createdAt: now,
      senderId: user.id,
    });
  }

  function handleTyping(value: string) {
    setContent(value);

    if (!selectedChat || !user) return;

    socket.emit(value.trim() ? "typing:start" : "typing:stop", {
      chatId: selectedChat.id,
      userId: user.id,
    });
  }

  function handleStopTyping() {
    if (!selectedChat || !user) return;

    socket.emit("typing:stop", {
      chatId: selectedChat.id,
      userId: user.id,
    });
  }

  // 🔥 IMPORTANTE
  function handleBackToList() {
    handleStopTyping();
    socket.emit("chat:inactive");
    setSelectedChat(null);
    setMessages([]);
    setContent("");
  }

  async function handleSearchUser(query: string) {
    try {
      if (!query.trim()) {
        setFoundUser(null);
        return;
      }

      const { data } = await api.get("/users/search", {
        params: { query: query.trim() },
      });

      setFoundUser(data);
    } catch {
      setFoundUser(null);
    }
  }

  async function handleAddContact(contactUserId: string) {
    try {
      await api.post("/contacts", { contactUserId });

      setFindContactQuery("");
      setFoundUser(null);

      await loadContacts();
      await loadChats();
    } catch (error) {
      console.error(error);
    }
  }

  return {
    openChatByUser,
    handleSelectChat,
    sendMessage,
    handleTyping,
    handleStopTyping,
    handleBackToList,
    handleSearchUser,
    handleAddContact,
  };
}