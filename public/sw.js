self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "LinkCommerce", body: event.data.text() };
  }

  const { title, body, url, icon } = payload;
  event.waitUntil(
    self.registration.showNotification(title ?? "LinkCommerce", {
      body: body ?? "",
      icon: icon ?? "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: url ?? "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      clients.openWindow(url);
    })
  );
});
