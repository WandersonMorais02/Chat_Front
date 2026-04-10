import { api } from "./axios";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("Esse navegador não suporta notificações.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Permissão de notificação não concedida.");
  }

  return permission;
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service worker não suportado.");
  }

  if (!("PushManager" in window)) {
    throw new Error("Push API não suportada.");
  }

  const registration = await navigator.serviceWorker.ready;

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    return existingSubscription;
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    throw new Error("VITE_VAPID_PUBLIC_KEY não configurada.");
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  return subscription;
}

export async function syncPushSubscriptionWithApi() {
  await requestNotificationPermission();

  const subscription = await subscribeToPush();

  await api.post("/push/subscriptions", {
    subscription,
  });

  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await api.delete("/push/subscriptions", {
      data: {
        endpoint: subscription.endpoint,
      },
    });

    await subscription.unsubscribe();
  }
}