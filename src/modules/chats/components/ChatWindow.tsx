import type { AppUser, ChatListItem, Message } from "../types/chat";
import { getDisplayName } from "../utils/chatHelpers";

type ChatWindowProps = {
  selectedChat: ChatListItem | null;
  selectedTargetUser: AppUser | null;
  user: AppUser | null;
  messages: Message[];
  content: string;
  isTypingInCurrentChat: boolean;
  apiUrl: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onTyping: (value: string) => void;
  onStopTyping: () => void;
  onSendMessage: () => void;
};

function formatMessageTime(date?: string | null) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMessageStatus(message: Message, currentUserId?: string) {
  if (!currentUserId || message.senderId !== currentUserId) {
    return null;
  }

  const receipts = message.receipts ?? [];

  if (receipts.length === 0) {
    return {
      text: "✓",
      className: "message-status sent",
    };
  }

  const hasRead = receipts.some((receipt) => Boolean(receipt.readAt));
  const hasDelivered = receipts.some((receipt) => Boolean(receipt.deliveredAt));

  if (hasRead) {
    return {
      text: "✓✓",
      className: "message-status read",
    };
  }

  if (hasDelivered) {
    return {
      text: "✓✓",
      className: "message-status delivered",
    };
  }

  return {
    text: "✓",
    className: "message-status sent",
  };
}

export function ChatWindow({
  selectedChat,
  selectedTargetUser,
  user,
  messages,
  content,
  isTypingInCurrentChat,
  apiUrl,
  messagesEndRef,
  onBack,
  onTyping,
  onStopTyping,
  onSendMessage,
}: ChatWindowProps) {
  if (!selectedChat) {
    return null;
  }

  const displayName = selectedTargetUser
    ? getDisplayName(selectedTargetUser, selectedChat.name)
    : selectedChat.name || "Conversa";

  const avatarSrc = selectedTargetUser?.avatar
    ? `${apiUrl}${selectedTargetUser.avatar}`
    : "https://via.placeholder.com/40";

  const statusText = isTypingInCurrentChat
    ? "digitando..."
    : selectedTargetUser
    ? selectedTargetUser.isOnline
      ? "online"
      : "offline"
    : "";

  return (
    <>
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="back-button" onClick={onBack} type="button">
            ←
          </button>

          <img
            className="chat-header-avatar"
            src={avatarSrc}
            alt={displayName}
          />

          <div className="chat-header-meta">
            <h3>{displayName}</h3>
            <span className={isTypingInCurrentChat ? "typing-text" : ""}>
              {statusText}
            </span>
          </div>
        </div>
      </header>

      <section className="messages">
        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          const status = getMessageStatus(message, user?.id);

          return (
            <div
              key={message.id}
              className={isMine ? "message mine" : "message"}
            >
              <p>{message.content}</p>

              <div className="message-meta">
                <span className="message-time">
                  {formatMessageTime(message.createdAt)}
                </span>

                {status && (
                  <span className={status.className}>{status.text}</span>
                )}
              </div>
            </div>
          );
        })}

        {isTypingInCurrentChat && (
          <div className="message typing-message">
            <div className="typing-bubbles" aria-label="digitando">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      <footer className="chat-input">
        <input
          type="text"
          placeholder="Digite uma mensagem"
          value={content}
          onChange={(e) => onTyping(e.target.value)}
          onBlur={onStopTyping}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;

            if (e.key === "Enter") {
              e.preventDefault();
              onSendMessage();
            }
          }}
        />

        <button onClick={onSendMessage} type="button">
          Enviar
        </button>
      </footer>
    </>
  );
}