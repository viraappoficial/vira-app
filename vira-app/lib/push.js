import { Platform } from 'react-native';
import { supabase } from './supabase';

// Chave pública VAPID — segura pra expor no cliente (é assim que Web Push funciona).
export const VAPID_PUBLIC_KEY =
  'BBBFNEY1ocZOls-Ix1ADMqywBQ2-M0QSG8h2fHgEBMzHhZTBcc-EzKwMU632KETdGR3kHQrD1Ne2sOEKyTmFk1E';

export function pushSuportado() {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function statusPermissao() {
  if (!pushSuportado()) return 'indisponivel';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registrarServiceWorker() {
  if (!pushSuportado()) return null;
  return navigator.serviceWorker.register('/sw.js');
}

export async function ativarNotificacoes(usuarioId) {
  if (!pushSuportado()) throw new Error('Seu navegador não suporta notificações push.');

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') throw new Error('Permissão de notificação negada.');

  const registration = (await navigator.serviceWorker.getRegistration()) || (await registrarServiceWorker());
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const json = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      usuario_id: usuarioId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;

  return true;
}

export async function desativarNotificacoes() {
  if (!pushSuportado()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
}

export async function notificacoesAtivas() {
  if (!pushSuportado()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return !!subscription;
}
