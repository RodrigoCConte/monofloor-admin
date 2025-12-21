/**
 * Service Worker for Monofloor Equipes
 * Handles push notifications, background sync, and IMAGE CACHING
 */

const CACHE_NAME = 'monofloor-v5'; // v5: Aggressive stale-while-revalidate for instant loading
const IMAGE_CACHE_NAME = 'monofloor-images-v1';
const API_CACHE_NAME = 'monofloor-api-v1';

// URLs to precache (static assets)
const PRECACHE_URLS = [
    '/icons/icon-192.png',
    '/icons/badge-72.png',
    '/logo.png'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Precaching static assets');
                return cache.addAll(PRECACHE_URLS).catch(err => {
                    console.log('[SW] Precache failed (non-critical):', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Keep current caches, delete old versions
                    if (cacheName !== CACHE_NAME &&
                        cacheName !== IMAGE_CACHE_NAME &&
                        cacheName !== API_CACHE_NAME &&
                        cacheName.startsWith('monofloor')) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

// Fetch event - cache images and profile photos
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Cache images (profile photos, badges, feed images, etc.)
    if (isImageRequest(event.request)) {
        event.respondWith(cacheFirstImage(event.request));
        return;
    }

    // Cache API responses for profile and feed (longer TTL for instant loading)
    if (isProfileApiRequest(url)) {
        // 30 min TTL - but always return cached first, update in background
        event.respondWith(staleWhileRevalidate(event.request, API_CACHE_NAME, 30 * 60 * 1000));
        return;
    }
});

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
    const url = request.url.toLowerCase();
    const acceptHeader = request.headers.get('Accept') || '';

    // Check file extensions
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/)) {
        return true;
    }

    // Check Accept header for images
    if (acceptHeader.includes('image/')) {
        return true;
    }

    // Check for common image hosting patterns
    if (url.includes('/uploads/') ||
        url.includes('/photos/') ||
        url.includes('/avatars/') ||
        url.includes('/badges/') ||
        url.includes('/icons/') ||
        url.includes('cloudinary.com') ||
        url.includes('imgur.com') ||
        url.includes('googleusercontent.com')) {
        return true;
    }

    return false;
}

/**
 * Check if request is for profile API
 */
function isProfileApiRequest(url) {
    return url.pathname.includes('/api/mobile/profile') ||
           url.pathname.includes('/api/mobile/feed');
}

/**
 * Cache-first strategy for images
 * Returns cached version immediately, updates cache in background
 * Handles CORS and opaque responses properly
 */
async function cacheFirstImage(request) {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        // Return cached immediately, update in background
        updateCacheInBackground(request, cache);
        return cachedResponse;
    }

    // Not in cache, fetch and cache
    try {
        // Use no-cors mode for cross-origin images to avoid blocking
        const fetchRequest = new Request(request.url, {
            mode: 'cors',
            credentials: 'omit'
        });

        const networkResponse = await fetch(fetchRequest).catch(() => {
            // If CORS fails, try with no-cors (will be opaque)
            return fetch(new Request(request.url, { mode: 'no-cors' }));
        });

        // Only cache successful responses (not opaque)
        // Opaque responses have status 0 and can't be inspected
        if (networkResponse.ok || networkResponse.status === 0) {
            // Don't cache opaque responses (status 0) as they cause issues
            if (networkResponse.status !== 0) {
                cache.put(request, networkResponse.clone());
            }
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Image fetch failed:', request.url);
        // Return a placeholder or empty response
        return new Response('', { status: 404 });
    }
}

/**
 * Update cache in background without blocking
 */
function updateCacheInBackground(request, cache) {
    fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response);
        }
    }).catch(() => {
        // Ignore errors - cached version is still valid
    });
}

/**
 * Stale-while-revalidate strategy for API data
 * ALWAYS returns cached version immediately (for instant loading)
 * Updates in background, regardless of freshness
 */
async function staleWhileRevalidate(request, cacheName, maxAge) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    // ALWAYS update in background (non-blocking)
    updateApiCacheInBackground(request, cache);

    // If we have cached data, return it IMMEDIATELY (instant loading)
    if (cachedResponse) {
        const cachedDate = new Date(cachedResponse.headers.get('sw-cached-at') || 0);
        const age = Date.now() - cachedDate.getTime();
        console.log(`[SW] Returning cached API response (age: ${Math.round(age / 60000)} min)`);
        return cachedResponse;
    }

    // No cache - must fetch (first load)
    try {
        console.log('[SW] No cache, fetching from network:', request.url);
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Add timestamp header for freshness check
            const headers = new Headers(networkResponse.headers);
            headers.set('sw-cached-at', new Date().toISOString());

            const responseToCache = new Response(await networkResponse.clone().blob(), {
                status: networkResponse.status,
                statusText: networkResponse.statusText,
                headers: headers
            });
            cache.put(request, responseToCache);
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed and no cache available');
        throw error;
    }
}

/**
 * Update API cache in background
 */
function updateApiCacheInBackground(request, cache) {
    fetch(request).then(async response => {
        if (response.ok) {
            const headers = new Headers(response.headers);
            headers.set('sw-cached-at', new Date().toISOString());

            const responseToCache = new Response(await response.blob(), {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });
            cache.put(request, responseToCache);
        }
    }).catch(() => {
        // Ignore errors
    });
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] ========== PUSH RECEIVED ==========');
    console.log('[SW] event.data:', event.data);

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
            console.log('[SW] Payload parsed:', JSON.stringify(payload));
            data = { ...data, ...payload };
        } catch (e) {
            console.log('[SW] Error parsing payload:', e);
            data.body = event.data.text();
        }
    }

    console.log('[SW] Final notification data:', JSON.stringify(data));

    // Use different vibration pattern based on notification type
    let vibrate = [200, 100, 200];
    if (data.data?.type === 'xp:penalty') {
        // More intense vibration for XP loss
        vibrate = [100, 50, 100, 50, 200, 50, 300];
    } else if (data.data?.type === 'xp:bonus') {
        // Celebratory vibration for XP gain
        vibrate = [100, 100, 200, 100, 300];
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: data.badge || '/icons/badge-72.png',
        tag: data.tag || 'monofloor-notification',
        vibrate: vibrate,
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

    // Handle notification actions
    const action = event.action;

    // Handle different notification types
    if (data.type === 'role:evolution') {
        targetUrl = '/#profile';
    } else if (data.type === 'checkin') {
        targetUrl = '/#project-detail';
    } else if (data.type === 'campaign:new' || data.type === 'campaign') {
        targetUrl = '/#projects';
    } else if (data.type === 'xp:penalty') {
        // XP penalty notification - show loss animation and go to profile
        targetUrl = '/#profile';
        // Send message to client to show XP loss animation
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin)) {
                            client.postMessage({
                                type: 'SHOW_XP_LOSS',
                                amount: data.amount,
                                reason: data.reason,
                                projectName: data.projectName
                            });
                        }
                    }
                })
        );
    } else if (data.type === 'xp:bonus') {
        // XP bonus notification - show gain animation and go to profile
        console.log('[SW] XP:BONUS notification clicked - sending SHOW_XP_GAIN message');
        targetUrl = '/#profile';
        // Send message to client to show XP gain animation
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    console.log('[SW] Found clients:', clientList.length);
                    for (const client of clientList) {
                        console.log('[SW] Client URL:', client.url);
                        if (client.url.includes(self.location.origin)) {
                            console.log('[SW] Sending SHOW_XP_GAIN to client');
                            client.postMessage({
                                type: 'SHOW_XP_GAIN',
                                amount: data.amount,
                                reason: data.reason,
                                totalXP: data.totalXP
                            });
                        }
                    }
                })
        );
    } else if (data.type === 'report:reminder') {
        // Handle report reminder notification actions
        if (action === 'send') {
            // User clicked "Enviar Agora" - go to report screen
            targetUrl = '/#report';
        } else if (action === 'dismiss') {
            // User clicked "Depois" or "Ignorar" - dismiss the reminder
            if (data.reminderId) {
                dismissReportReminder(data.reminderId);
            }
            return; // Don't open app, just dismiss
        } else {
            // Default click - go to report screen
            targetUrl = '/#report';
        }
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

/**
 * Dismiss a report reminder via API
 * Called when user clicks "Depois" or "Ignorar" on notification
 */
async function dismissReportReminder(reminderId) {
    try {
        // Get the API URL from cached config or use default
        const API_URL = 'https://devoted-wholeness-production.up.railway.app';

        // We need to get the token from the client
        const allClients = await clients.matchAll({ type: 'window' });

        if (allClients.length > 0) {
            // Send message to client to dismiss reminder
            allClients[0].postMessage({
                type: 'DISMISS_REPORT_REMINDER',
                reminderId: reminderId
            });
        } else {
            // No client available, try direct API call (won't work without token)
            console.log('[SW] No client available to dismiss reminder', reminderId);
        }
    } catch (error) {
        console.error('[SW] Error dismissing report reminder:', error);
    }
}
