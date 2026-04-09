import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../shared/lib/axios";
import type { AppUser } from "../types/chat";
import { getDisplayName } from "../utils/chatHelpers";

type ProfileSidebarProps = {
  user: AppUser | null;
  refreshMe: () => void;
  logout: () => void;
  apiUrl: string;
};

export function ProfileSidebar({
  user,
  refreshMe,
  logout,
  apiUrl,
}: ProfileSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  const previewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    if (user?.avatar) {
      return `${apiUrl}${user.avatar}`;
    }

    return "https://via.placeholder.com/96";
  }, [avatarFile, user?.avatar, apiUrl]);

  function openModal() {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setAvatarFile(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setAvatarFile(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await api.put("/users/me", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await refreshMe();
      closeModal();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);

      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Erro ao atualizar perfil");
        return;
      }

      alert("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="profile-panel">
        <div className="profile-card">
          <img
            className="profile-avatar"
            src={
              user?.avatar
                ? `${apiUrl}${user.avatar}`
                : "https://via.placeholder.com/96"
            }
            alt={getDisplayName(user)}
          />

          <h3>{getDisplayName(user, "Usuário")}</h3>
          <p>{user?.email}</p>

          <div className="profile-grid">
            <div className="profile-item">
              <span>Código</span>
              <strong>{user?.userCode || "-"}</strong>
            </div>

            <div className="profile-item">
              <span>Telefone</span>
              <strong>{user?.phone || "-"}</strong>
            </div>

            <div className="profile-item">
              <span>Status</span>
              <strong>{user?.isOnline ? "Online" : "Offline"}</strong>
            </div>
          </div>

          <div className="profile-actions">
            <button type="button" onClick={openModal}>
              Editar perfil
            </button>

            <button type="button" onClick={refreshMe}>
              Atualizar perfil
            </button>

            <button type="button" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="profile-modal-overlay" onClick={closeModal}>
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header">
              <h3>Editar perfil</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-avatar-edit">
                <img src={previewUrl} alt="Preview do avatar" />

                <label className="profile-file-label">
                  Trocar foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setAvatarFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>

              <div className="profile-form-group">
                <label>Nome</label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="profile-form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  placeholder="Seu telefone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="profile-form-actions">
                <button type="button" onClick={closeModal}>
                  Cancelar
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}