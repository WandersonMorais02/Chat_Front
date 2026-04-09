import type { AppUser } from "../types/chat";
import { getDisplayName } from "../utils/chatHelpers";

type SidebarHeaderProps = {
  user: AppUser | null;
  onLogout: () => void;
};

export function SidebarHeader({ user, onLogout }: SidebarHeaderProps) {
  return (
    <div className="sidebar-header">
      <div className="sidebar-user">
        <h2>{getDisplayName(user, "Minha conta")}</h2>
        <span>{user?.email}</span>
      </div>

      <button onClick={onLogout} type="button">
        Sair
      </button>
    </div>
  );
}