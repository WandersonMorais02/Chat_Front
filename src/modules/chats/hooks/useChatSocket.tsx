import { useEffect, useRef } from "react";
import { socket } from "../../../shared/lib/socket";
import type {
  AppUser,
  ChatListItem,
  Contact,
  Message,
  TypingState,
} from "../types/chat";
import { sortChats } from "../utils/chatHelpers";

type UseChatSocketParams = {
  user: AppUser | null;
  chats: ChatListItem[];
  selectedChat: ChatListItem | null;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setChats: React.Dispatch<React.SetStateAction<ChatListItem[]>>;
  setSelectedChat: React.Dispatch<React.SetStateAction<ChatListItem | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setTypingUsers: React.Dispatch<React.SetStateAction<TypingState>>;
};

export function useChatSocket({
  user,
  chats,
  selectedChat,
  setContacts,
  setChats,
  setSelectedChat,
  setMessages,
  setTypingUsers,
}: UseChatSocketParams) {
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const selectedChatRef = useRef<ChatListItem | null>(selectedChat);
  const chatsRef = useRef<ChatListItem[]>(chats);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user:online", user.id);

    // PRESENCE
    const handlePresenceUpdate = ({
      userId,
      isOnline,
      lastSeen,
    }: {
      userId: string;
      isOnline: boolean;
      lastSeen: string;
    }) => {
      setContacts((prev) =>
        prev.map((contact) =>
          contact.contactUser.id === userId
            ? {
                ...contact,
                contactUser: {
                  ...contact.contactUser,
                  isOnline,
                  lastSeen,
                },
              }
            : contact
        )
      );

      setChats((prev) =>
        prev.map((chat) =>
          chat.user?.id === userId
            ? {
                ...chat,
                user: chat.user
                  ? { ...chat.user, isOnline, lastSeen }
                  : null,
              }
            : chat
        )
      );
    };

    // MESSAGE NEW
    const handleMessageNew = (message: Message) => {
      if (selectedChatRef.current?.id === message.chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;

          return [...prev, message];
        });
      }

      setTypingUsers((prev) => ({
        ...prev,
        [message.sender.id]: {
          isTyping: false,
          chatId: message.chatId,
        },
      }));
    };

    // CHAT UPDATE
    const handleChatUpdate = ({
      chatId,
      message,
    }: {
      chatId: string;
      message: Message;
    }) => {
      setChats((prev) =>
        sortChats(
          prev.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  lastMessage: {
                    id: message.id,
                    content: message.content,
                    createdAt: message.createdAt,
                    senderId: message.senderId,
                  },
                  lastMessageAt: message.createdAt,
                }
              : chat
          )
        )
      );

      setSelectedChat((prev) =>
        prev && prev.id === chatId
          ? {
              ...prev,
              lastMessage: {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.senderId,
              },
              lastMessageAt: message.createdAt,
            }
          : prev
      );
    };

    // READ UPDATE
    const handleMessageReadUpdate = ({
      chatId,
      userId,
    }: {
      chatId: string;
      userId: string;
    }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.chatId !== chatId) return msg;

          return {
            ...msg,
            receipts: msg.receipts?.map((r) =>
              r.userId === userId
                ? {
                    ...r,
                    readAt: r.readAt || new Date().toISOString(),
                  }
                : r
            ),
          };
        })
      );
    };

    // TYPING
    const handleTypingUpdate = ({
      chatId,
      userId,
      isTyping,
    }: {
      chatId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (typingTimeouts.current[userId]) {
        clearTimeout(typingTimeouts.current[userId]);
      }

      setTypingUsers((prev) => ({
        ...prev,
        [userId]: {
          isTyping,
          chatId,
        },
      }));

      if (isTyping) {
        typingTimeouts.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => ({
            ...prev,
            [userId]: {
              isTyping: false,
              chatId,
            },
          }));
        }, 1800);
      }
    };

    // EVENTS
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("message:new", handleMessageNew);
    socket.on("chat:update", handleChatUpdate);
    socket.on("message:read:update", handleMessageReadUpdate);
    socket.on("typing:update", handleTypingUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("message:new", handleMessageNew);
      socket.off("chat:update", handleChatUpdate);
      socket.off("message:read:update", handleMessageReadUpdate);
      socket.off("typing:update", handleTypingUpdate);

      Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, [
    user,
    setContacts,
    setChats,
    setMessages,
    setSelectedChat,
    setTypingUsers,
  ]);
}