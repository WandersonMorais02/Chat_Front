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
  function updateChatLastMessage(
    chatId: string,
    lastMessage: {
      id: string;
      content: string;
      createdAt: string;
      senderId: string;
    }
  ) {
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

      const { data: messagesData } = await api.get(
        `/messages/${matchedChat.id}`
      );

      const loadedMessages = messagesData as Message[];

      setMessages(loadedMessages);

      // marcar como lido
      if (user) {
        socket.emit("message:read", {
          chatId: matchedChat.id,
          userId: user.id,
        });
      }
    } catch (error) {
      console.error("Erro ao abrir chat:", error);

      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Erro ao abrir conversa");
      }
    }
  }

  // =============================
  // SELECT CHAT
  // =============================
  async function handleSelectChat(chat: ChatListItem) {
    try {
      setSelectedChat(chat);

      socket.emit("chat:join", chat.id);

      const { data } = await api.get(`/messages/${chat.id}`);

      const loadedMessages = data as Message[];

      setMessages(loadedMessages);

      if (user) {
        socket.emit("message:read", {
          chatId: chat.id,
          userId: user.id,
        });
      }
    } catch (error) {
      console.error("Erro ao abrir chat:", error);
    }
  }

  // =============================
  // 🔥 SEND MESSAGE (SEM DUPLICAR)
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

    // 🔥 só atualiza sidebar (não adiciona mensagem!)
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

  function handleBackToList() {
    handleStopTyping();
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
    } catch (error) {
      setFoundUser(null);

      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        alert(error.response?.data?.message || "Erro ao buscar usuário");
      }
    }
  }

  async function handleAddContact(contactUserId: string) {
    try {
      await api.post("/contacts", { contactUserId });

      setFindContactQuery("");
      setFoundUser(null);

      await loadContacts();
      await loadChats();

      alert("Contato adicionado com sucesso");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Erro ao adicionar contato");
        return;
      }

      alert("Erro ao adicionar contato");
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