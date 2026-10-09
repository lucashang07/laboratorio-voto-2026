// Service worker mínimo da Batalha do voto: só para os alertas do front
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/batalha/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.indexOf('/batalha') >= 0 && 'focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
