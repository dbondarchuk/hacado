/* global self, clients */

const PUSH_NAVIGATE_MESSAGE = "hacado:push-navigate";

function resolveNotificationUrl(rawUrl) {
  try {
    return new URL(rawUrl || "/dashboard", self.location.origin).href;
  } catch {
    return new URL("/dashboard", self.location.origin).href;
  }
}

self.addEventListener("push", (event) => {
  let payload = { title: "Hacado", body: "", url: "/dashboard" };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    try {
      payload.body = event.data ? event.data.text() : "";
    } catch {
      // ignore malformed payloads
    }
  }

  const options = {
    body: payload.body || "",
    data: { url: payload.url || "/dashboard" },
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
    icon: "/logo-notification.png",
    badge: "/logo-notification.png",
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = resolveNotificationUrl(event.notification.data?.url);

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) {
          continue;
        }

        // Focus + postMessage: WindowClient.navigate is unreliable when a tab
        // or installed Home Screen app is already open (especially on iOS).
        client.postMessage({ type: PUSH_NAVIGATE_MESSAGE, url: targetUrl });

        if ("focus" in client) {
          await client.focus();
        }

        return;
      }

      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
    })(),
  );
});
