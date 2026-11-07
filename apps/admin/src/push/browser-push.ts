import { BASE_ADMIN_API_URL } from "@hacado/api-sdk/admin/utils";
import { urlBase64ToUint8Array } from "./url-base64-to-uint8-array";

const SW_PATH = "/sw.js";
const PUSH_NAVIGATE_MESSAGE = "hacado:push-navigate";
export const PUSH_BOUND_MEMBER_KEY = "hacado.push.boundMemberId";

let pushNavigateListenerBound = false;

function navigateFromPushMessage(url: string): void {
  let next: URL;

  try {
    next = new URL(url, window.location.origin);
  } catch {
    return;
  }

  if (next.origin !== window.location.origin) {
    return;
  }

  const target = `${next.pathname}${next.search}${next.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (target === current) {
    return;
  }

  window.location.assign(target);
}

type LaunchQueue = {
  setConsumer: (consumer: (params: { targetURL?: string }) => void) => void;
};

/** Focused open clients receive this from the service worker on notification click. */
export function listenForPushNotificationNavigation(): void {
  if (typeof window === "undefined" || pushNavigateListenerBound) {
    return;
  }

  pushNavigateListenerBound = true;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const data = event.data as { type?: string; url?: string } | null;

      if (
        !data ||
        data.type !== PUSH_NAVIGATE_MESSAGE ||
        typeof data.url !== "string"
      ) {
        return;
      }

      navigateFromPushMessage(data.url);
    });
  }

  // Chromium: when an installed PWA captures an in-scope link (email, etc.),
  // Launch Handler may deliver the target URL here instead of a full reload.
  const launchQueue = (window as Window & { launchQueue?: LaunchQueue })
    .launchQueue;

  if (launchQueue?.setConsumer) {
    launchQueue.setConsumer((launchParams) => {
      if (typeof launchParams.targetURL === "string") {
        navigateFromPushMessage(launchParams.targetURL);
      }
    });
  }
}

export function isBrowserPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** True on iPhone / iPad (Safari, Chrome, and other WebKit browsers). */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;

  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** @deprecated Prefer isIosDevice — Chrome on iOS also needs Home Screen install. */
export function isIosSafari(): boolean {
  return isIosDevice();
}

/** iOS browsers that are not running as an installed Home Screen web app. */
export function needsIosHomeScreenInstall(): boolean {
  return isIosDevice() && !isStandaloneDisplayMode();
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari legacy
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isBrowserPushSupported()) {
    return null;
  }

  listenForPushNotificationNavigation();

  return navigator.serviceWorker.register(SW_PATH);
}

async function getVapidPublicKey(): Promise<string> {
  const response = await fetch(`${BASE_ADMIN_API_URL}/push/vapid-public-key`);
  if (!response.ok) {
    throw new Error("VAPID public key unavailable");
  }

  const data = (await response.json()) as { publicKey: string };
  return data.publicKey;
}

function subscriptionToJson(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Push subscription is missing endpoint or keys");
  }

  return {
    endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh,
      auth,
    },
  };
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isBrowserPushSupported()) {
    return null;
  }

  await registerPushServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function getServerPushStatus(endpoint: string): Promise<boolean> {
  const response = await fetch(
    `${BASE_ADMIN_API_URL}/push/status?endpoint=${encodeURIComponent(endpoint)}`,
  );

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { enabled: boolean };
  return data.enabled;
}

export async function sendTestBrowserPush(): Promise<void> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) {
    throw new Error("No push subscription");
  }

  const response = await fetch(`${BASE_ADMIN_API_URL}/push/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  if (!response.ok) {
    throw new Error("Failed to send test push notification");
  }
}

export async function enableBrowserPush(): Promise<PushSubscription> {
  if (!isBrowserPushSupported()) {
    throw new Error("Browser push is not supported");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  await registerPushServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  const publicKey = await getVapidPublicKey();

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const response = await fetch(`${BASE_ADMIN_API_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscriptionToJson(subscription)),
  });

  if (!response.ok) {
    throw new Error("Failed to save push subscription");
  }

  return subscription;
}

export async function disableBrowserPush(): Promise<void> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) {
    return;
  }

  await fetch(`${BASE_ADMIN_API_URL}/push/subscribe`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined);

  await subscription.unsubscribe().catch(() => undefined);
  window.localStorage.removeItem(PUSH_BOUND_MEMBER_KEY);
}

/**
 * Rebind (or recreate) the browser push subscription for the logged-in member.
 * Runs when Notification.permission is already granted so logout/switch-user
 * continues delivering to the current member without another permission prompt.
 */
export async function rebindBrowserPushIfEnabled(): Promise<void> {
  if (!isBrowserPushSupported()) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  await registerPushServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const publicKey = await getVapidPublicKey();
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const response = await fetch(`${BASE_ADMIN_API_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscriptionToJson(subscription)),
  });

  if (!response.ok) {
    throw new Error("Failed to rebind push subscription");
  }
}
