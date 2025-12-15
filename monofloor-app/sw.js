/**
 * Service Worker for Monofloor Equipes
 * Handles push notifications and background sync
 */

const CACHE_NAME = 'monofloor-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    let data = {
        title: 'Monofloor Equipes',
        body: 'Voce tem uma nova notificacao',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: 'monofloor-notification',
        data: {}
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: data.badge || '/icons/badge-72.png',
        tag: data.tag || 'monofloor-notification',
        vibrate: [200, 100, 200],
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification.tag);

    event.notification.close();

    const data = event.notification.data || {};
    let targetUrl = '/';

    // Handle different notification types
    if (data.type === 'role:evolution') {
        targetUrl = '/#profile';
    } else if (data.type === 'checkin') {
        targetUrl = '/#project-detail';
    } else if (data.type === 'campaign:new' || data.type === 'campaign') {
        targetUrl = '/#projects';
    } else if (data.url) {
        targetUrl = data.url;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        // Send message to clear campaign cache if forceShow is true
                        if (data.forceShow && data.campaignId) {
                            client.postMessage({
                                type: 'CLEAR_CAMPAIGN_SEEN',
                                campaignId: data.campaignId
                            });
                        }
                        // Send message to show campaign if it's a campaign notification
                        if ((data.type === 'campaign:new' || data.type === 'campaign') && data.campaignId) {
                            client.postMessage({
                                type: 'SHOW_CAMPAIGN',
                                campaignId: data.campaignId,
                                forceShow: data.forceShow || false
                            });
                        }
                        return client.focus();
                    }
                }
                // Open new window (campaign will be shown via checkAndShowCampaigns on load)
                if (clients.openWindow) {
                    // Add campaign info to URL if forceShow
                    if (data.forceShow && data.campaignId) {
                        targetUrl = `/?forceShowCampaign=${data.campaignId}`;
                    } else if (data.campaignId) {
                        targetUrl = `/?showCampaign=${data.campaignId}`;
                    }
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification.tag);
});

// Background sync (for offline actions)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-checkins') {
        event.waitUntil(syncCheckins());
    }
});

// Sync pending checkins when back online
async function syncCheckins() {
    try {
        const pendingCheckins = await getPendingCheckins();
        for (const checkin of pendingCheckins) {
            await sendCheckin(checkin);
        }
        console.log('[SW] Synced', pendingCheckins.length, 'checkins');
    } catch (error) {
        console.error('[SW] Error syncing checkins:', error);
    }
}

// Helper functions (would need IndexedDB implementation)
async function getPendingCheckins() {
    return []; // Placeholder
}

async function sendCheckin(checkin) {
    // Placeholder
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
