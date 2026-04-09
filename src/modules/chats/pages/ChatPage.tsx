import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ChatWindow } from "../components/ChatWindow";
import { ChatsSidebar } from "../components/ChatsSidebar";
import { ContactsSidebar } from "../components/ContactsSidebar";
import { ProfileSidebar } from "../components/ProfileSidebar";
import { SidebarHeader } from "../components/SidebarHeader";
import { useChatActions } from "../hooks/useChatActions";
import { useChatData } from "../hooks/useChatData";
import { useChatSocket } from "../hooks/useChatSocket";
import type {
  AppUser,
  ChatListItem,
  Message,
  TabKey,
  TypingState,
} from "../types/chat";

export function ChatPage() {
  const { user, logout, refreshMe } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("chats");
  const [chatSearch, setChatSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [findContactQuery, setFindContactQuery] = useState("");
  const [foundUser, setFoundUser] = useState<AppUser | null>(null);

  const [selectedChat, setSelectedChat] = useState<ChatListItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingState>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const apiUrl = useMemo(() => "http://localhost:3333", []);

  const {
    contacts,
    setContacts,
    chats,
    setChats,
    loadChats,
    loadChatsAndReturn,
    loadContacts,
  } = useChatData();

  useChatSocket({
    user,
    chats,
    selectedChat,
    setContacts,
    setChats,
    setSelectedChat,
    setMessages,
    setTypingUsers,
  });

  const {
    openChatByUser,
    handleSelectChat,
    sendMessage,
    handleTyping,
    handleStopTyping,
    handleBackToList,
    handleSearchUser,
    handleAddContact,
  } = useChatActions({
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
  });

  const selectedTargetUser = selectedChat?.user ?? null;

  const isTypingInCurrentChat =
    !!selectedTargetUser &&
    !!selectedChat &&
    typingUsers[selectedTargetUser.id]?.isTyping === true &&
    typingUsers[selectedTargetUser.id]?.chatId === selectedChat.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isTypingInCurrentChat]);

  function renderSidebarContent() {
    if (activeTab === "chats") {
      return (
        <ChatsSidebar
          chats={chats}
          selectedChat={selectedChat}
          typingUsers={typingUsers}
          chatSearch={chatSearch}
          setChatSearch={setChatSearch}
          onSelectChat={handleSelectChat}
          apiUrl={apiUrl}
          currentUserId={user?.id}
        />
      );
    }

    if (activeTab === "contacts") {
      return (
        <ContactsSidebar
          contacts={contacts}
          contactSearch={contactSearch}
          setContactSearch={setContactSearch}
          findContactQuery={findContactQuery}
          setFindContactQuery={setFindContactQuery}
          foundUser={foundUser}
          onSearchUser={handleSearchUser}
          onAddContact={handleAddContact}
          onOpenChatByUser={openChatByUser}
          apiUrl={apiUrl}
        />
      );
    }

    return (
      <ProfileSidebar
        user={user}
        refreshMe={refreshMe}
        logout={logout}
        apiUrl={apiUrl}
      />
    );
  }

  return (
    <div className="chat-layout">
      <aside
        className={`sidebar ${
          selectedChat ? "sidebar-hidden-mobile" : ""
        }`}
      >
        <SidebarHeader user={user} onLogout={logout} />
        {renderSidebarContent()}
      </aside>

      <main
        className={`chat-main ${
          selectedChat ? "chat-main-active-mobile" : ""
        }`}
      >
        {selectedChat ? (
          <ChatWindow
            selectedChat={selectedChat}
            selectedTargetUser={selectedTargetUser}
            user={user}
            messages={messages}
            content={content}
            isTypingInCurrentChat={isTypingInCurrentChat}
            apiUrl={apiUrl}
            messagesEndRef={messagesEndRef}
            onBack={handleBackToList}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            onSendMessage={() => sendMessage(content)}
          />
        ) : (
          <div className="empty-chat">
            <h2>
              {activeTab === "profile"
                ? "Seu perfil"
                : activeTab === "contacts"
                ? "Selecione ou adicione um contato"
                : "Selecione uma conversa"}
            </h2>
          </div>
        )}
      </main>

      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={activeTab === "chats" ? "active" : ""}
          onClick={() => {
            setActiveTab("chats");
            setSelectedChat(null);
          }}
        >
          Chats
        </button>

        <button
          type="button"
          className={activeTab === "contacts" ? "active" : ""}
          onClick={() => {
            setActiveTab("contacts");
            setSelectedChat(null);
          }}
        >
          Contatos
        </button>

        <button
          type="button"
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => {
            setActiveTab("profile");
            setSelectedChat(null);
          }}
        >
          Perfil
        </button>
      </nav>
    </div>
  );
}