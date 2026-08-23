import { supabase } from './supabase';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!import.meta.env.VITE_VAPID_PUBLIC_KEY;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/sw.js');
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Requests notification permission, subscribes via the browser's push service,
 * and stores the subscription so the Edge Function can find it. */
export async function enablePushNotifications(userId: string): Promise<void> {
  if (!pushSupported()) throw new Error('Push notifications are not supported in this browser.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  const registration = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY!),
  });

  const json = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth_key: json.keys!.auth,
    },
    { onConflict: 'endpoint' },
  );
  if (error) throw new Error(error.message);
}

export async function disablePushNotifications(): Promise<void> {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}
