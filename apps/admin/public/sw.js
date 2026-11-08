/* global self, clients, Notification */

const PUSH_NAVIGATE_MESSAGE = "hacado:push-navigate";

function resolveNotificationUrl(rawUrl) {
  try {
    return new URL(rawUrl || "/dashboard", self.location.origin).href;
  } catch {
    return new URL("/dashboard", self.location.origin).href;
  }
}

function resolveClickUrl(notification, action) {
  const data = notification.data || {};

  if (action && Array.isArray(data.actions)) {
    const match = data.actions.find((entry) => entry.action === action);
    if (match?.url) {
      return resolveNotificationUrl(match.url);
    }
  }

  return resolveNotificationUrl(data.url);
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

  const deliveredActions = Array.isArray(payload.actions)
    ? payload.actions.filter(
        (entry) =>
          entry &&
          typeof entry.action === "string" &&
          typeof entry.title === "string" &&
          typeof entry.url === "string",
      )
    : [];

  const maxActions =
    typeof Notification !== "undefined" && Notification.maxActions
      ? Notification.maxActions
      : 0;

  const options = {
    body: payload.body || "",
    data: {
      url: payload.url || "/dashboard",
      actions: deliveredActions,
    },
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
    icon: "/logo-notification.png",
    badge: "/logo-notification.png",
  };

  // Chromium shows up to maxActions; Safari/iOS ignore actions entirely.
  if (maxActions > 0 && deliveredActions.length > 0) {
    options.actions = deliveredActions.slice(0, maxActions).map((entry) => ({
      action: entry.action,
      title: entry.title,
    }));
  }

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = resolveClickUrl(event.notification, event.action);

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
