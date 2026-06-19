/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'CTRL Europe Portal', body: event.data?.text() || '' }
  }

  const title = data.title || 'CTRL Europe Portal'
  const options = {
    body: data.body || '',
    icon: data.icon || '/ctrl-logo.jpg',
    badge: '/ctrl-logo.jpg',
    tag: data.tag || 'ctrl-notification',
    renotify: true,
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const absoluteUrl = new URL(targetUrl, self.location.origin).href
      for (const client of windowClients) {
        if (!client.url.startsWith(self.location.origin)) continue
        if ('navigate' in client) {
          return client.navigate(absoluteUrl).then(() => client.focus())
        }
        client.focus()
        return undefined
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl)
      }
      return undefined
    })
  )
})
