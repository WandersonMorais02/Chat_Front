import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../shared/lib/axios";
import {
  syncPushSubscriptionWithApi,
  unsubscribeFromPush,
} from "../../../shared/lib/push";
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // 🔔 PUSH
  const [pushLoading, setPushLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // 🔁 sincroniza dados
  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  // 🔎 verifica se já tem push ativo
  useEffect(() => {
    async function checkPush() {
      if (!("serviceWorker" in navigator)) return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      setPushEnabled(!!sub);
    }

    checkPush();
  }, []);

  // 🧠 preview imagem
  const previewUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (user?.avatar) return `${apiUrl}${user.avatar}`;
    return "https://via.placeholder.com/96";
  }, [avatarFile, user?.avatar, apiUrl]);

  useEffect(() => {
    return () => {
      if (avatarFile) URL.revokeObjectURL(previewUrl);
    };
  }, [avatarFile, previewUrl]);

  function openModal() {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setAvatarFile(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setAvatarFile(null);
  }

  // =========================
  // 🔔 ATIVAR PUSH
  // =========================
  async function handleEnablePush() {
    try {
      setPushLoading(true);

      await syncPushSubscriptionWithApi();

      setPushEnabled(true);
      alert("🔔 Notificações ativadas!");
    } catch (error: any) {
      alert(error?.message || "Erro ao ativar notificações");
    } finally {
      setPushLoading(false);
    }
  }

  // =========================
  // 🔕 DESATIVAR PUSH
  // =========================
  async function handleDisablePush() {
    try {
      setPushLoading(true);

      await unsubscribeFromPush();

      setPushEnabled(false);
      alert("🔕 Notificações desativadas");
    } catch (error: any) {
      alert(error?.message || "Erro ao desativar notificações");
    } finally {
      setPushLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Nome é obrigatório");
      return;
    }

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
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Erro ao atualizar perfil");
      } else {
        alert("Erro ao atualizar perfil");
      }
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
            <button onClick={openModal}>Editar perfil</button>

            <button onClick={refreshMe}>Atualizar perfil</button>

            {/* 🔔 PUSH BUTTON */}
            {!pushEnabled ? (
              <button
                onClick={handleEnablePush}
                disabled={pushLoading}
              >
                {pushLoading ? "Ativando..." : "🔔 Ativar notificações"}
              </button>
            ) : (
              <button
                onClick={handleDisablePush}
                disabled={pushLoading}
              >
                {pushLoading ? "Desativando..." : "🔕 Desativar notificações"}
              </button>
            )}

            <button onClick={logout}>Sair</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="profile-modal-overlay" onClick={closeModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Editar perfil</h3>
              <button onClick={closeModal} disabled={saving}>
                ✕
              </button>
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-avatar-edit">
                <img src={previewUrl} />

                <label>
                  Trocar foto
                  <input
                    type="file"
                    accept="image/*"
                    disabled={saving}
                    onChange={(e) =>
                      setAvatarFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
              />

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefone"
              />

              <div>
                <button type="button" onClick={closeModal}>
                  Cancelar
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}