export type AppUser = {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  userCode?: string;
  avatar?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
};

export type Contact = {
  id: string;
  nickname?: string | null;
  contactUser: AppUser;
};

export type ChatListItem = {
  id: string;
  name: string;
  isGroup: boolean;
  user: AppUser | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  lastMessageAt?: string | null;
};

export type MessageReceipt = {
  id: string;
  userId: string;
  deliveredAt?: string | null;
  readAt?: string | null;
};

export type Message = {
  id: string;
  chatId: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatar?: string | null;
  };
  receipts?: MessageReceipt[];
};

export type TypingState = Record<
  string,
  {
    isTyping: boolean;
    chatId?: string;
  }
>;

export type TabKey = "chats" | "contacts" | "profile";