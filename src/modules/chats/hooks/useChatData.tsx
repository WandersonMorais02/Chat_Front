import { useEffect, useState } from "react";
import { api } from "../../../shared/lib/axios";
import type { ChatListItem, Contact } from "../types/chat";
import { sortChats } from "../utils/chatHelpers";

export function useChatData() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);

  async function loadContacts() {
    try {
      const { data } = await api.get("/contacts");
      setContacts(data);
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
    }
  }

  async function loadChats() {
    try {
      const { data } = await api.get("/chats");
      setChats(sortChats(data));
    } catch (error) {
      console.error("Erro ao carregar chats:", error);
    }
  }

  async function loadChatsAndReturn() {
    try {
      const { data } = await api.get("/chats");
      const sorted = sortChats(data);
      setChats(sorted);
      return sorted;
    } catch (error) {
      console.error("Erro ao carregar chats:", error);
      return [];
    }
  }

  useEffect(() => {
    loadContacts();
    loadChats();
  }, []);

  return {
    contacts,
    setContacts,
    chats,
    setChats,
    loadContacts,
    loadChats,
    loadChatsAndReturn,
  };
}