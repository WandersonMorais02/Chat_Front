import type { ChatListItem, TypingState } from "../types/chat";
import { formatTime } from "../utils/chatHelpers";

type ChatsSidebarProps = {
  chats: ChatListItem[];
  selectedChat: ChatListItem | null;
  typingUsers: TypingState;
  chatSearch: string;
  setChatSearch: (value: string) => void;
  onSelectChat: (chat: ChatListItem) => void;
  apiUrl: string;
  currentUserId?: string;
};

export function ChatsSidebar({
  chats,
  selectedChat,
  typingUsers,
  chatSearch,
  setChatSearch,
  onSelectChat,
  apiUrl,
  currentUserId,
}: ChatsSidebarProps) {
  const filteredChats = chats.filter((chat) => {
    const name = chat.name?.toLowerCase() || "";
    const lastMessage = chat.lastMessage?.content?.toLowerCase() || "";
    const query = chatSearch.toLowerCase();

    return name.includes(query) || lastMessage.includes(query);
  });

  return (
    <>
      <div className="list-topbar">
        <h3>Conversas</h3>
        <input
          type="text"
          placeholder="Buscar conversa"
          value={chatSearch}
          onChange={(e) => setChatSearch(e.target.value)}
        />
      </div>

      <div className="user-list">
        {filteredChats.map((chat) => {
          const isActive = selectedChat?.id === chat.id;
          const targetUserId = chat.user?.id;

          const isTyping =
            !!targetUserId &&
            typingUsers[targetUserId]?.isTyping === true &&
            typingUsers[targetUserId]?.chatId === chat.id;

          const preview = isTyping
            ? "digitando..."
            : chat.lastMessage
            ? `${chat.lastMessage.senderId === currentUserId ? "Você: " : ""}${chat.lastMessage.content}`
            : "Sem mensagens ainda";

          return (
            <button
              key={chat.id}
              className={`user-item ${isActive ? "user-item-active" : ""}`}
              onClick={() => onSelectChat(chat)}
              type="button"
            >
              <img
                src={
                  chat.user?.avatar
                    ? `${apiUrl}${chat.user.avatar}`
                    : "https://via.placeholder.com/48"
                }
                alt={chat.name}
              />

              <div className="user-item-body">
                <div className="user-item-row">
                  <strong>{chat.name}</strong>
                  <small>{formatTime(chat.lastMessageAt)}</small>
                </div>

                <div className="user-item-row">
                  <span className={isTyping ? "typing-text" : ""}>
                    {preview}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {filteredChats.length === 0 && (
          <div className="empty-list-state">
            Nenhuma conversa encontrada
          </div>
        )}
      </div>
    </>
  );
}