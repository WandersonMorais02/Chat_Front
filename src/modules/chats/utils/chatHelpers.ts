import type { AppUser, ChatListItem } from "../types/chat";

export function formatTime(date?: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDisplayName(
  user?: AppUser | null,
  fallback = "Usuário"
) {
  return user?.name?.trim() || fallback;
}

export function sortChats(list: ChatListItem[]) {
  return [...list].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}