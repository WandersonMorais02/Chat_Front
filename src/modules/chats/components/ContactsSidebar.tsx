import type { AppUser, Contact } from "../types/chat";
import { getDisplayName } from "../utils/chatHelpers";

type ContactsSidebarProps = {
  contacts: Contact[];
  contactSearch: string;
  setContactSearch: (value: string) => void;
  findContactQuery: string;
  setFindContactQuery: (value: string) => void;
  foundUser: AppUser | null;
  onSearchUser: (query: string) => void;
  onAddContact: (contactUserId: string) => void;
  onOpenChatByUser: (targetUserId: string) => void;
  apiUrl: string;
};

export function ContactsSidebar({
  contacts,
  contactSearch,
  setContactSearch,
  findContactQuery,
  setFindContactQuery,
  foundUser,
  onSearchUser,
  onAddContact,
  onOpenChatByUser,
  apiUrl,
}: ContactsSidebarProps) {
  const filteredContacts = contacts.filter((contact) => {
    const baseName = getDisplayName(contact.contactUser).toLowerCase();
    const nickname = contact.nickname?.toLowerCase() || "";
    const code = contact.contactUser.userCode?.toLowerCase() || "";
    const phone = contact.contactUser.phone?.toLowerCase() || "";
    const query = contactSearch.toLowerCase();

    return (
      baseName.includes(query) ||
      nickname.includes(query) ||
      code.includes(query) ||
      phone.includes(query)
    );
  });

  return (
    <>
      <div className="list-topbar">
        <h3>Contatos</h3>
        <input
          type="text"
          placeholder="Buscar contato"
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
        />
      </div>

      <div className="contact-search-box">
        <input
          type="text"
          placeholder="Buscar por telefone ou código"
          value={findContactQuery}
          onChange={(e) => setFindContactQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearchUser(findContactQuery);
            }
          }}
        />
        <button type="button" onClick={() => onSearchUser(findContactQuery)}>
          Buscar
        </button>
      </div>

      {foundUser && (
        <div className="found-user-card">
          <div className="found-user-main">
            <img
              src={
                foundUser.avatar
                  ? `${apiUrl}${foundUser.avatar}`
                  : "https://via.placeholder.com/48"
              }
              alt={getDisplayName(foundUser)}
            />

            <div>
              <strong>{getDisplayName(foundUser)}</strong>
              <span>{foundUser.userCode}</span>
              <span>{foundUser.phone || "Sem telefone"}</span>
            </div>
          </div>

          <button type="button" onClick={() => onAddContact(foundUser.id)}>
            Adicionar
          </button>
        </div>
      )}

      <div className="user-list">
        {filteredContacts.map((contact) => (
          <button
            key={contact.id}
            className="user-item"
            type="button"
            onClick={() => onOpenChatByUser(contact.contactUser.id)}
          >
            <img
              src={
                contact.contactUser.avatar
                  ? `${apiUrl}${contact.contactUser.avatar}`
                  : "https://via.placeholder.com/48"
              }
              alt={getDisplayName(contact.contactUser)}
            />

            <div className="user-item-body">
              <div className="user-item-row">
                <strong>
                  {contact.nickname || getDisplayName(contact.contactUser)}
                </strong>
              </div>

              <div className="user-item-row">
                <span>
                  {contact.contactUser.userCode ||
                    contact.contactUser.phone ||
                    "Contato"}
                </span>
              </div>
            </div>
          </button>
        ))}

        {filteredContacts.length === 0 && (
          <div className="empty-list-state">Nenhum contato encontrado</div>
        )}
      </div>
    </>
  );
}