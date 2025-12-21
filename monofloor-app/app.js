// API Configuration
const API_URL = 'https://devoted-wholeness-production.up.railway.app'; // Production
// const API_URL = 'http://localhost:3000'; // Local server for testing

// =============================================
// CHARACTER ICONS BY ROLE
// =============================================
function getCharacterIcon(role) {
    const icons = {
        'LIDER': 'icons/lider.png',
        'APLICADOR_III': 'icons/aplicador-3.png',
        'APLICADOR_II': 'icons/aplicador-2.png',
        'APLICADOR_I': 'icons/aplicador-1.png',
        'LIDER_PREPARACAO': 'icons/lider-preparacao.png',
        'PREPARADOR': 'icons/preparador.png',
        'AUXILIAR': 'icons/ajudante.png'
    };
    return icons[role] || 'icons/ajudante.png';
}

function getCharacterLabel(role) {
    const labels = {
        'LIDER': 'Lider',
        'APLICADOR_III': 'Aplicador III',
        'APLICADOR_II': 'Aplicador II',
        'APLICADOR_I': 'Aplicador I',
        'LIDER_PREPARACAO': 'Lider da Preparacao',
        'PREPARADOR': 'Preparador',
        'AUXILIAR': 'Auxiliar'
    };
    return labels[role] || 'Auxiliar';
}

// =============================================
// EVOLUTION NOTIFICATION SYSTEM (Pokemon Style)
// =============================================

// Role hierarchy - from lowest to highest
const ROLE_HIERARCHY = ['AUXILIAR', 'PREPARADOR', 'LIDER_PREPARACAO', 'APLICADOR_I', 'APLICADOR_II', 'APLICADOR_III', 'LIDER'];

// Check if a role change is a promotion
function isPromotion(oldRole, newRole) {
    const oldIndex = ROLE_HIERARCHY.indexOf(oldRole || 'AUXILIAR');
    const newIndex = ROLE_HIERARCHY.indexOf(newRole || 'AUXILIAR');
    return newIndex > oldIndex;
}

// Show evolution notification
function showEvolutionNotification(oldRole, newRole) {
    const overlay = document.getElementById('evolutionOverlay');
    const oldIcon = document.getElementById('evolutionOldIcon');
    const newIcon = document.getElementById('evolutionNewIcon');
    const roleLabel = document.getElementById('evolutionRoleLabel');

    if (!overlay || !oldIcon || !newIcon || !roleLabel) {
        console.error('[Evolution] Modal elements not found');
        return;
    }

    // Set the icons
    oldIcon.src = getCharacterIcon(oldRole);
    newIcon.src = getCharacterIcon(newRole);
    roleLabel.textContent = getCharacterLabel(newRole);

    // Reset animations by removing and re-adding elements
    const container = overlay.querySelector('.evolution-container');
    const flash = overlay.querySelector('.evolution-flash');

    // Clone and replace to reset CSS animations
    if (oldIcon.parentNode) {
        const newOldIcon = oldIcon.cloneNode(true);
        oldIcon.parentNode.replaceChild(newOldIcon, oldIcon);
    }
    if (newIcon.parentNode) {
        const newNewIcon = newIcon.cloneNode(true);
        newIcon.parentNode.replaceChild(newNewIcon, newIcon);
    }
    if (flash && flash.parentNode) {
        const newFlash = flash.cloneNode(true);
        flash.parentNode.replaceChild(newFlash, flash);
    }

    // Re-get elements after cloning
    document.getElementById('evolutionOldIcon').src = getCharacterIcon(oldRole);
    document.getElementById('evolutionNewIcon').src = getCharacterIcon(newRole);

    // Show overlay
    overlay.classList.add('active');

    console.log(`[Evolution] Showing evolution from ${oldRole} to ${newRole}`);
}

// Close evolution notification
function closeEvolutionNotification() {
    const overlay = document.getElementById('evolutionOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Check for role changes on login/profile update
function checkForRoleEvolution(newProfile) {
    const storedProfile = localStorage.getItem('user_profile');
    if (storedProfile) {
        try {
            const oldProfile = JSON.parse(storedProfile);
            if (oldProfile.role && newProfile.role && oldProfile.role !== newProfile.role) {
                if (isPromotion(oldProfile.role, newProfile.role)) {
                    // Delay to ensure page is loaded
                    setTimeout(() => {
                        showEvolutionNotification(oldProfile.role, newProfile.role);
                    }, 1000);
                }
            }
        } catch (e) {
            console.error('[Evolution] Error parsing stored profile:', e);
        }
    }
    // Store the new profile for future comparisons
    localStorage.setItem('user_profile', JSON.stringify({
        role: newProfile.role,
        name: newProfile.name
    }));
}

// Test function for evolution (call from console: testEvolution('AUXILIAR', 'PREPARADOR'))
function testEvolution(oldRole, newRole) {
    showEvolutionNotification(oldRole || 'AUXILIAR', newRole || 'PREPARADOR');
}

// =============================================
// ONBOARDING SEQUENCE (3 Pop-ups gamificados)
// =============================================

const ONBOARDING_STORAGE_KEY = 'monofloor_onboarding_completed';

// Role icons mapping for onboarding
const onboardingRoleIcons = {
    'AUXILIAR': 'icons/ajudante.png',
    'PREPARADOR': 'icons/preparador.png',
    'LIDER_PREPARACAO': 'icons/lider-preparacao.png',
    'APLICADOR_I': 'icons/aplicador-1.png',
    'APLICADOR_II': 'icons/aplicador-2.png',
    'APLICADOR_III': 'icons/aplicador-3.png',
    'LIDER': 'icons/lider.png'
};

// Role display names for onboarding
const onboardingRoleNames = {
    'AUXILIAR': 'Auxiliar',
    'PREPARADOR': 'Preparador',
    'LIDER_PREPARACAO': 'Lider da Preparacao',
    'APLICADOR_I': 'Aplicador I',
    'APLICADOR_II': 'Aplicador II',
    'APLICADOR_III': 'Aplicador III',
    'LIDER': 'Lider'
};

// Check if onboarding was already completed
function hasCompletedOnboarding() {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

// Mark onboarding as completed
function markOnboardingCompleted() {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

// Start the onboarding sequence
function startOnboarding(userRole = 'AUXILIAR') {
    // Don't show if already completed
    if (hasCompletedOnboarding()) {
        console.log('[Onboarding] Already completed, skipping...');
        return;
    }

    console.log('[Onboarding] Starting sequence for role:', userRole);

    // Update role icon and name in step 3
    const roleIcon = document.getElementById('onboardingRoleIcon');
    const roleName = document.getElementById('onboardingRoleName');

    if (roleIcon) {
        roleIcon.src = onboardingRoleIcons[userRole] || onboardingRoleIcons['AUXILIAR'];
    }
    if (roleName) {
        roleName.textContent = onboardingRoleNames[userRole] || onboardingRoleNames['AUXILIAR'];
    }

    // Reset to step 1
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.remove('active', 'exit');
    });
    const step1 = document.getElementById('onboardingStep1');
    if (step1) {
        step1.classList.add('active');
    }

    // Show the overlay
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

// Navigate to next onboarding step
function nextOnboardingStep(stepNumber) {
    console.log('[Onboarding] Going to step:', stepNumber);

    const currentStep = document.querySelector('.onboarding-step.active');
    const nextStep = document.getElementById(`onboardingStep${stepNumber}`);

    if (currentStep && nextStep) {
        // Animate current step out
        currentStep.classList.add('exit');
        currentStep.classList.remove('active');

        // Small delay before showing next step
        setTimeout(() => {
            currentStep.classList.remove('exit');
            nextStep.classList.add('active');
        }, 300);
    }
}

// Finish onboarding and close overlay
function finishOnboarding() {
    console.log('[Onboarding] Completing onboarding');

    // Mark as completed
    markOnboardingCompleted();

    // Close the overlay
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }

    // Reset steps
    setTimeout(() => {
        document.querySelectorAll('.onboarding-step').forEach(step => {
            step.classList.remove('active', 'exit');
        });
    }, 500);

    // Check for campaigns after onboarding completes (new user = 5 min delay)
    setTimeout(() => {
        checkAndShowCampaigns(true); // true = new user, will delay 5 minutes
    }, 1000);
}

// Open help from onboarding (placeholder - will configure later)
function openHelpFromOnboarding() {
    console.log('[Onboarding] Opening help...');
    // First finish onboarding
    finishOnboarding();
    // Then navigate to profile screen which has the help option
    setTimeout(() => {
        navigateTo('screen-profile');
    }, 600);
}

// Test function for onboarding (call from console: testOnboarding('PREPARADOR'))
function testOnboarding(role) {
    // Clear the completed flag temporarily
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    startOnboarding(role || 'AUXILIAR');
}

// =============================================
// CAMPAIGN SYSTEM (API-Based with Multi-Slide Support)
// =============================================

const CAMPAIGN_STORAGE_KEY = 'monofloor_campaigns_seen';

// Cached campaigns from API
let cachedCampaigns = [];

// Current campaign state
let currentCampaign = null;
let currentSlideIndex = 0;
let campaignFirstLoopDone = false;
let totalApplicators = 0;

// Fetch active campaigns from API
async function fetchCampaignsFromAPI() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('[Campaign] No token, skipping API fetch');
            return [];
        }

        const response = await fetch(`${API_URL}/api/mobile/campaigns`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('[Campaign] API error:', response.status);
            return [];
        }

        const data = await response.json();
        cachedCampaigns = data.campaigns || [];
        totalApplicators = data.totalApplicators || 0;
        console.log('[Campaign] Fetched campaigns from API:', cachedCampaigns.length);
        return cachedCampaigns;
    } catch (error) {
        console.error('[Campaign] Error fetching campaigns:', error);
        return [];
    }
}

// Get campaigns that user hasn't seen yet
function getUnseenCampaigns() {
    const seenCampaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) || '[]');
    return cachedCampaigns.filter(campaign => !seenCampaigns.includes(campaign.id));
}

// Mark campaign as seen
function markCampaignAsSeen(campaignId) {
    const seenCampaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) || '[]');
    if (!seenCampaigns.includes(campaignId)) {
        seenCampaigns.push(campaignId);
        localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(seenCampaigns));
    }
}

// Build campaign banner (simplified - just video/image)
function buildCampaignBanner(campaign) {
    const bannerContainer = document.getElementById('campaignBannerContainer');
    if (!bannerContainer) return;

    bannerContainer.innerHTML = '';

    const bannerUrl = campaign.bannerUrl.startsWith('http') ? campaign.bannerUrl : `${API_URL}${campaign.bannerUrl}`;

    if (campaign.bannerType === 'video') {
        bannerContainer.innerHTML = `
            <video id="campaignBannerVideo" class="campaign-media" autoplay loop playsinline>
                <source src="${bannerUrl}" type="video/mp4">
            </video>
        `;
    } else {
        bannerContainer.innerHTML = `
            <img class="campaign-media" src="${bannerUrl}" alt="${campaign.name}">
        `;
    }

    // Update counter
    updateCampaignCounter();
}

// Update participant counter
function updateCampaignCounter() {
    const counter = document.getElementById('campaignCounter');
    if (counter && currentCampaign) {
        counter.textContent = `${currentCampaign.participantCount || 0}/${totalApplicators} participando`;
    }
}

// Show campaign popup
function showCampaign(campaign) {
    if (!campaign) return;

    currentCampaign = campaign;
    campaignFirstLoopDone = false;
    console.log('[Campaign] Showing campaign:', campaign.name);

    const overlay = document.getElementById('campaignOverlay');
    if (!overlay) return;

    // Build banner
    buildCampaignBanner(campaign);

    // Setup video audio handling (first loop with audio, then muted)
    setTimeout(() => {
        const video = document.getElementById('campaignBannerVideo');
        if (video) {
            video.muted = false;
            video.volume = 1;

            video.removeEventListener('timeupdate', handleCampaignTimeUpdate);
            video.removeEventListener('ended', handleCampaignLoopEnd);
            video.addEventListener('timeupdate', handleCampaignTimeUpdate);
            video.addEventListener('ended', handleCampaignLoopEnd);

            video.play().catch(e => {
                console.log('[Campaign] Autoplay with audio blocked, trying muted:', e);
                video.muted = true;
                video.play().catch(e2 => console.log('[Campaign] Autoplay blocked:', e2));
            });
        }
    }, 100);

    overlay.classList.add('active');
}

// Handle time update for fadeout
function handleCampaignTimeUpdate(e) {
    const video = e.target;
    if (campaignFirstLoopDone || !video.duration) return;

    const timeRemaining = video.duration - video.currentTime;
    const fadeStartTime = 2;

    if (timeRemaining <= fadeStartTime && timeRemaining > 0) {
        const fadeProgress = 1 - (timeRemaining / fadeStartTime);
        video.volume = Math.max(0, 1 - fadeProgress);
    }
}

// Handle first loop end - mute for subsequent loops
function handleCampaignLoopEnd(e) {
    const video = e.target;
    if (!campaignFirstLoopDone) {
        campaignFirstLoopDone = true;
        video.muted = true;
        video.volume = 0;
        console.log('[Campaign] First loop done, muting for subsequent loops');
    }
}

// Close campaign popup
function closeCampaign() {
    const overlay = document.getElementById('campaignOverlay');
    const video = document.getElementById('campaignBannerVideo');

    if (overlay) {
        overlay.classList.remove('active');
    }

    if (video) {
        video.pause();
        video.currentTime = 0;
        video.muted = true;
        video.removeEventListener('timeupdate', handleCampaignTimeUpdate);
        video.removeEventListener('ended', handleCampaignLoopEnd);
    }

    campaignFirstLoopDone = false;

    if (currentCampaign) {
        markCampaignAsSeen(currentCampaign.id);
        console.log('[Campaign] Marked as seen:', currentCampaign.id);
    }

    currentCampaign = null;
    currentSlideIndex = 0;
}

// Handle "QUERO PARTICIPAR" button click
async function joinCampaign() {
    if (!currentCampaign) {
        closeCampaign();
        return;
    }

    console.log('[Campaign] User wants to join:', currentCampaign.name);

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Voce precisa estar logado para participar!');
            closeCampaign();
            return;
        }

        const response = await fetch(`${API_URL}/api/mobile/campaigns/${currentCampaign.id}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Update local campaign data
            currentCampaign.participantCount = data.participantCount;
            updateCampaignCounter();
            alert('Voce foi inscrito na campanha!');
        } else if (response.status === 409) {
            alert('Voce ja esta participando desta campanha!');
        } else {
            alert(data.message || 'Erro ao participar da campanha');
        }
    } catch (error) {
        console.error('[Campaign] Error joining campaign:', error);
        alert('Erro ao conectar com o servidor');
    }

    closeCampaign();
}

// Check and show unseen campaigns (called after login)
// isNewUser = true means just completed onboarding (new registration)
// isNewUser = false means existing user (show immediately + notification)
async function checkAndShowCampaigns(isNewUser = false) {
    // Fetch campaigns from API first
    await fetchCampaignsFromAPI();

    const unseenCampaigns = getUnseenCampaigns();

    if (unseenCampaigns.length > 0) {
        const campaign = unseenCampaigns[0];

        if (isNewUser) {
            // New user: show after 5 minutes
            console.log('[Campaign] New user - scheduling campaign in 5 minutes');
            setTimeout(() => {
                showCampaign(campaign);
            }, 5 * 60 * 1000);
        } else {
            // Existing user: show immediately + send notification
            console.log('[Campaign] Existing user - showing campaign immediately with notification');

            showBrowserNotification(
                'Tem desafio novo por aqui ;)',
                'Confira a nova campanha que preparamos para voce!',
                { type: 'campaign', campaignId: campaign.id }
            );

            setTimeout(() => {
                showCampaign(campaign);
            }, 1000);
        }
    }
}

// Test function for campaigns (call from console: testCampaign())
async function testCampaign(campaignId) {
    // Fetch fresh data
    await fetchCampaignsFromAPI();

    if (campaignId) {
        const seenCampaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) || '[]');
        const index = seenCampaigns.indexOf(campaignId);
        if (index > -1) {
            seenCampaigns.splice(index, 1);
            localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(seenCampaigns));
        }
        const campaign = cachedCampaigns.find(c => c.id === campaignId);
        if (campaign) {
            showCampaign(campaign);
        }
    } else {
        if (cachedCampaigns.length > 0) {
            showCampaign(cachedCampaigns[0]);
        } else {
            console.log('[Campaign] No campaigns available from API');
        }
    }
}

// =============================================
// LOCATION & BATTERY TRACKING SYSTEM
// =============================================
let locationPermissionStatus = 'unknown'; // 'granted' | 'denied' | 'prompt' | 'unknown'
let locationPermissionAttempts = 0;
const MAX_LOCATION_ATTEMPTS = 3;
let batteryInfo = { level: null, charging: null };
let locationUpdateInterval = null;

// Interval settings based on check-in status
const LOCATION_INTERVAL_WITH_CHECKIN = 5 * 60 * 1000; // 5 minutes when checked-in
const LOCATION_INTERVAL_WITHOUT_CHECKIN = 5 * 60 * 1000; // 5 minutes when not checked-in

// Network status tracking
let isOnline = navigator.onLine;
let pendingLocationUpdates = []; // Queue for offline updates

// Offline Location Tracking with IndexedDB
const LOCATION_DB_NAME = 'monofloorLocations';
const LOCATION_DB_VERSION = 2; // Bumped for timeline store
const LOCATION_STORE_NAME = 'pendingLocations';
const GPS_LOG_STORE_NAME = 'gpsOffLogs';
const TIMELINE_STORE_NAME = 'timelineEvents'; // New: stores 24h movement timeline
let locationDB = null;
let gpsOffStartTime = null; // Track when GPS was turned off
let gpsAlertShown = false; // Track if persistent alert is shown
let gpsCheckoutInProgress = false; // Prevent multiple checkout attempts

// GPS Auto-Checkout: 5 minutes with GPS off = automatic checkout
// Backend does checkout after 10 confirmations (5 min = 10 x 30s)
// Frontend shows warning only after 60 seconds of GPS off
let gpsVerificationInterval = null;
const GPS_VERIFICATION_INTERVAL = 10 * 1000; // Check every 10 seconds for responsiveness
const GPS_WARNING_THRESHOLD = 60 * 1000; // 60 seconds - show warning after this
const GPS_MAX_OFF_DURATION = 5 * 60 * 1000; // 5 minutes - checkout happens after this

// =============================================
// ACCELEROMETER & MOVEMENT TRACKING (when NOT checked-in)
// =============================================
const MOVEMENT_THRESHOLD = 1.5; // m/s² - minimum acceleration to consider "moving"
const MOVEMENT_LOCATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MORNING_START_HOUR = 5; // 5 AM - start detecting wake activity
const MORNING_END_HOUR = 10; // 10 AM - end of morning detection

let accelerometerActive = false;
let lastMovementTime = null;
let lastMovementLocation = null;
let movementLocationInterval = null;
let isDeviceMoving = false;
let morningActivityDetected = false;
let todayMorningAlertShown = false;

// Check location permission status
async function checkLocationPermission() {
    if (!navigator.permissions) {
        return 'unknown';
    }
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
        console.log('Permission API not supported:', error);
        return 'unknown';
    }
}

// Show location consent modal
function showLocationConsentModal() {
    const modal = document.getElementById('location-consent-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Hide location consent modal
function hideLocationConsentModal() {
    const modal = document.getElementById('location-consent-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Acknowledge location consent and request permission
async function acknowledgeLocationConsent() {
    hideLocationConsentModal();
    await requestLocationPermission();
}

// Request location permission
async function requestLocationPermission() {
    locationPermissionAttempts++;

    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            locationPermissionStatus = 'denied';
            showLocationDeniedBanner();
            resolve(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Permission granted
                locationPermissionStatus = 'granted';
                hideLocationDeniedBanner();
                startLocationTracking();
                resolve(true);
            },
            (error) => {
                console.log('Location permission error:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    locationPermissionStatus = 'denied';

                    // After 3 attempts, mark check-in as irregular
                    if (locationPermissionAttempts >= MAX_LOCATION_ATTEMPTS) {
                        console.log('Max location attempts reached - check-in will be irregular');
                        showLocationDeniedBanner();
                    } else {
                        // Show consent modal again
                        setTimeout(() => {
                            showLocationConsentModal();
                        }, 500);
                    }
                }
                resolve(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    });
}

// Show location denied banner
function showLocationDeniedBanner() {
    const banner = document.getElementById('location-denied-banner');
    if (banner) {
        banner.style.display = 'block';
    }
}

// Hide location denied banner
function hideLocationDeniedBanner() {
    const banner = document.getElementById('location-denied-banner');
    if (banner) {
        banner.style.display = 'none';
    }
}

// Initialize Battery API
async function initBatteryMonitoring() {
    if (!navigator.getBattery) {
        console.log('Battery API not supported');
        return;
    }

    try {
        const battery = await navigator.getBattery();

        // Get initial values
        batteryInfo.level = Math.round(battery.level * 100);
        batteryInfo.charging = battery.charging;

        // Listen for changes
        battery.addEventListener('levelchange', () => {
            batteryInfo.level = Math.round(battery.level * 100);
            console.log('Battery level:', batteryInfo.level + '%');
        });

        battery.addEventListener('chargingchange', () => {
            batteryInfo.charging = battery.charging;
            console.log('Charging:', batteryInfo.charging);
        });

        console.log('Battery monitoring initialized:', batteryInfo);
    } catch (error) {
        console.log('Battery API error:', error);
    }
}

// Get current location interval based on check-in status
function getCurrentLocationInterval() {
    return activeCheckinId ? LOCATION_INTERVAL_WITH_CHECKIN : LOCATION_INTERVAL_WITHOUT_CHECKIN;
}

// Start location tracking with dynamic interval
function startLocationTracking() {
    // Clear any existing interval
    if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
    }

    // Send initial location
    sendLocationWithBattery();

    const interval = getCurrentLocationInterval();

    // Set up interval for regular updates
    locationUpdateInterval = setInterval(() => {
        const token = getAuthToken();
        if (token && locationPermissionStatus === 'granted') {
            sendLocationWithBattery();
        }
    }, interval);

    const intervalSeconds = interval / 1000;
    console.log(`Location tracking started (every ${intervalSeconds}s, checkin: ${!!activeCheckinId})`);
}

// Restart location tracking with new interval (call after check-in/checkout)
function restartLocationTracking() {
    if (locationPermissionStatus === 'granted') {
        startLocationTracking();
    }
}

// Stop location tracking
function stopLocationTracking() {
    if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        locationUpdateInterval = null;
    }
    console.log('Location tracking stopped');
}

// Send location with battery info to backend
async function sendLocationWithBattery() {
    if (!navigator.geolocation) return;
    if (locationPermissionStatus !== 'granted') return;

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 30000
            });
        });

        const payload = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            isOnline: isOnline, // Use dynamic network status
            batteryLevel: batteryInfo.level,
            isCharging: batteryInfo.charging,
            hasActiveCheckin: !!activeCheckinId,
            timestamp: new Date().toISOString()
        };

        // If offline, queue the update for later (using IndexedDB)
        if (!isOnline) {
            await saveLocationToIndexedDB(payload);
            console.log('Offline - localização salva no IndexedDB');
            updateLocationBanner(false, 'offline');
            return;
        }

        await fetch(`${API_URL}/api/mobile/location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(payload)
        });

        console.log('Location sent with battery:', batteryInfo.level + '%', 'checkin:', !!activeCheckinId);
        updateLocationBanner(true);
    } catch (error) {
        console.log('Error sending location:', error);
        // Queue the payload if send failed (using IndexedDB)
        if (error.name !== 'GeolocationPositionError') {
            await saveLocationToIndexedDB({
                latitude: null,
                longitude: null,
                isOnline: false,
                batteryLevel: batteryInfo.level,
                isCharging: batteryInfo.charging,
                hasActiveCheckin: !!activeCheckinId,
                timestamp: new Date().toISOString(),
                error: 'network_error'
            });
        }
        updateLocationBanner(false);
    }
}

// Send pending location updates when back online (now uses IndexedDB)
async function sendPendingLocationUpdates() {
    // Use the new sync function that works with IndexedDB
    await syncPendingLocations();
}

// Initialize network status monitoring
function initNetworkMonitoring() {
    // Update online status
    isOnline = navigator.onLine;

    // Listen for online/offline events
    window.addEventListener('online', () => {
        console.log('Network: online');
        isOnline = true;
        updateNetworkBanner(true);
        // Send queued updates
        sendPendingLocationUpdates();
        // Send immediate location update
        sendLocationWithBattery();
    });

    window.addEventListener('offline', () => {
        console.log('Network: offline');
        isOnline = false;
        updateNetworkBanner(false);
    });

    console.log('Network monitoring initialized. Online:', isOnline);
}

// Update network status banner
function updateNetworkBanner(online) {
    const banner = document.getElementById('network-status-banner');
    if (banner) {
        if (online) {
            banner.style.display = 'none';
        } else {
            banner.style.display = 'block';
        }
    }
}

// =============================================
// SOCKET.IO CLIENT & LUNCH REMINDERS
// =============================================
let socket = null;
let lunchReminderDismissed = false;
let lastLunchReminderTime = null;
let socketReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Initialize Socket.io connection with authentication
function initSocketConnection() {
    if (typeof io === 'undefined') {
        console.log('[Socket] Socket.io not loaded');
        return;
    }

    // Get auth token for socket connection
    const token = getAuthToken();
    if (!token) {
        console.log('[Socket] No auth token, skipping socket connection');
        return;
    }

    // Disconnect existing socket if any
    if (socket && socket.connected) {
        socket.disconnect();
    }

    socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: {
            token: token
        }
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
        socketReconnectAttempts = 0;

        // Join user-specific room to receive personal notifications
        const userId = getCurrentUserId();
        if (userId) {
            socket.emit('join:user', userId);
            console.log('[Socket] Joined user room:', userId);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        if (reason === 'io server disconnect') {
            // Server disconnected, need to manually reconnect
            setTimeout(() => {
                if (getAuthToken()) {
                    socket.connect();
                }
            }, 1000);
        }
    });

    socket.on('reconnect', async (attemptNumber) => {
        console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
        // Re-join user room after reconnection
        const userId = getCurrentUserId();
        if (userId) {
            socket.emit('join:user', userId);
        }
        // Check for any campaigns we might have missed while disconnected
        console.log('[Socket] Checking for missed campaigns...');
        await checkAndShowCampaigns(false);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('[Socket] Reconnection attempt:', attemptNumber);
        socketReconnectAttempts = attemptNumber;
    });

    socket.on('reconnect_failed', () => {
        console.log('[Socket] Reconnection failed after', MAX_RECONNECT_ATTEMPTS, 'attempts');
    });

    socket.on('connect_error', (error) => {
        console.log('[Socket] Connection error:', error.message);
    });

    // Listen for lunch reminder events
    socket.on('lunch:reminder', (data) => {
        console.log('Lunch reminder received:', data);
        handleLunchReminder(data);
    });

    // Listen for leaving area prompt during lunch
    socket.on('lunch:leavingPrompt', (data) => {
        console.log('Leaving prompt received:', data);
        handleLeavingPrompt(data);
    });

    // Listen for contribution request approved
    socket.on('contribution:approved', (data) => {
        console.log('Contribution approved:', data);
        showContributionApprovedNotification(data);
    });

    // Listen for contribution request rejected
    socket.on('contribution:rejected', (data) => {
        console.log('Contribution rejected:', data);
        showContributionRejectedNotification(data);
    });

    // Listen for role evolution (promotion) - Pokemon style notification
    socket.on('role:evolution', (data) => {
        console.log('[Socket] Role evolution received:', data);
        const currentUserId = getCurrentUserId();
        // Only show notification if it's for the current user
        if (data.userId === currentUserId) {
            // Update the stored profile with new role
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    user.role = data.newRole;
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (e) {
                    console.error('[Evolution] Error updating stored user:', e);
                }
            }
            // Also update userProfile
            const storedProfile = localStorage.getItem('userProfile');
            if (storedProfile) {
                try {
                    const profile = JSON.parse(storedProfile);
                    profile.role = data.newRole;
                    localStorage.setItem('userProfile', JSON.stringify(profile));
                } catch (e) {
                    console.error('[Evolution] Error updating stored profile:', e);
                }
            }
            // Show the evolution notification (in-app)
            showEvolutionNotification(data.oldRole, data.newRole);
            // Also show browser notification
            showBrowserNotification(
                'Parabens! Voce evoluiu!',
                `Voce passou de ${getRoleDisplayName(data.oldRole)} para ${getRoleDisplayName(data.newRole)}!`,
                { type: 'role:evolution', oldRole: data.oldRole, newRole: data.newRole }
            );
        }
    });

    // Listen for new campaign launches
    socket.on('campaign:new', async (data) => {
        console.log('[Socket] New campaign launched:', data);

        // If forceShow is true (resend), clear this campaign from seen cache
        if (data.forceShow && data.id) {
            const seenCampaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) || '[]');
            const index = seenCampaigns.indexOf(data.id);
            if (index > -1) {
                seenCampaigns.splice(index, 1);
                localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(seenCampaigns));
                console.log('[Campaign] Cleared from seen cache due to forceShow:', data.id);
            }
        }

        // Show notification
        showBrowserNotification(
            'Tem desafio novo por aqui ;)',
            data.name || 'Confira a nova campanha que preparamos para voce!',
            { type: 'campaign', campaignId: data.id }
        );

        // Use the campaign data directly from socket event - it already has all needed info!
        // (id, name, description, bannerUrl, bannerType, slides, xpBonus, etc.)
        if (data.id && data.bannerUrl) {
            setTimeout(() => {
                console.log('[Campaign] Showing campaign directly from socket data');
                showCampaign(data);
            }, 2000);
        }

        // Also refresh the cache in the background for future use
        fetchCampaignsFromAPI();
    });

    // Listen for campaign removal notification
    socket.on('campaign:removed', (data) => {
        console.log('[Socket] Removed from campaign:', data);

        // Show dramatic game-style alert
        showGameAlert({
            type: 'removed',
            icon: '💀',
            title: 'REMOVIDO!',
            message: `Voce foi removido(a) da campanha "${data.campaignName}"`,
            buttonText: 'DROGA!'
        });

        // Also show browser notification for when app is in background
        showBrowserNotification(
            'Removido da Campanha',
            `Voce foi removido(a) da campanha "${data.campaignName}" :(`,
            { type: 'campaign:removed', campaignId: data.campaignId }
        );
    });

    // Listen for XP gain events
    socket.on('xp:gained', (data) => {
        console.log('[Socket] XP gained:', data);

        // Show XP gain animation
        showXPGain(data.amount, data.reason || '');

        // Also show browser notification
        showBrowserNotification(
            `+${data.amount} XP!`,
            data.reason || 'Você ganhou experiência!',
            { type: 'xp:gained', amount: data.amount }
        );
    });

    // Listen for XP lost events (admin penalty)
    socket.on('xp:lost', (data) => {
        console.log('[Socket] XP lost:', data);

        // Show XP loss animation (same style as XP gain but red)
        showXPLoss(data.amount, data.reason || 'Penalidade');
    });

    // Listen for campaign winner notification
    socket.on('campaign:winner', (data) => {
        console.log('[Socket] Campaign winner:', data);

        // Show winner celebration animation
        showCampaignWinner({
            campaignName: data.campaignName,
            position: data.position || 1,
            xpReward: data.xpReward || 0,
            prize: data.prize || ''
        });

        // Also show browser notification
        showBrowserNotification(
            '🏆 VENCEDOR!',
            `Você ficou em ${data.position}º lugar na campanha "${data.campaignName}"!`,
            { type: 'campaign:winner', campaignId: data.campaignId }
        );
    });

    // Listen for badge earned notification
    socket.on('badge:earned', (data) => {
        console.log('[Socket] Badge earned:', data);

        // Show badge earned celebration animation
        showBadgeEarned({
            badgeName: data.badgeName,
            badgeIconUrl: data.badgeIconUrl,
            badgeColor: data.badgeColor || '#c9a962',
            badgeRarity: data.badgeRarity || 'COMMON',
            reason: data.reason || '',
            campaignName: data.campaignName || ''
        });

        // Also show browser notification
        showBrowserNotification(
            '🏅 NOVA CONQUISTA!',
            `Você desbloqueou o badge "${data.badgeName}"!`,
            { type: 'badge:earned', badgeId: data.badgeId }
        );
    });

    // Listen for admin notifications with video
    socket.on('notification:new', (data) => {
        console.log('[Socket] Admin notification received:', data);

        // Show notification popup with optional video
        showAdminNotification({
            id: data.id,
            title: data.title,
            message: data.message,
            videoUrl: data.videoUrl,
            videoDuration: data.videoDuration,
            xpReward: data.xpReward || 0
        });

        // Also show browser notification
        showBrowserNotification(
            data.title,
            data.message,
            { type: 'notification:new', notificationId: data.id }
        );
    });

    // Listen for GPS auto-checkout event (backend did auto-checkout due to GPS off 60s)
    socket.on('gps:autoCheckout', async (data) => {
        console.log('[Socket] GPS Auto-Checkout received:', data);

        // Hide any GPS warning modals immediately
        hideGPSWarningModal();
        hideGPSOffAlert();

        // Show checkout notification modal
        showGPSAutoCheckoutNotification(data.projectName);

        // Show browser notification
        showBrowserNotification(
            'Check-out Automático Realizado',
            `${data.projectName}: Seu check-out foi realizado automaticamente. Suas horas não serão computadas.`,
            { type: 'gps:autoCheckout', projectId: data.projectId }
        );

        // IMPORTANT: Verify state with backend (source of truth)
        // This ensures frontend state matches backend after auto-checkout
        try {
            await checkActiveCheckin();
            console.log('[GPS] State verified with backend after auto-checkout');
        } catch (error) {
            console.error('[GPS] Error verifying state with backend:', error);
            // Fallback: update local state manually if backend check fails
            isCheckedIn = false;
            activeCheckinId = null;
            currentProjectForCheckin = null;
            pendingCheckoutReason = null;
            updateCheckinUI(false);
        }
    });
}

// =============================================
// ADMIN NOTIFICATION POPUP SYSTEM
// =============================================

let currentNotificationData = null;
let notificationVideoStartTime = null;
let notificationVideoWatchTime = 0;

// Show admin notification popup
function showAdminNotification(notification) {
    currentNotificationData = notification;
    notificationVideoStartTime = null;
    notificationVideoWatchTime = 0;

    // Create notification overlay
    const overlay = document.createElement('div');
    overlay.className = 'notification-popup-overlay';
    overlay.id = 'notificationPopupOverlay';

    const hasVideo = notification.videoUrl && notification.videoUrl.length > 0;
    const videoUrl = hasVideo ? `${API_URL}${notification.videoUrl}` : null;

    // Different layout for video vs text-only notifications
    if (hasVideo) {
        // BANNER STYLE - Video fullscreen with overlay text
        overlay.classList.add('video-mode');
        overlay.innerHTML = `
            <div class="notification-banner">
                <!-- Video Background -->
                <div class="notification-banner-media">
                    <video
                        id="notificationVideo"
                        class="notification-banner-video"
                        src="${videoUrl}"
                        playsinline
                        autoplay
                        muted
                    ></video>
                    <!-- Play button overlay -->
                    <div class="notification-banner-play-btn" id="notificationPlayBtn">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21"/>
                        </svg>
                    </div>
                </div>

                <!-- Top overlay with gradient -->
                <div class="notification-banner-top">
                    <button class="notification-banner-close" id="notificationSkipBtn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                    ${notification.xpReward > 0 ? `
                        <div class="notification-banner-xp">
                            <span class="xp-icon">+${notification.xpReward}</span>
                            <span class="xp-label">XP</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Bottom overlay with content -->
                <div class="notification-banner-bottom">
                    <div class="notification-banner-content">
                        <div class="notification-banner-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                        </div>
                        <h2 class="notification-banner-title">${notification.title}</h2>
                        <p class="notification-banner-message">${notification.message}</p>
                    </div>

                    <!-- Progress bar -->
                    <div class="notification-banner-progress">
                        <div class="notification-banner-progress-bar" id="notificationVideoProgress"></div>
                    </div>

                    <!-- Action buttons -->
                    <div class="notification-banner-actions">
                        ${notification.xpReward > 0 ? `
                            <p class="notification-banner-hint" id="notificationHint">Assista o video completo para ganhar XP</p>
                            <button class="notification-banner-btn primary" id="notificationClaimBtn" disabled>
                                <span class="btn-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                    </svg>
                                </span>
                                <span id="notificationClaimText">Assista para resgatar</span>
                            </button>
                        ` : `
                            <button class="notification-banner-btn primary" id="notificationCloseBtn">
                                <span>Entendi</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    } else {
        // CARD STYLE - Text-only notification (original gamified design)
        overlay.innerHTML = `
            <div class="notification-popup">
                <div class="notification-popup-header">
                    <div class="notification-popup-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                    </div>
                    <h3 class="notification-popup-title">${notification.title}</h3>
                    ${notification.xpReward > 0 ? `<div class="notification-popup-xp-badge">+${notification.xpReward} XP</div>` : ''}
                </div>

                <div class="notification-popup-content">
                    <p class="notification-popup-message">${notification.message}</p>
                </div>

                <div class="notification-popup-footer">
                    <button class="notification-popup-btn primary" id="notificationCloseBtn">Entendi</button>
                </div>
            </div>
        `;
    }

    // Append to phone-frame for mobile positioning (position: absolute)
    const phoneFrame = document.querySelector('.phone-frame');
    if (phoneFrame) {
        phoneFrame.appendChild(overlay);
    } else {
        document.body.appendChild(overlay);
    }

    // Add event listeners based on mode
    if (hasVideo) {
        const video = document.getElementById('notificationVideo');
        const playBtn = document.getElementById('notificationPlayBtn');
        const skipBtn = document.getElementById('notificationSkipBtn');
        const progressBar = document.getElementById('notificationVideoProgress');

        let isPlaying = false;

        // Toggle play/pause on video or play button click
        const togglePlay = () => {
            if (video.paused) {
                video.muted = false;
                video.play();
                playBtn.style.display = 'none';
                isPlaying = true;
            } else {
                video.pause();
                playBtn.style.display = 'flex';
                isPlaying = false;
            }
        };

        playBtn.addEventListener('click', togglePlay);
        video.addEventListener('click', togglePlay);

        video.addEventListener('play', () => {
            if (!notificationVideoStartTime) {
                notificationVideoStartTime = Date.now();
                markNotificationViewed(notification.id, true);
            }
            playBtn.style.display = 'none';
        });

        video.addEventListener('pause', () => {
            if (!video.ended) {
                playBtn.style.display = 'flex';
            }
        });

        video.addEventListener('timeupdate', () => {
            const progress = (video.currentTime / video.duration) * 100;
            progressBar.style.width = `${progress}%`;

            // Check if video is watched completely (95%+)
            if (progress >= 95 && notification.xpReward > 0) {
                const claimBtn = document.getElementById('notificationClaimBtn');
                const claimText = document.getElementById('notificationClaimText');
                const hint = document.getElementById('notificationHint');
                if (claimBtn && !claimBtn.classList.contains('ready')) {
                    claimBtn.disabled = false;
                    claimBtn.classList.add('ready');
                    claimText.textContent = `Resgatar ${notification.xpReward} XP!`;
                    if (hint) hint.textContent = 'Video completo! Resgate seu XP';
                }
            }
        });

        video.addEventListener('ended', () => {
            playBtn.style.display = 'flex';
            if (notification.xpReward > 0) {
                const claimBtn = document.getElementById('notificationClaimBtn');
                const claimText = document.getElementById('notificationClaimText');
                const hint = document.getElementById('notificationHint');
                if (claimBtn) {
                    claimBtn.disabled = false;
                    claimBtn.classList.add('ready');
                    claimText.textContent = `Resgatar ${notification.xpReward} XP!`;
                    if (hint) hint.textContent = 'Video completo! Resgate seu XP';
                }
            }
        });

        if (notification.xpReward > 0) {
            const claimBtn = document.getElementById('notificationClaimBtn');
            claimBtn.addEventListener('click', async () => {
                if (!claimBtn.disabled) {
                    await claimNotificationXP(notification.id);
                    closeNotificationPopup();
                }
            });
        } else {
            const closeBtn = document.getElementById('notificationCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    closeNotificationPopup();
                });
            }
        }

        skipBtn.addEventListener('click', () => {
            closeNotificationPopup();
        });
    } else {
        const closeBtn = document.getElementById('notificationCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                markNotificationViewed(notification.id, false);
                closeNotificationPopup();
            });
        }
    }

    // Animate in
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

// Close notification popup
function closeNotificationPopup() {
    const overlay = document.getElementById('notificationPopupOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
    currentNotificationData = null;
}

// Mark notification as viewed
async function markNotificationViewed(notificationId, videoStarted) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch(`${API_URL}/api/mobile/notifications/${notificationId}/view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ videoStarted })
        });
        console.log('[Notification] Marked as viewed:', notificationId);
    } catch (error) {
        console.error('[Notification] Error marking as viewed:', error);
    }
}

// Claim XP for completed video
async function claimNotificationXP(notificationId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/api/mobile/notifications/${notificationId}/video-complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log('[Notification] XP claimed:', data.data.xpEarned);

            // Show XP gained animation
            showXPGained({
                amount: data.data.xpEarned,
                reason: 'Video assistido!'
            });
        } else {
            console.error('[Notification] Error claiming XP:', data.error);
        }
    } catch (error) {
        console.error('[Notification] Error claiming XP:', error);
    }
}

// =============================================
// PUSH NOTIFICATIONS & SERVICE WORKER
// =============================================

let pushSubscription = null;
let swRegistration = null;

// VAPID public key - needs to match backend
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Register Service Worker and setup push notifications
async function initPushNotifications() {
    if (!('serviceWorker' in navigator)) {
        console.log('[Push] Service Workers not supported');
        return;
    }

    if (!('PushManager' in window)) {
        console.log('[Push] Push notifications not supported');
        return;
    }

    try {
        // Register service worker
        swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Push] Service Worker registered:', swRegistration.scope);

        // Listen for messages from Service Worker
        navigator.serviceWorker.addEventListener('message', async (event) => {
            console.log('[SW Message] Received:', event.data);

            if (event.data.type === 'CLEAR_CAMPAIGN_SEEN') {
                // Clear campaign from seen cache
                const seenCampaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) || '[]');
                const index = seenCampaigns.indexOf(event.data.campaignId);
                if (index > -1) {
                    seenCampaigns.splice(index, 1);
                    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(seenCampaigns));
                    console.log('[Campaign] Cleared from seen cache via SW message:', event.data.campaignId);
                }
            }

            if (event.data.type === 'SHOW_CAMPAIGN') {
                // Fetch campaigns and show the specified one
                await fetchCampaignsFromAPI();
                const campaign = cachedCampaigns.find(c => c.id === event.data.campaignId);
                if (campaign) {
                    setTimeout(() => {
                        showCampaign(campaign);
                    }, 500);
                }
            }

            if (event.data.type === 'DISMISS_REPORT_REMINDER') {
                // Dismiss report reminder via API
                const reminderId = event.data.reminderId;
                if (reminderId) {
                    try {
                        const token = getAuthToken();
                        if (token) {
                            await fetch(`${API_URL}/api/mobile/report-reminders/${reminderId}/dismiss`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            console.log('[Push] Report reminder dismissed:', reminderId);
                        }
                    } catch (error) {
                        console.error('[Push] Error dismissing report reminder:', error);
                    }
                }
            }
        });

        // Request notification permission
        const permission = await Notification.requestPermission();
        console.log('[Push] Notification permission:', permission);

        if (permission === 'granted') {
            await subscribeToPush();
        }
    } catch (error) {
        console.error('[Push] Error initializing push notifications:', error);
    }
}

// Subscribe to push notifications
async function subscribeToPush() {
    try {
        if (!swRegistration) {
            console.log('[Push] No service worker registration');
            return;
        }

        // Check for existing subscription
        pushSubscription = await swRegistration.pushManager.getSubscription();

        if (!pushSubscription) {
            // Create new subscription
            const options = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            };
            pushSubscription = await swRegistration.pushManager.subscribe(options);
            console.log('[Push] New subscription created');
        } else {
            console.log('[Push] Using existing subscription');
        }

        // Send subscription to server
        await sendSubscriptionToServer(pushSubscription);

    } catch (error) {
        console.error('[Push] Error subscribing to push:', error);
    }
}

// Send subscription to backend
async function sendSubscriptionToServer(subscription) {
    const token = getAuthToken();
    if (!token) {
        console.log('[Push] No auth token, cannot save subscription');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/mobile/push-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                subscription: subscription.toJSON()
            })
        });

        if (response.ok) {
            console.log('[Push] Subscription saved to server');
        } else {
            console.error('[Push] Failed to save subscription:', await response.text());
        }
    } catch (error) {
        console.error('[Push] Error saving subscription:', error);
    }
}

// =============================================
// TOAST NOTIFICATIONS (IN-APP)
// =============================================

// Show a toast notification in the app
function showToast(message, type = 'info', duration = 4000) {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    // Icon based on type
    let icon = '💬';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'campaign') icon = '🏳️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Add to body
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);

    console.log(`[Toast] ${type}: ${message}`);
}

// =============================================
// GAME-STYLE ALERT (Dramatic notifications)
// =============================================

/**
 * Show a dramatic game-style alert
 * @param {Object} options - Alert options
 * @param {string} options.type - 'removed' | 'success' | 'xp' | 'warning'
 * @param {string} options.icon - Emoji or text for the icon
 * @param {string} options.title - Alert title
 * @param {string} options.message - Alert message
 * @param {string} options.buttonText - Button text (default: 'OK')
 * @param {Function} options.onClose - Callback when closed
 */
function showGameAlert(options = {}) {
    const {
        type = 'warning',
        icon = '⚠️',
        title = 'ALERTA',
        message = '',
        buttonText = 'ENTENDI',
        onClose = null
    } = options;

    // Remove any existing alert
    const existingAlert = document.querySelector('.game-alert-overlay');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-alert-overlay';

    // Generate random particles
    const particlesHtml = Array.from({ length: 8 }, (_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 2;
        return `<div class="game-alert-particle" style="left: ${left}%; top: ${top}%; animation-delay: ${delay}s;"></div>`;
    }).join('');

    // Create alert content
    overlay.innerHTML = `
        <div class="game-alert game-alert-${type}">
            <div class="game-alert-particles">${particlesHtml}</div>
            <div class="game-alert-icon">${icon}</div>
            <h2 class="game-alert-title">${title}</h2>
            <p class="game-alert-message">${message}</p>
            <button class="game-alert-btn">${buttonText}</button>
        </div>
    `;

    // Add to body
    document.body.appendChild(overlay);

    // Vibrate if supported (mobile)
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }

    // Close on button click
    const btn = overlay.querySelector('.game-alert-btn');
    btn.addEventListener('click', () => {
        overlay.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            overlay.remove();
            if (onClose) onClose();
        }, 300);
    });

    // Close on overlay click (outside alert)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                overlay.remove();
                if (onClose) onClose();
            }, 300);
        }
    });

    console.log(`[GameAlert] ${type}: ${title} - ${message}`);
}

// =============================================
// XP GAIN ANIMATION (Gamified XP notification)
// =============================================

/**
 * Show XP gain animation
 * @param {number} amount - Amount of XP gained
 * @param {string} reason - Reason for gaining XP (optional)
 */
function showXPGain(amount, reason = '') {
    // Remove any existing XP overlay
    const existingOverlay = document.querySelector('.xp-gain-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'xp-gain-overlay';

    // Generate confetti particles (reduced for mobile performance)
    const confettiColors = ['#fbbf24', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
    const confettiHtml = Array.from({ length: 30 }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 1.5 + Math.random() * 1.5;
        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const size = 5 + Math.random() * 6;
        const rotation = Math.random() * 360;
        const type = Math.random() > 0.5 ? 'confetti-rect' : 'confetti-circle';
        return `<div class="xp-confetti ${type}" style="left: ${left}%; background: ${color}; width: ${size}px; height: ${size * (type === 'confetti-rect' ? 0.4 : 1)}px; animation-delay: ${delay}s; animation-duration: ${duration}s; --rotation: ${rotation}deg;"></div>`;
    }).join('');

    // Generate floating stars (main element - replacing coins)
    const floatingStarsHtml = Array.from({ length: 6 }, (_, i) => {
        const left = 15 + Math.random() * 70;
        const delay = Math.random() * 0.5;
        return `<div class="xp-floating-star" style="left: ${left}%; animation-delay: ${delay}s;">⭐</div>`;
    }).join('');

    // Generate star bursts radiating from center
    const starsHtml = Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360;
        const distance = 60 + Math.random() * 40;
        const delay = Math.random() * 0.2;
        return `<div class="xp-star-burst" style="--angle: ${angle}deg; --distance: ${distance}px; animation-delay: ${delay}s;">⭐</div>`;
    }).join('');

    // Generate expanding rings
    const ringsHtml = Array.from({ length: 2 }, (_, i) => {
        return `<div class="xp-ring" style="animation-delay: ${i * 0.3}s;"></div>`;
    }).join('');

    // Create content - Mobile optimized layout
    overlay.innerHTML = `
        <div class="xp-gain-container">
            <div class="xp-rings-container">${ringsHtml}</div>
            <div class="xp-rays-new"></div>
            <div class="xp-glow-burst"></div>
            <div class="xp-icon-container">
                <div class="xp-icon-bg"></div>
                <div class="xp-icon-main">🏆</div>
                <div class="xp-icon-star">⭐</div>
            </div>
            <div class="xp-amount-container">
                <div class="xp-amount-value">+${amount}</div>
                <div class="xp-amount-label">XP</div>
            </div>
            ${reason ? `<div class="xp-reason-new">${reason}</div>` : ''}
            <button class="xp-gain-continue-btn">Continuar</button>
            <div class="xp-confetti-container">${confettiHtml}</div>
            <div class="xp-floating-stars-container">${floatingStarsHtml}</div>
            <div class="xp-stars-container">${starsHtml}</div>
        </div>
    `;

    // Add to body
    document.body.appendChild(overlay);

    // Close on button click
    const closeOverlay = () => {
        overlay.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => overlay.remove(), 500);
    };

    overlay.querySelector('.xp-gain-continue-btn').addEventListener('click', closeOverlay);

    // Vibrate celebration pattern (mobile)
    if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50, 30, 100, 50, 150]);
    }

    // Play celebration sound
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVwvYKHcvnhPIzRXltzQn2k+MFGb3tKtf09ALGul4NSwhVRBKWai39WyildGJ2Wh3tWvg1VHJ2Wh3tWwg1VHKGag3dOuglVGJ2ah3dOuglZHJ2ag3dOug1ZHJ2ag3dOug1ZH');
        audio.volume = 0.4;
        audio.playbackRate = 1.2;
        audio.play().catch(() => {});
    } catch (e) {}

    console.log(`[XP Animation] +${amount} XP${reason ? ` - ${reason}` : ''}`);
}

/**
 * Show XP loss animation (same style as showXPGain but red theme)
 * @param {number} amount - Amount of XP lost (positive number)
 * @param {string} reason - Reason for the loss
 */
function showXPLoss(amount, reason = '') {
    // Remove any existing XP overlay
    const existingOverlay = document.querySelector('.xp-loss-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'xp-loss-overlay';

    // Generate falling broken stars (reduced for mobile)
    const fallingStarsHtml = Array.from({ length: 8 }, (_, i) => {
        const left = 15 + Math.random() * 70;
        const delay = Math.random() * 0.4;
        return `<div class="xp-falling-star" style="left: ${left}%; animation-delay: ${delay}s;">⭐</div>`;
    }).join('');

    // Generate falling XP numbers
    const fallingHtml = Array.from({ length: 6 }, (_, i) => {
        const left = 15 + Math.random() * 70;
        const delay = Math.random() * 0.4;
        const smallAmount = Math.floor(amount / 3);
        return `<div class="xp-falling-number" style="left: ${left}%; animation-delay: ${delay}s;">-${smallAmount}</div>`;
    }).join('');

    // Generate crack lines (reduced for mobile)
    const cracksHtml = Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * 360;
        const length = 40 + Math.random() * 60;
        return `<div class="xp-crack" style="--angle: ${angle}deg; --length: ${length}px;"></div>`;
    }).join('');

    // Create content - Mobile optimized
    overlay.innerHTML = `
        <div class="xp-loss-container">
            <div class="xp-loss-vignette"></div>
            <div class="xp-loss-flash-new"></div>
            <div class="xp-cracks-container">${cracksHtml}</div>
            <div class="xp-loss-icon-container">
                <div class="xp-loss-icon-bg"></div>
                <div class="xp-loss-icon-main">😢</div>
                <div class="xp-loss-icon-star">⭐</div>
                <div class="xp-loss-icon-crack"></div>
            </div>
            <div class="xp-loss-amount-container">
                <div class="xp-loss-value">-${amount}</div>
                <div class="xp-loss-label">XP</div>
            </div>
            ${reason ? `<div class="xp-loss-reason-new">${reason}</div>` : ''}
            <button class="xp-loss-continue-btn">Continuar</button>
            <div class="xp-falling-stars-container">${fallingStarsHtml}</div>
            <div class="xp-falling-container">${fallingHtml}</div>
        </div>
    `;

    // Add to body
    document.body.appendChild(overlay);

    // Close on button click
    const closeOverlay = () => {
        overlay.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => overlay.remove(), 500);
    };

    overlay.querySelector('.xp-loss-continue-btn').addEventListener('click', closeOverlay);

    // Intense vibration pattern for loss (mobile)
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300, 100, 400]);
    }

    // Play dramatic loss sound
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVwvYKHcvnhPIzRXltzQn2k+MFGb3tKtf09ALGul4NSwhVRBKWai39WyildGJ2Wh3tWvg1VHJ2Wh3tWwg1VHKGag3dOuglVGJ2ah3dOuglZHJ2ag3dOug1ZHJ2ag3dOug1ZH');
        audio.volume = 0.5;
        audio.playbackRate = 0.5;
        audio.play().catch(() => {});
    } catch (e) {}

    console.log(`[XP Animation] -${amount} XP${reason ? ` - ${reason}` : ''}`);
}

// =============================================
// CAMPAIGN WINNER ANIMATION (Victory celebration)
// =============================================

/**
 * Show campaign winner celebration animation
 * @param {Object} options - Winner options
 * @param {string} options.campaignName - Name of the campaign
 * @param {number} options.position - Position (1st, 2nd, 3rd, etc.)
 * @param {number} options.xpReward - XP reward amount
 * @param {string} options.prize - Prize description (optional)
 */
function showCampaignWinner(options = {}) {
    const {
        campaignName = 'Campanha',
        position = 1,
        xpReward = 0,
        prize = ''
    } = options;

    // Remove any existing winner overlay
    const existingOverlay = document.querySelector('.winner-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'winner-overlay';

    // Generate confetti
    const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD'];
    const confettiHtml = Array.from({ length: 30 }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const size = 8 + Math.random() * 8;
        const rotation = Math.random() * 360;
        return `<div class="winner-confetti" style="left: ${left}%; animation-delay: ${delay}s; background: ${color}; width: ${size}px; height: ${size}px; transform: rotate(${rotation}deg);"></div>`;
    }).join('');

    // Generate stars
    const starsHtml = Array.from({ length: 15 }, (_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 2;
        const size = 0.5 + Math.random() * 1;
        return `<div class="winner-star" style="left: ${left}%; top: ${top}%; animation-delay: ${delay}s; transform: scale(${size});">✦</div>`;
    }).join('');

    // Position text
    const positionText = position === 1 ? '1º LUGAR' : position === 2 ? '2º LUGAR' : position === 3 ? '3º LUGAR' : `${position}º LUGAR`;
    const positionClass = position <= 3 ? `position-${position}` : '';

    // Create content
    overlay.innerHTML = `
        <div class="winner-container">
            <div class="winner-confetti-container">${confettiHtml}</div>
            <div class="winner-stars-container">${starsHtml}</div>

            <div class="winner-crown">👑</div>
            <div class="winner-ring"></div>
            <div class="winner-skull">💀</div>

            <div class="winner-position ${positionClass}">${positionText}</div>
            <h2 class="winner-title">VENCEDOR!</h2>
            <p class="winner-campaign">${campaignName}</p>

            ${xpReward > 0 ? `<div class="winner-xp">+${xpReward} XP</div>` : ''}
            ${prize ? `<div class="winner-prize">🎁 ${prize}</div>` : ''}

            <button class="winner-btn">INCRÍVEL!</button>
        </div>
    `;

    // Add to body
    document.body.appendChild(overlay);

    // Vibrate if supported (mobile) - victory pattern
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200, 100, 300]);
    }

    // Play victory sound (if available)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVwvYKHcvnhPIzRXltzQn2k+MFGb3tKtf09ALGul4NSwhVRBKWai39WyildGJ2Wh3tWvg1VHJ2Wh3tWwg1VHKGag3dOuglVGJ2ah3dOuglZHJ2ag3dOug1ZHJ2ag3dOug1ZH');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch (e) {}

    // Close on button click
    const btn = overlay.querySelector('.winner-btn');
    btn.addEventListener('click', () => {
        overlay.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => overlay.remove(), 500);
    });

    // Close on overlay click (outside content)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => overlay.remove(), 500);
        }
    });

    console.log(`[Winner Animation] ${positionText} - ${campaignName}${xpReward ? ` (+${xpReward} XP)` : ''}`);
}

/**
 * Show badge earned celebration overlay
 * @param {string} options.badgeName - Name of the badge
 * @param {string} options.badgeIconUrl - URL of the badge icon
 * @param {string} options.badgeColor - Color of the badge
 * @param {string} options.badgeRarity - Rarity level (COMMON, RARE, EPIC, LEGENDARY)
 * @param {string} options.reason - Reason for earning the badge
 * @param {string} options.campaignName - Campaign name (if from campaign)
 */
function showBadgeEarned(options = {}) {
    const {
        badgeName = 'Badge',
        badgeIconUrl = '',
        badgeColor = '#c9a962',
        badgeRarity = 'COMMON',
        reason = '',
        campaignName = ''
    } = options;

    // Remove any existing badge overlay
    const existingOverlay = document.querySelector('.badge-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'badge-overlay';

    // Get rarity color and label
    const getRarityColor = (rarity) => {
        switch (rarity) {
            case 'LEGENDARY': return '#FFD700';
            case 'EPIC': return '#9B59B6';
            case 'RARE': return '#3498DB';
            default: return '#95A5A6';
        }
    };

    const getRarityLabel = (rarity) => {
        switch (rarity) {
            case 'LEGENDARY': return 'LENDARIO';
            case 'EPIC': return 'EPICO';
            case 'RARE': return 'RARO';
            default: return 'COMUM';
        }
    };

    const rarityColor = getRarityColor(badgeRarity);
    const rarityLabel = getRarityLabel(badgeRarity);

    // Generate sparkles based on rarity
    const sparkleCount = badgeRarity === 'LEGENDARY' ? 25 : badgeRarity === 'EPIC' ? 18 : badgeRarity === 'RARE' ? 12 : 8;
    const sparklesHtml = Array.from({ length: sparkleCount }, (_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 2;
        const size = 0.5 + Math.random() * 0.8;
        return `<div class="badge-sparkle" style="left: ${left}%; top: ${top}%; animation-delay: ${delay}s; transform: scale(${size}); color: ${rarityColor};">✦</div>`;
    }).join('');

    // Generate ring particles
    const particlesHtml = Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360;
        const delay = (i / 12) * 0.5;
        return `<div class="badge-particle" style="--angle: ${angle}deg; animation-delay: ${delay}s; background: ${badgeColor};"></div>`;
    }).join('');

    // Badge icon or placeholder
    const badgeIconHtml = badgeIconUrl
        ? `<img src="${badgeIconUrl.startsWith('http') ? badgeIconUrl : API_URL + badgeIconUrl}" alt="${badgeName}" class="badge-earned-icon" />`
        : `<span class="badge-earned-placeholder">🏅</span>`;

    // Create content
    overlay.innerHTML = `
        <div class="badge-earned-container">
            <div class="badge-sparkles-container">${sparklesHtml}</div>

            <div class="badge-earned-ring" style="border-color: ${badgeColor};">
                <div class="badge-earned-glow" style="box-shadow: 0 0 60px ${badgeColor}, 0 0 100px ${badgeColor}40;"></div>
                ${badgeIconHtml}
            </div>

            <div class="badge-particles-container">${particlesHtml}</div>

            <div class="badge-earned-rarity" style="color: ${rarityColor};">${rarityLabel}</div>
            <h2 class="badge-earned-title">NOVA CONQUISTA!</h2>
            <p class="badge-earned-name" style="color: ${badgeColor};">${badgeName}</p>

            ${reason ? `<p class="badge-earned-reason">${reason}</p>` : ''}
            ${campaignName ? `<p class="badge-earned-campaign">Campanha: ${campaignName}</p>` : ''}

            <button class="badge-earned-btn" style="background: ${badgeColor};">MUITO BOM!</button>
        </div>
    `;

    // Add to body
    document.body.appendChild(overlay);

    // Vibrate if supported (mobile) - achievement pattern
    if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50, 30, 100, 50, 200]);
    }

    // Play achievement sound
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVwvYKHcvnhPIzRXltzQn2k+MFGb3tKtf09ALGul4NSwhVRBKWai39WyildGJ2Wh3tWvg1VHJ2Wh3tWwg1VHKGag3dOuglVGJ2ah3dOuglZHJ2ag3dOug1ZHJ2ag3dOug1ZH');
        audio.volume = 0.4;
        audio.play().catch(() => {});
    } catch (e) {}

    // Close on button click
    const btn = overlay.querySelector('.badge-earned-btn');
    btn.addEventListener('click', () => {
        overlay.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => overlay.remove(), 500);
    });

    // Close on overlay click (outside content)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => overlay.remove(), 500);
        }
    });

    console.log(`[Badge Animation] ${badgeName} - ${rarityLabel}${reason ? ` (${reason})` : ''}`);
}

// Show browser notification (for when app is in foreground)
function showBrowserNotification(title, body, data = {}) {
    if (!('Notification' in window)) {
        console.log('[Notification] Not supported');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.log('[Notification] Permission not granted');
        return;
    }

    try {
        const notification = new Notification(title, {
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            tag: data.type || 'monofloor-notification',
            data: data,
            vibrate: [200, 100, 200],
            requireInteraction: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        console.log('[Notification] Shown:', title);
    } catch (error) {
        console.error('[Notification] Error showing notification:', error);
    }
}

// Helper: Convert base64 to Uint8Array (for VAPID key)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Get current user ID from stored profile
function getCurrentUserId() {
    try {
        const profile = localStorage.getItem('userProfile');
        if (profile) {
            const parsed = JSON.parse(profile);
            return parsed.id || null;
        }
        // Try to get from token
        const token = getAuthToken();
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || null;
        }
    } catch (error) {
        console.log('Error getting user ID:', error);
    }
    return null;
}

// Handle lunch reminder
function handleLunchReminder(data) {
    // Don't show if recently dismissed (within 25 minutes)
    if (lunchReminderDismissed && lastLunchReminderTime) {
        const timeSinceDismiss = Date.now() - lastLunchReminderTime;
        if (timeSinceDismiss < 25 * 60 * 1000) {
            console.log('Lunch reminder dismissed recently, skipping');
            return;
        }
    }

    // Only show if user has active check-in
    if (!activeCheckinId) {
        console.log('No active check-in, skipping lunch reminder');
        return;
    }

    // Update message based on reminder number
    const messageEl = document.getElementById('lunch-message');
    if (messageEl) {
        if (data.reminderNumber === 1) {
            messageEl.textContent = 'Esta na hora de fazer uma pausa para o almoco.';
        } else if (data.reminderNumber === 2) {
            messageEl.textContent = 'Lembrete: voce ainda nao fez pausa para o almoco!';
        } else {
            messageEl.textContent = 'Ultimo lembrete: o horario de almoco esta acabando!';
        }
    }

    showLunchReminderModal();

    // Request browser notification permission and show notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Hora do Almoco!', {
            body: 'Esta na hora de fazer uma pausa para o almoco.',
            icon: 'logo.png',
            tag: 'lunch-reminder',
            requireInteraction: true
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Hora do Almoco!', {
                    body: 'Esta na hora de fazer uma pausa para o almoco.',
                    icon: 'logo.png',
                    tag: 'lunch-reminder'
                });
            }
        });
    }
}

// Handle leaving area prompt during lunch
function handleLeavingPrompt(data) {
    // Only show if user has active check-in
    if (!activeCheckinId) {
        return;
    }

    showLeavingModal();
}

// Show lunch reminder modal
function showLunchReminderModal() {
    const modal = document.getElementById('lunch-reminder-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Hide lunch reminder modal
function hideLunchReminderModal() {
    const modal = document.getElementById('lunch-reminder-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Start lunch break (do checkout with ALMOCO_INTERVALO reason)
async function startLunchBreak() {
    hideLunchReminderModal();

    if (activeCheckinId) {
        // Do checkout with lunch reason
        await doCheckoutWithReason('ALMOCO_INTERVALO');
    }
}

// Dismiss lunch reminder
function dismissLunchReminder() {
    hideLunchReminderModal();
    lunchReminderDismissed = true;
    lastLunchReminderTime = Date.now();
}

// Show leaving area modal
function showLeavingModal() {
    const modal = document.getElementById('lunch-leaving-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Hide leaving area modal
function hideLeavingModal() {
    const modal = document.getElementById('lunch-leaving-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Confirm leaving reason and checkout
async function confirmLeavingReason(reason) {
    hideLeavingModal();

    if (!activeCheckinId) return;

    // Store the reason for later use
    pendingCheckoutReason = reason;

    // For "Outro projeto" and "Fim expediente", show task completion flow
    if (reason === 'OUTRO_PROJETO' || reason === 'FIM_EXPEDIENTE') {
        await showTaskCompletionModal();
    } else {
        // For lunch/supplies, do regular checkout
        await doCheckoutWithReason(reason);
    }
}

// Dismiss leaving modal (continue working)
function dismissLeavingModal() {
    hideLeavingModal();
}

// Do checkout with a specific reason (bypassing modal)
// Returns true if checkout was successful, false otherwise
async function doCheckoutWithReason(reason, showMessages = true) {
    if (!activeCheckinId) {
        console.error('No active checkin');
        return false;
    }

    const checkinIdToCheckout = activeCheckinId; // Save before clearing

    try {
        // Get current location (if available)
        let latitude = null;
        let longitude = null;

        if (navigator.geolocation && locationPermissionStatus === 'granted') {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (geoError) {
                console.log('Geolocation not available:', geoError);
            }
        }

        console.log(`[Checkout] Attempting checkout for checkin ${checkinIdToCheckout} with reason: ${reason}`);

        const response = await fetch(`${API_URL}/api/mobile/checkins/${checkinIdToCheckout}/checkout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                latitude,
                longitude,
                reason: reason
            })
        });

        const data = await response.json();
        console.log('[Checkout] API response:', data);

        if (data.success) {
            isCheckedIn = false;
            activeCheckinId = null;
            currentProjectForCheckin = null;
            pendingCheckoutReason = null; // Clear to prevent stale values
            updateCheckinUI(false);

            // Stop GPS background verification
            stopGPSBackgroundVerification();

            // Restart tracking with new interval
            restartLocationTracking();

            const hoursWorked = data.data.hoursWorked ? data.data.hoursWorked.toFixed(1) : '0';

            if (showMessages) {
                // Mostrar XP ganho se disponível
                if (data.xp) {
                    // Atualizar XP na tela de perfil se existir
                    updateUserXP(data.xp.total, data.xp.level);
                    // Mostrar modal de XP (fullscreen mobile) - usa razão da API
                    showXPNotification(data.xp.earned, data.xp.reason, data.xp.total);
                } else {
                    // Se não tiver XP, mostrar modal de sucesso normal
                    let message = '';
                    switch(reason) {
                        case 'ALMOCO_INTERVALO':
                            message = `Pausa para almoco registrada. Voce trabalhou ${hoursWorked}h neste periodo.`;
                            break;
                        case 'COMPRA_INSUMOS':
                            message = `Compra de insumos registrada. Voce trabalhou ${hoursWorked}h neste periodo.`;
                            break;
                        case 'OUTRO_PROJETO':
                            message = `Check-out realizado. Voce trabalhou ${hoursWorked}h. Pode fazer check-in em outro projeto.`;
                            break;
                        case 'FIM_EXPEDIENTE':
                            message = `Expediente encerrado. Voce trabalhou ${hoursWorked}h hoje. Bom descanso!`;
                            break;
                        case 'GPS_DESATIVADO':
                            message = `Checkout automático por GPS desativado. Voce trabalhou ${hoursWorked}h.`;
                            break;
                        default:
                            message = `Check-out realizado. Voce trabalhou ${hoursWorked}h.`;
                    }
                    showSuccessModal('Check-out Realizado', message);
                }
            }

            console.log('[Checkout] SUCCESS - checkout completed');
            return true;
        } else {
            console.error('[Checkout] FAILED - API returned error:', data.error);
            if (showMessages) {
                showSuccessModal('Erro', 'Nao foi possivel fazer o check-out. Tente novamente.');
            }
            return false;
        }
    } catch (error) {
        console.error('[Checkout] FAILED - Exception:', error);
        if (showMessages) {
            showSuccessModal('Erro', 'Erro de conexao. Tente novamente.');
        }
        return false;
    }
}

// Check if currently lunch time (12:00 - 13:00 São Paulo time)
function isLunchTime() {
    const now = new Date();
    // Get São Paulo time
    const spTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hour = spTime.getHours();
    return hour >= 12 && hour < 13;
}

// Local lunch reminder check (fallback if socket fails)
let localLunchCheckInterval = null;

function startLocalLunchCheck() {
    if (localLunchCheckInterval) {
        clearInterval(localLunchCheckInterval);
    }

    // Check every 5 minutes
    localLunchCheckInterval = setInterval(() => {
        if (isLunchTime() && activeCheckinId && !lunchReminderDismissed) {
            // Check if we haven't shown a reminder in the last 25 minutes
            if (!lastLunchReminderTime || Date.now() - lastLunchReminderTime > 25 * 60 * 1000) {
                handleLunchReminder({ reminderNumber: 1, local: true });
            }
        }

        // Reset dismissed flag at 13:00
        const now = new Date();
        const spTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        if (spTime.getHours() >= 13) {
            lunchReminderDismissed = false;
        }
    }, 5 * 60 * 1000); // Every 5 minutes
}

// Initialize location system on app startup
async function initLocationSystem() {
    // Initialize network monitoring
    initNetworkMonitoring();

    // Initialize battery monitoring
    await initBatteryMonitoring();

    // Initialize Socket.io connection for real-time notifications
    initSocketConnection();

    // Initialize push notifications (Service Worker)
    initPushNotifications();

    // Start local lunch reminder check (fallback)
    startLocalLunchCheck();

    // Check current permission status
    const status = await checkLocationPermission();

    if (status === 'granted') {
        locationPermissionStatus = 'granted';
        startLocationTracking();
    } else if (status === 'denied') {
        locationPermissionStatus = 'denied';
        showLocationDeniedBanner();
    } else {
        // Permission is 'prompt' or 'unknown' - show consent modal
        showLocationConsentModal();
    }
}

// Helper to get full photo URL with cache busting
function getPhotoUrl(photoUrl, bustCache = false) {
    if (!photoUrl) return null;
    let url = photoUrl.startsWith('http') ? photoUrl : `${API_URL}${photoUrl}`;
    if (bustCache) {
        url += (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    return url;
}

// Note: compressImage is defined below with options object support

// Get initials from name
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Render avatar (photo or initials)
function renderAvatar(photoUrl, name, size = 40) {
    const photo = getPhotoUrl(photoUrl);
    const initials = getInitials(name);

    if (photo) {
        return `<img src="${photo}" alt="Avatar" class="avatar-img" style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover;">`;
    }
    return initials;
}

// Navigation - definido no final do arquivo com lógica de recarregamento

function updateBottomNav(screenId) {
    const navMap = {
        'screen-projects': 0,
        'screen-project-detail': 0,
        'screen-feed': 1,
        'screen-new-post': 1,
        'screen-comments': 1,
        'screen-hours': 2,
        'screen-learn': 3,
        'screen-profile': 4
    };

    document.querySelectorAll('.bottom-nav').forEach(nav => {
        const items = nav.querySelectorAll('.nav-item');
        items.forEach((item, index) => {
            item.classList.remove('active');
            if (navMap[screenId] === index) {
                item.classList.add('active');
            }
        });
    });
}

// =============================================
// PASSWORD VISIBILITY TOGGLE
// =============================================
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const eyeIcon = button.querySelector('.eye-icon');
    const eyeOffIcon = button.querySelector('.eye-off-icon');

    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
    } else {
        input.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
    }
}

// =============================================
// LOGIN FUNCTIONALITY
// =============================================
async function doLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Por favor, preencha e-mail e senha.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/mobile/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Salvar credenciais para auto-preenchimento futuro
            localStorage.setItem('savedEmail', email);
            localStorage.setItem('savedPassword', password);

            navigateTo('screen-projects');
            loadProjects();

            // Start onboarding after a delay (if not completed before)
            setTimeout(() => {
                const userRole = data.data.user.role || 'AUXILIAR';
                startOnboarding(userRole);
            }, 1000);

            // Check and show campaigns after onboarding (or if onboarding was already done)
            // Wait longer to allow onboarding to complete first
            setTimeout(() => {
                // Only show campaigns if onboarding is not showing (existing user)
                if (hasCompletedOnboarding()) {
                    checkAndShowCampaigns(false); // false = existing user, immediate + notification
                }
            }, 3000);
        } else {
            if (data.error?.code === 'PENDING_APPROVAL') {
                navigateTo('screen-pending-approval');
            } else {
                alert(data.error?.message || 'Credenciais invalidas');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        // For demo, allow login anyway
        navigateTo('screen-projects');
    }
}

// Preencher campos de login com credenciais salvas
function fillSavedCredentials() {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }
    if (savedPassword && passwordInput) {
        passwordInput.value = savedPassword;
    }
}

// =============================================
// REGISTRATION DATA STORAGE
// =============================================
const registrationData = {
    name: '',
    username: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    documentFile: null,
    profilePhotoFile: null
};

// =============================================
// FORMAT FUNCTIONS
// =============================================
function formatCPF(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 9) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    input.value = value;
}

function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
        value = value.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }

    input.value = value;
}

// =============================================
// REGISTRATION STEP 1 - Personal Data
// =============================================
function goToStep2() {
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const cpf = document.getElementById('regCpf').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    // Validations
    if (!name || !username || !email || !cpf || !password || !passwordConfirm) {
        alert('Por favor, preencha todos os campos obrigatorios.');
        return;
    }

    if (!validateEmail(email)) {
        alert('Por favor, insira um e-mail valido.');
        return;
    }

    if (!validateCPF(cpf)) {
        alert('Por favor, insira um CPF valido.');
        return;
    }

    if (password.length < 8) {
        alert('A senha deve ter no minimo 8 caracteres.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('As senhas nao conferem.');
        return;
    }

    // Store data
    registrationData.name = name;
    registrationData.username = username;
    registrationData.email = email;
    registrationData.cpf = cpf;
    registrationData.phone = phone;
    registrationData.password = password;

    navigateTo('screen-register-step2');
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    return cpf.length === 11;
}

// =============================================
// REGISTRATION STEP 2 - Document Upload
// =============================================
function previewDocument(input) {
    if (input.files && input.files[0]) {
        registrationData.documentFile = input.files[0];

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('documentPreview');
            const placeholder = document.getElementById('documentPlaceholder');
            const success = document.getElementById('documentSuccess');
            const uploadArea = document.getElementById('documentUploadArea');

            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            success.style.display = 'flex';
            uploadArea.classList.add('has-image');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function goToStep3() {
    if (!registrationData.documentFile) {
        alert('Por favor, envie uma foto do seu documento.');
        return;
    }
    navigateTo('screen-register-step3');
}

// =============================================
// REGISTRATION STEP 3 - Profile Photo
// =============================================
async function previewProfilePhoto(input) {
    if (input.files && input.files[0]) {
        const originalFile = input.files[0];

        // Show loading
        const placeholder = document.getElementById('profilePhotoPlaceholder');
        if (placeholder) {
            placeholder.innerHTML = '<div class="loading-spinner-small"></div>';
        }

        // Compress the image
        const compressedFile = await compressImage(originalFile, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
        registrationData.profilePhotoFile = compressedFile;

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('profilePhotoPreview');

            preview.src = e.target.result;
            preview.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        };
        reader.readAsDataURL(compressedFile);
    }
}

async function submitRegistration() {
    if (!registrationData.profilePhotoFile) {
        alert('Por favor, adicione uma foto de perfil.');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#screen-register-step3 .btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    try {
        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append('name', registrationData.name);
        formData.append('username', registrationData.username);
        formData.append('email', registrationData.email);
        formData.append('cpf', registrationData.cpf.replace(/\D/g, ''));
        formData.append('phone', registrationData.phone.replace(/\D/g, ''));
        formData.append('password', registrationData.password);
        formData.append('document', registrationData.documentFile);
        formData.append('profilePhoto', registrationData.profilePhotoFile);

        const response = await fetch(`${API_URL}/api/auth/mobile/register`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            // Clear registration data
            clearRegistrationData();
            navigateTo('screen-pending-approval');
        } else {
            alert(data.error?.message || 'Erro ao criar conta. Tente novamente.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        // For demo, show success anyway
        clearRegistrationData();
        navigateTo('screen-pending-approval');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function clearRegistrationData() {
    registrationData.name = '';
    registrationData.username = '';
    registrationData.email = '';
    registrationData.cpf = '';
    registrationData.phone = '';
    registrationData.password = '';
    registrationData.documentFile = null;
    registrationData.profilePhotoFile = null;

    // Clear form fields
    document.getElementById('regName').value = '';
    document.getElementById('regUsername').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regCpf').value = '';
    document.getElementById('regPhone').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPasswordConfirm').value = '';
}

// Profile Photo Preview (legacy - for old screen)
function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            const placeholder = document.getElementById('photoPlaceholder');
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Create Profile (legacy)
function createProfile() {
    const name = document.getElementById('profileName').value;
    const username = document.getElementById('profileUsername').value;

    if (name && username) {
        showSuccessModal('Conta Criada!', 'Bem-vindo a equipe Monofloor, ' + name.split(' ')[0] + '!');
    } else {
        alert('Por favor, preencha todos os campos obrigatorios.');
    }
}

// Check-in functionality
let isCheckedIn = false;
let activeCheckinId = null;
let currentProjectForCheckin = null;

// Task completion flow variables
let pendingCheckoutReason = null;
let currentProjectTasks = null;
let selectedTaskIds = [];
let allProjectTasksFromModal = [];

// =============================================
// GEOFENCING SYSTEM
// =============================================
const GEOFENCE_RADIUS_METERS = 200; // Raio do geofencing em metros
let geolocationWatchId = null;
let currentUserLocation = null;
let geolocationState = 'loading'; // 'loading' | 'valid' | 'invalid' | 'error' | 'permission_denied'
let currentDistanceToProject = null;

// =============================================
// AUTO-CHECKOUT SYSTEM (quando sai da área >100m)
// =============================================
const AUTO_CHECKOUT_DISTANCE_METERS = 100; // Distância para trigger de auto-checkout
const AUTO_CHECKOUT_COUNTDOWN_SECONDS = 30; // Tempo para responder antes do auto-checkout
let autoCheckoutCountdownInterval = null;
let autoCheckoutTimeRemaining = AUTO_CHECKOUT_COUNTDOWN_SECONDS;
let isAutoCheckoutWarningShown = false; // Evitar múltiplos alertas
let lastAutoCheckoutCheckinId = null; // ID do último checkout automático (para justificativa)

// Fórmula Haversine para calcular distância entre dois pontos
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Raio da Terra em metros
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
}

// Verificar se usuário está dentro do geofence do projeto
function checkGeofence(userLat, userLon, projectLat, projectLon) {
    const distance = haversineDistance(userLat, userLon, projectLat, projectLon);
    currentDistanceToProject = Math.round(distance);
    return {
        isWithinGeofence: distance <= GEOFENCE_RADIUS_METERS,
        distance: currentDistanceToProject
    };
}

// Obter coordenadas do projeto atual
function getProjectCoordinates() {
    if (!selectedProject) return null;

    // Verificar se o projeto tem coordenadas
    if (selectedProject.latitude && selectedProject.longitude) {
        return {
            lat: parseFloat(selectedProject.latitude),
            lon: parseFloat(selectedProject.longitude)
        };
    }

    // Coordenadas padrão para demo (São Paulo centro)
    // Em produção, todos os projetos devem ter coordenadas reais
    return {
        lat: -23.5505,
        lon: -46.6333
    };
}

// Atualizar UI do card de localização
function updateLocationUI() {
    const card = document.getElementById('locationCheckCard');
    const checkinBtn = document.getElementById('checkinBtn');
    if (!card) return;

    const iconContainer = card.querySelector('.location-status-icon');
    const statusMain = card.querySelector('.status-main');
    const statusSub = card.querySelector('.status-sub');

    // Remover classes anteriores
    card.classList.remove('valid', 'invalid', 'loading', 'error');
    iconContainer.classList.remove('valid', 'invalid', 'loading', 'error');

    switch (geolocationState) {
        case 'loading':
            card.classList.add('loading');
            iconContainer.classList.add('loading');
            iconContainer.innerHTML = `
                <div class="loading-spinner"></div>
            `;
            statusMain.textContent = 'Verificando localização...';
            statusMain.style.color = 'var(--text-secondary)';
            statusSub.textContent = 'Ative a localização no seu dispositivo';
            if (checkinBtn) {
                checkinBtn.disabled = true;
                checkinBtn.classList.add('disabled');
            }
            break;

        case 'valid':
            card.classList.add('valid');
            iconContainer.classList.add('valid');
            iconContainer.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
            `;
            statusMain.textContent = 'Você está na área do projeto';
            statusMain.style.color = 'var(--accent-green)';
            statusSub.textContent = `Distância: ${currentDistanceToProject}m do ponto central (raio: ${GEOFENCE_RADIUS_METERS}m)`;
            if (checkinBtn && !isCheckedIn) {
                checkinBtn.disabled = false;
                checkinBtn.classList.remove('disabled');
            }
            break;

        case 'invalid':
            card.classList.add('invalid');
            iconContainer.classList.add('invalid');
            iconContainer.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            `;
            statusMain.textContent = 'Você está fora da área do projeto';
            statusMain.style.color = 'var(--accent-red)';
            statusSub.textContent = `Distância: ${currentDistanceToProject}m (máximo permitido: ${GEOFENCE_RADIUS_METERS}m)`;
            if (checkinBtn) {
                checkinBtn.disabled = true;
                checkinBtn.classList.add('disabled');
            }
            break;

        case 'permission_denied':
            card.classList.add('error');
            iconContainer.classList.add('error');
            iconContainer.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            `;
            statusMain.textContent = 'Localização não permitida';
            statusMain.style.color = 'var(--accent-orange)';
            statusSub.textContent = 'Ative a permissão de localização nas configurações';
            if (checkinBtn) {
                checkinBtn.disabled = true;
                checkinBtn.classList.add('disabled');
            }
            break;

        case 'error':
            card.classList.add('error');
            iconContainer.classList.add('error');
            iconContainer.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            `;
            statusMain.textContent = 'Erro ao obter localização';
            statusMain.style.color = 'var(--accent-red)';
            statusSub.textContent = 'Verifique se o GPS está ativado';
            if (checkinBtn) {
                checkinBtn.disabled = true;
                checkinBtn.classList.add('disabled');
            }
            break;
    }
}

// Callback de sucesso do watchPosition
function onGeolocationSuccess(position) {
    currentUserLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy
    };

    const projectCoords = getProjectCoordinates();
    if (!projectCoords) {
        geolocationState = 'error';
        updateLocationUI();
        return;
    }

    const geofenceResult = checkGeofence(
        currentUserLocation.lat,
        currentUserLocation.lon,
        projectCoords.lat,
        projectCoords.lon
    );

    geolocationState = geofenceResult.isWithinGeofence ? 'valid' : 'invalid';
    updateLocationUI();

    // AUTO-CHECKOUT: Verificar se usuário saiu da área (>100m) durante checkin ativo
    if (isCheckedIn && activeCheckinId && currentDistanceToProject > AUTO_CHECKOUT_DISTANCE_METERS) {
        // Só mostrar aviso se ainda não foi mostrado
        if (!isAutoCheckoutWarningShown) {
            console.log(`[Auto-checkout] Usuário a ${currentDistanceToProject}m do projeto, mostrando aviso...`);
            showAutoCheckoutWarning();
        }
    } else if (currentDistanceToProject <= AUTO_CHECKOUT_DISTANCE_METERS) {
        // Se voltou para a área, cancelar o warning se estiver ativo
        if (isAutoCheckoutWarningShown) {
            console.log(`[Auto-checkout] Usuário voltou para a área (${currentDistanceToProject}m), cancelando aviso`);
            cancelAutoCheckoutWarning();
        }
    }
}

// Callback de erro do watchPosition
function onGeolocationError(error) {
    console.error('Geolocation error:', error);

    switch (error.code) {
        case error.PERMISSION_DENIED:
            geolocationState = 'permission_denied';
            break;
        case error.POSITION_UNAVAILABLE:
        case error.TIMEOUT:
        default:
            geolocationState = 'error';
            break;
    }

    updateLocationUI();
}

// Iniciar monitoramento de localização
function startGeolocationWatch() {
    // Limpar watch anterior se existir
    stopGeolocationWatch();

    geolocationState = 'loading';
    updateLocationUI();

    if (!navigator.geolocation) {
        geolocationState = 'error';
        updateLocationUI();
        return;
    }

    // Opções de alta precisão
    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    };

    // Iniciar watch contínuo
    geolocationWatchId = navigator.geolocation.watchPosition(
        onGeolocationSuccess,
        onGeolocationError,
        options
    );
}

// Parar monitoramento de localização
function stopGeolocationWatch() {
    if (geolocationWatchId !== null) {
        navigator.geolocation.clearWatch(geolocationWatchId);
        geolocationWatchId = null;
    }
}

// =============================================
// AUTO-CHECKOUT FUNCTIONS
// =============================================

// Mostrar modal de aviso de auto-checkout
function showAutoCheckoutWarning() {
    isAutoCheckoutWarningShown = true;
    autoCheckoutTimeRemaining = AUTO_CHECKOUT_COUNTDOWN_SECONDS;

    const modal = document.getElementById('auto-checkout-warning-modal');
    const countdownEl = document.getElementById('auto-checkout-timer');
    const distanceEl = document.getElementById('auto-checkout-distance');

    if (distanceEl) {
        distanceEl.textContent = `Distância: ${currentDistanceToProject}m`;
    }

    if (countdownEl) {
        countdownEl.textContent = autoCheckoutTimeRemaining;
    }

    if (modal) {
        modal.classList.add('show');
    }

    // Iniciar countdown
    startAutoCheckoutCountdown();

    console.log('[Auto-checkout] Aviso mostrado, countdown iniciado');
}

// Cancelar aviso de auto-checkout (quando volta para área)
function cancelAutoCheckoutWarning() {
    isAutoCheckoutWarningShown = false;

    // Parar countdown
    if (autoCheckoutCountdownInterval) {
        clearInterval(autoCheckoutCountdownInterval);
        autoCheckoutCountdownInterval = null;
    }

    // Fechar modal
    const modal = document.getElementById('auto-checkout-warning-modal');
    if (modal) {
        modal.classList.remove('show');
    }

    console.log('[Auto-checkout] Aviso cancelado (usuário voltou para área)');
}

// Iniciar contagem regressiva
function startAutoCheckoutCountdown() {
    // Limpar intervalo anterior se existir
    if (autoCheckoutCountdownInterval) {
        clearInterval(autoCheckoutCountdownInterval);
    }

    autoCheckoutCountdownInterval = setInterval(() => {
        autoCheckoutTimeRemaining--;

        const countdownEl = document.getElementById('auto-checkout-timer');
        if (countdownEl) {
            countdownEl.textContent = autoCheckoutTimeRemaining;
        }

        if (autoCheckoutTimeRemaining <= 0) {
            // Tempo esgotado - fazer checkout automático
            clearInterval(autoCheckoutCountdownInterval);
            autoCheckoutCountdownInterval = null;
            executeAutoCheckout();
        }
    }, 1000);
}

// Mapear opção selecionada para reason code (chamada pelo HTML)
function selectAutoCheckoutReason(option) {
    const reasonMap = {
        'almoco': 'ALMOCO_INTERVALO',
        'insumos': 'COMPRA_INSUMOS',
        'outro': 'OUTRO_PROJETO',
        'fim': 'FIM_EXPEDIENTE'
    };

    const reason = reasonMap[option] || 'FIM_EXPEDIENTE';
    handleAutoCheckoutOption(reason);
}

// Opção selecionada no modal de auto-checkout
function handleAutoCheckoutOption(reason) {
    console.log(`[Auto-checkout] Usuário escolheu: ${reason}`);

    // Fechar modal de aviso
    cancelAutoCheckoutWarning();

    // Fazer checkout com a razão selecionada
    doCheckoutWithReason(reason, false); // isAutoCheckout = false porque usuário escolheu
}

// Executar checkout automático (quando tempo esgota)
async function executeAutoCheckout() {
    console.log('[Auto-checkout] Tempo esgotado, executando checkout automático...');

    // Fechar modal de aviso
    const warningModal = document.getElementById('auto-checkout-warning-modal');
    if (warningModal) {
        warningModal.classList.remove('show');
    }
    isAutoCheckoutWarningShown = false;

    if (!activeCheckinId) {
        console.error('[Auto-checkout] Sem checkin ativo para fazer checkout');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/mobile/checkins/${activeCheckinId}/checkout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                reason: 'AUTO_DISTANTE',
                isAutoCheckout: true,
                latitude: currentUserLocation?.lat,
                longitude: currentUserLocation?.lon
            })
        });

        const data = await response.json();

        if (data.success) {
            // Salvar ID para possível justificativa
            lastAutoCheckoutCheckinId = activeCheckinId;

            // Resetar estado
            isCheckedIn = false;
            activeCheckinId = null;
            currentProjectForCheckin = null;
            pendingCheckoutReason = null; // Clear stale values

            // Stop GPS background verification
            stopGPSBackgroundVerification();

            // Atualizar UI
            updateCheckInButton();
            stopActiveCheckinTimer();

            console.log('[Auto-checkout] Checkout automático realizado com sucesso');

            // Mostrar modal de confirmação
            showAutoCheckoutDoneModal();
        } else {
            console.error('[Auto-checkout] Erro no checkout:', data.message);
            alert('Erro ao fazer checkout automático: ' + data.message);
        }
    } catch (error) {
        console.error('[Auto-checkout] Erro na requisição:', error);
        alert('Erro de conexão ao fazer checkout automático');
    }
}

// Fazer checkout com razão específica (quando usuário escolhe opção)
async function doCheckoutWithReason(reason, isAutoCheckout = false) {
    if (!activeCheckinId) {
        console.error('Sem checkin ativo para fazer checkout');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/mobile/checkins/${activeCheckinId}/checkout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                reason: reason,
                isAutoCheckout: isAutoCheckout,
                latitude: currentUserLocation?.lat,
                longitude: currentUserLocation?.lon
            })
        });

        const data = await response.json();

        if (data.success) {
            // Resetar estado
            isCheckedIn = false;
            activeCheckinId = null;
            currentProjectForCheckin = null;
            pendingCheckoutReason = null; // Clear stale values

            // Stop GPS background verification
            stopGPSBackgroundVerification();

            // Atualizar UI
            updateCheckInButton();
            stopActiveCheckinTimer();

            // Feedback visual
            const messages = {
                'ALMOCO_INTERVALO': 'Bom apetite! Lembre de voltar para o projeto.',
                'COMPRA_INSUMOS': 'Boas compras! Retorne logo ao projeto.',
                'OUTRO_PROJETO': 'Boa sorte no outro projeto!',
                'FIM_EXPEDIENTE': 'Bom descanso! Até amanhã.'
            };

            showSuccessModal('Check-out Realizado!', messages[reason] || 'Checkout realizado com sucesso.');
        } else {
            alert('Erro ao fazer checkout: ' + data.message);
        }
    } catch (error) {
        console.error('Erro no checkout:', error);
        alert('Erro de conexão ao fazer checkout');
    }
}

// Mostrar modal de confirmação de auto-checkout
function showAutoCheckoutDoneModal() {
    const modal = document.getElementById('auto-checkout-done-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Fechar modal de confirmação de auto-checkout
function closeAutoCheckoutDoneModal() {
    const modal = document.getElementById('auto-checkout-done-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    lastAutoCheckoutCheckinId = null;
}

// Mostrar modal de justificativa (alias para HTML onclick)
function showAutoCheckoutJustification() {
    showAutoCheckoutJustifyModal();
}

// Mostrar modal de justificativa
function showAutoCheckoutJustifyModal() {
    // Fechar modal de confirmação
    const doneModal = document.getElementById('auto-checkout-done-modal');
    if (doneModal) {
        doneModal.classList.remove('show');
    }

    // Abrir modal de justificativa
    const justifyModal = document.getElementById('auto-checkout-justify-modal');
    const textarea = document.getElementById('auto-checkout-justification-text');

    if (textarea) {
        textarea.value = '';
        updateJustifyCharCount(); // Resetar contador
    }

    if (justifyModal) {
        justifyModal.classList.add('show');
    }
}

// Fechar modal de justificativa
function closeAutoCheckoutJustifyModal() {
    const modal = document.getElementById('auto-checkout-justify-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Atualizar contador de caracteres da justificativa
function updateJustifyCharCount() {
    const textarea = document.getElementById('auto-checkout-justification-text');
    const counter = document.getElementById('justify-char-count');
    const submitBtn = document.getElementById('submitJustificationBtn');

    if (textarea && counter) {
        const len = textarea.value.length;
        counter.textContent = len;

        // Habilitar botão somente se tiver >= 10 caracteres
        if (submitBtn) {
            submitBtn.disabled = len < 10;
        }
    }
}

// Enviar justificativa de auto-checkout
async function submitAutoCheckoutJustification() {
    const textarea = document.getElementById('auto-checkout-justification-text');
    const justification = textarea?.value?.trim();

    if (!justification || justification.length < 10) {
        alert('Por favor, escreva uma justificativa com pelo menos 10 caracteres');
        return;
    }

    if (!lastAutoCheckoutCheckinId) {
        alert('Erro: ID do checkout não encontrado');
        closeAutoCheckoutJustifyModal();
        return;
    }

    const submitBtn = document.getElementById('submitJustificationBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
    }

    try {
        const response = await fetch(`${API_URL}/api/mobile/checkins/${lastAutoCheckoutCheckinId}/justify-auto-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                justification: justification
            })
        });

        const data = await response.json();

        if (data.success) {
            closeAutoCheckoutJustifyModal();
            lastAutoCheckoutCheckinId = null;
            showSuccessModal('Justificativa Enviada!', 'Sua explicação foi registrada com sucesso.');
        } else {
            alert('Erro ao enviar justificativa: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao enviar justificativa:', error);
        alert('Erro de conexão ao enviar justificativa');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Justificativa';
        }
    }
}

// Fazer check-in real no backend
async function doCheckin() {
    if (!selectedProject) {
        alert('Selecione um projeto primeiro');
        return;
    }

    // Validar geolocalização antes do check-in
    if (geolocationState !== 'valid') {
        switch (geolocationState) {
            case 'loading':
                alert('Aguarde a verificação de localização...');
                break;
            case 'invalid':
                alert(`Você está muito longe do projeto (${currentDistanceToProject}m). Aproxime-se para fazer check-in.`);
                break;
            case 'permission_denied':
                alert('Permissão de localização negada. Ative nas configurações do dispositivo para fazer check-in.');
                break;
            case 'error':
            default:
                alert('Erro ao verificar localização. Certifique-se que o GPS está ativado.');
                break;
        }
        return;
    }

    // Verificar se temos localização atual
    if (!currentUserLocation) {
        alert('Localização não disponível. Aguarde a verificação.');
        return;
    }

    const btn = document.getElementById('checkinBtn');
    btn.disabled = true;

    try {
        // Usar localização já monitorada
        const latitude = currentUserLocation.lat;
        const longitude = currentUserLocation.lon;

        const response = await fetch(`${API_URL}/api/mobile/checkins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                projectId: selectedProject.id,
                latitude,
                longitude
            })
        });

        const data = await response.json();

        if (data.success) {
            isCheckedIn = true;
            activeCheckinId = data.data.id;
            currentProjectForCheckin = selectedProject.id;
            gpsWarningDismissCount = 0; // Reset GPS warning counter on new check-in
            gpsOffStartTime = null; // Reset GPS off timer on new check-in
            pendingCheckoutReason = null; // Clear any stale checkout reason
            updateCheckinUI(true);

            // Mostrar XP ganho se disponível
            let successMessage = `Bom trabalho! Seu expediente começou às ${getCurrentTime()}.\nDistância: ${currentDistanceToProject}m do projeto.`;
            if (data.xp) {
                // Atualizar XP na tela de perfil se existir
                updateUserXP(data.xp.total, data.xp.level);
                // Mostrar modal de XP (fullscreen mobile)
                showXPNotification(data.xp.earned, data.xp.reason, data.xp.total);
            } else {
                // Se não tiver XP, mostrar modal de sucesso normal
                showSuccessModal('Check-in Realizado!', successMessage);
            }

            // Iniciar envio de localização periódico
            startLocationTracking();

            // Start GPS background verification (double check system)
            startGPSBackgroundVerification();

            // Load tasks for the project after check-in
            if (selectedProject && selectedProject.id) {
                loadProjectTasks(selectedProject.id);
                updateTaskBlockVisibility(true);
            }
        } else {
            // Check for CHECKIN_TOO_EARLY error - show friendly notification
            if (data.error?.code === 'CHECKIN_TOO_EARLY') {
                showGameAlert({
                    type: 'warning',
                    icon: '⏰',
                    title: 'MUITO CEDO',
                    message: 'Ainda está muito cedo para fazer seu check-in.\n\nAguarde o horário permitido.',
                    buttonText: 'ENTENDI'
                });
                return;
            }
            throw new Error(data.error?.message || 'Erro ao fazer check-in');
        }
    } catch (error) {
        console.error('Erro no check-in:', error);
        alert(error.message || 'Erro ao fazer check-in. Tente novamente.');
    } finally {
        btn.disabled = false;
    }
}

// Fazer checkout real no backend
async function doCheckout() {
    showLeavingModal();
}

// =============================================
// ENTRY REQUEST (LIBERACAO NA PORTARIA)
// =============================================
const ENTRY_REQUEST_COOLDOWN = 60 * 60 * 1000; // 1 hour in milliseconds

// Check if entry request is on cooldown for this project
function isEntryRequestOnCooldown(projectId) {
    const lastRequestKey = `entry_request_${projectId}`;
    const lastRequest = localStorage.getItem(lastRequestKey);
    if (!lastRequest) return false;

    const lastRequestTime = parseInt(lastRequest, 10);
    const now = Date.now();
    return (now - lastRequestTime) < ENTRY_REQUEST_COOLDOWN;
}

// Get remaining cooldown time in minutes
function getEntryRequestCooldownRemaining(projectId) {
    const lastRequestKey = `entry_request_${projectId}`;
    const lastRequest = localStorage.getItem(lastRequestKey);
    if (!lastRequest) return 0;

    const lastRequestTime = parseInt(lastRequest, 10);
    const now = Date.now();
    const remaining = ENTRY_REQUEST_COOLDOWN - (now - lastRequestTime);
    return Math.max(0, Math.ceil(remaining / (60 * 1000))); // Return minutes
}

// Update entry request button state
function updateEntryRequestButton() {
    const btn = document.getElementById('entryRequestBtn');
    if (!btn || !selectedProject) return;

    if (isEntryRequestOnCooldown(selectedProject.id)) {
        const remaining = getEntryRequestCooldownRemaining(selectedProject.id);
        btn.disabled = true;
        btn.classList.add('disabled');
        btn.querySelector('span').textContent = `Aguarde ${remaining} min para solicitar novamente`;
    } else {
        btn.disabled = false;
        btn.classList.remove('disabled');
        btn.querySelector('span').textContent = 'Solicitar Liberacao na Portaria';
    }
}

// Request entry at building
async function requestEntry() {
    if (!selectedProject) {
        alert('Selecione um projeto primeiro');
        return;
    }

    // Check cooldown
    if (isEntryRequestOnCooldown(selectedProject.id)) {
        const remaining = getEntryRequestCooldownRemaining(selectedProject.id);
        alert(`Voce ja solicitou liberacao recentemente. Aguarde ${remaining} minutos para solicitar novamente.`);
        return;
    }

    const btn = document.getElementById('entryRequestBtn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Enviando...';

    try {
        const response = await fetch(`${API_URL}/api/mobile/projects/${selectedProject.id}/request-entry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Save timestamp to localStorage
            const lastRequestKey = `entry_request_${selectedProject.id}`;
            localStorage.setItem(lastRequestKey, Date.now().toString());

            showSuccessModal('Solicitacao Enviada!', `A portaria foi notificada sobre sua chegada.\nEnviado para ${data.data.sentTo} telefone(s).`);
            updateEntryRequestButton();
        } else {
            throw new Error(data.error?.message || 'Erro ao enviar solicitacao');
        }
    } catch (error) {
        console.error('Erro na solicitacao:', error);
        alert(error.message || 'Erro ao enviar solicitacao. Tente novamente.');
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Solicitar Liberacao na Portaria';
    }
}

async function confirmCheckout(reason) {
    closeLeavingModal();

    if (!activeCheckinId) {
        console.error('No active checkin');
        return;
    }

    try {
        // Obter localização atual
        let latitude = null;
        let longitude = null;

        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (geoError) {
                console.log('Geolocation not available:', geoError);
            }
        }

        const reasonMap = {
            'almoco': 'ALMOCO_INTERVALO',
            'insumos': 'COMPRA_INSUMOS',
            'outro': 'OUTRO_PROJETO',
            'fim': 'FIM_EXPEDIENTE'
        };

        const response = await fetch(`${API_URL}/api/mobile/checkins/${activeCheckinId}/checkout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                latitude,
                longitude,
                reason: reasonMap[reason] || 'FIM_EXPEDIENTE'
            })
        });

        const data = await response.json();

        if (data.success) {
            isCheckedIn = false;
            activeCheckinId = null;
            currentProjectForCheckin = null;
            pendingCheckoutReason = null; // Clear stale values
            updateCheckinUI(false);

            // Stop GPS background verification
            stopGPSBackgroundVerification();

            // Reiniciar tracking com intervalo menor (2min sem checkin)
            restartLocationTracking();

            const hoursWorked = data.data.hoursWorked ? data.data.hoursWorked.toFixed(1) : '0';
            let message = '';
            switch(reason) {
                case 'insumos':
                    message = `Compra de insumos registrada. Você trabalhou ${hoursWorked}h neste período.`;
                    break;
                case 'outro':
                    message = `Check-out realizado. Você trabalhou ${hoursWorked}h. Pode fazer check-in em outro projeto.`;
                    break;
                case 'fim':
                    message = `Expediente encerrado às ${getCurrentTime()}. Você trabalhou ${hoursWorked}h hoje. Bom descanso!`;
                    break;
            }
            showSuccessModal('Check-out Realizado', message);
        } else {
            throw new Error(data.error?.message || 'Erro ao fazer checkout');
        }
    } catch (error) {
        console.error('Erro no checkout:', error);
        alert(error.message || 'Erro ao fazer checkout. Tente novamente.');
    }
}

// Atualizar UI do check-in
function updateCheckinUI(checked) {
    const checkinBtn = document.getElementById('checkinBtn');
    const reportBtn = document.getElementById('reportBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!checkinBtn) return;

    if (checked) {
        // Esconder botão de check-in, mostrar relatório e checkout
        checkinBtn.style.display = 'none';
        if (reportBtn) reportBtn.style.display = 'flex';
        if (checkoutBtn) checkoutBtn.style.display = 'flex';
    } else {
        // Mostrar botão de check-in, esconder relatório e checkout
        checkinBtn.style.display = 'flex';
        checkinBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Fazer Check-in</span>
        `;
        checkinBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        checkinBtn.onclick = doCheckin;
        if (reportBtn) reportBtn.style.display = 'none';
        if (checkoutBtn) checkoutBtn.style.display = 'none';
    }
}

// Verificar se há check-in ativo ao iniciar
async function checkActiveCheckin() {
    try {
        const response = await fetch(`${API_URL}/api/mobile/checkins/active`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            isCheckedIn = true;
            activeCheckinId = data.data.id;
            currentProjectForCheckin = data.data.projectId;
            gpsWarningDismissCount = 0; // Reset GPS warning counter
            gpsOffStartTime = null; // Reset GPS off timer
            updateCheckinUI(true);
            startLocationTracking();

            // Start GPS background verification (double check system)
            startGPSBackgroundVerification();
        }
    } catch (error) {
        console.error('Erro ao verificar check-in ativo:', error);
    }
}

// Leaving Modal
function showLeavingModal() {
    document.getElementById('leaving-modal').classList.add('active');
}

function closeLeavingModal() {
    document.getElementById('leaving-modal').classList.remove('active');
}

function selectLeavingReason(reason) {
    // Map old reason names to new format
    const reasonMap = {
        'almoco': 'ALMOCO_INTERVALO',
        'insumos': 'COMPRA_INSUMOS',
        'outro': 'OUTRO_PROJETO',
        'fim': 'FIM_EXPEDIENTE'
    };

    const mappedReason = reasonMap[reason] || reason;

    // Close the old modal
    closeLeavingModal();

    // For "outro projeto" and "fim expediente", use the task completion flow
    if (mappedReason === 'OUTRO_PROJETO' || mappedReason === 'FIM_EXPEDIENTE') {
        pendingCheckoutReason = mappedReason;
        showTaskCompletionModal();
    } else {
        // For lunch/supplies, do regular checkout
        doCheckoutWithReason(mappedReason);
    }
}

// Success Modal
function showSuccessModal(title, message) {
    const modal = document.getElementById('success-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('success-modal').classList.remove('active');
}

// =============================================
// XP SYSTEM - Sistema de experiência
// =============================================

// Atualizar XP na interface
function updateUserXP(totalXP, level) {
    // Atualizar no localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.xpTotal = totalXP;
    userData.level = level;
    localStorage.setItem('userData', JSON.stringify(userData));

    // Atualizar na tela de perfil se visível
    const xpElement = document.querySelector('.xp-total');
    if (xpElement) {
        xpElement.textContent = `${totalXP} XP`;
    }

    const levelElement = document.querySelector('.user-level');
    if (levelElement) {
        levelElement.textContent = `Nível ${level}`;
    }
}

// Mostrar modal de XP ganho (estilo mobile fullscreen)
function showXPNotification(amount, reason, totalXP = null) {
    const overlay = document.getElementById('xpRewardOverlay');
    if (!overlay) {
        console.error('XP Reward Overlay não encontrado');
        return;
    }

    const isLoss = amount < 0;

    // Atualizar valores no modal
    const amountEl = document.getElementById('xpRewardAmount');
    const reasonEl = document.getElementById('xpRewardReason');
    const totalEl = document.getElementById('xpRewardTotalValue');

    if (amountEl) {
        amountEl.textContent = isLoss ? `${amount} XP` : `+${amount} XP`;
        amountEl.classList.toggle('xp-loss', isLoss);
    }
    if (reasonEl) reasonEl.textContent = reason;

    // Update overlay style for loss
    overlay.classList.toggle('loss-mode', isLoss);

    // Mostrar total se disponível
    if (totalXP !== null && totalEl) {
        totalEl.textContent = `${totalXP.toLocaleString('pt-BR')} XP`;
        document.getElementById('xpRewardTotal').style.display = 'flex';
    } else {
        const totalContainer = document.getElementById('xpRewardTotal');
        if (totalContainer) totalContainer.style.display = 'none';
    }

    // Mostrar o overlay
    overlay.classList.add('active');

    // Vibrate device for loss
    if (isLoss && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
    }

    console.log(isLoss ? `💔 XP Loss: ${amount} XP - ${reason}` : `🌟 XP Reward: +${amount} XP - ${reason}`);
}

// Mostrar notificação de perda de XP (atalho)
function showXPLossNotification(amount, reason, totalXP = null) {
    showXPNotification(-Math.abs(amount), reason, totalXP);
}

// Fechar modal de XP
function closeXPRewardModal() {
    const overlay = document.getElementById('xpRewardOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Expor funções de XP globalmente para testes via console
window.showXPNotification = showXPNotification;
window.showXPLossNotification = showXPLossNotification;
window.closeXPRewardModal = closeXPRewardModal;

// Report Success
function showReportSuccess() {
    showSuccessModal('Relatório Enviado!', 'O relatório foi enviado para o time do projeto.');
}

// =============================================
// IMAGE COMPRESSION - Compressao de imagem nativa
// =============================================

/**
 * Comprime uma imagem usando Canvas nativo
 * @param {File} file - Arquivo de imagem
 * @param {Object} options - Opcoes de compressao
 * @param {number} options.maxWidth - Largura maxima (default: 1920)
 * @param {number} options.maxHeight - Altura maxima (default: 1920)
 * @param {number} options.quality - Qualidade JPEG 0-1 (default: 0.85)
 * @param {number} options.maxSizeKB - Tamanho maximo em KB (default: 500)
 * @returns {Promise<string>} - Base64 da imagem comprimida
 */
async function compressImage(file, options = {}) {
    const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 0.85,
        maxSizeKB = 500
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calcular dimensoes mantendo aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Criar canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                // Desenhar imagem redimensionada
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Funcao para tentar comprimir ate atingir tamanho desejado
                const tryCompress = (q) => {
                    const base64 = canvas.toDataURL('image/jpeg', q);
                    const sizeKB = (base64.length * 0.75) / 1024; // Aproximar tamanho em KB

                    // Se ainda muito grande e qualidade > 0.3, tentar menor qualidade
                    if (sizeKB > maxSizeKB && q > 0.3) {
                        return tryCompress(q - 0.1);
                    }
                    return base64;
                };

                // Converter para blob e depois para File
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Erro ao comprimir imagem'));
                        return;
                    }
                    const compressedFile = new File([blob], file.name || 'photo.jpg', {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    console.log(`Imagem comprimida: ${img.width}x${img.height} -> ${Math.round(width)}x${Math.round(height)}, ${Math.round(blob.size / 1024)}KB`);
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

// =============================================
// NEW POST - Funcionalidades de novo post
// =============================================
let selectedPostPhoto = null;
let selectedPostProjectId = null;
let selectedPostProjectName = null;

// Selecionar foto do post
function handlePostPhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem.');
        return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('A imagem deve ter no maximo 10MB.');
        return;
    }

    selectedPostPhoto = file;

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const uploadArea = document.getElementById('postUploadArea');
        const preview = document.getElementById('postUploadPreview');
        const previewImg = document.getElementById('postPhotoPreview');

        if (uploadArea) uploadArea.style.display = 'none';
        if (preview) preview.style.display = 'block';
        if (previewImg) previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Remover foto do post
function removePostPhoto() {
    selectedPostPhoto = null;

    const uploadArea = document.getElementById('postUploadArea');
    const preview = document.getElementById('postUploadPreview');
    const previewImg = document.getElementById('postPhotoPreview');
    const input = document.getElementById('postPhotoInput');

    if (uploadArea) uploadArea.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (input) input.value = '';
}

// Abrir modal de selecao de projeto
function openPostProjectModal() {
    const modal = document.getElementById('post-project-modal');
    const listContainer = document.getElementById('postProjectList');

    if (!modal || !listContainer) return;

    // Renderizar lista de projetos
    const projects = cachedProjects || [];

    // Opcao especial: Aconteceu antes desse app
    const beforeAppOption = `
        <div class="project-option special-option ${selectedPostProjectId === 'BEFORE_APP' ? 'selected' : ''}"
             onclick="selectPostProject('BEFORE_APP', 'Antes desse app')">
            <div class="project-icon before-app">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
            </div>
            <div class="project-details">
                <h4>Aconteceu antes desse app</h4>
                <span>Para trabalhos realizados antes de usar o app</span>
            </div>
            <div class="check-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            </div>
        </div>
    `;

    // Renderizar projetos
    const projectsHtml = projects.map(project => {
        const isSelected = selectedPostProjectId === project.id;
        const projectName = project.cliente || project.title || 'Projeto';
        const projectAddress = project.endereco || '';

        return `
            <div class="project-option ${isSelected ? 'selected' : ''}"
                 onclick="selectPostProject('${project.id}', '${projectName.replace(/'/g, "\\'")}')">
                <div class="project-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <div class="project-details">
                    <h4>${projectName}</h4>
                    <span>${projectAddress}</span>
                </div>
                <div class="check-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                </div>
            </div>
        `;
    }).join('');

    // Separador visual
    const separator = projects.length > 0 ? '<div class="project-separator"><span>Projetos atuais</span></div>' : '';

    listContainer.innerHTML = beforeAppOption + separator + projectsHtml;

    modal.classList.add('active');
}

// Fechar modal de selecao de projeto
function closePostProjectModal() {
    const modal = document.getElementById('post-project-modal');
    if (modal) modal.classList.remove('active');
}

// Selecionar projeto para o post
function selectPostProject(projectId, projectName) {
    selectedPostProjectId = projectId;
    selectedPostProjectName = projectName;

    // Atualizar texto do seletor
    const projectNameEl = document.getElementById('postProjectName');
    if (projectNameEl) {
        projectNameEl.textContent = projectName;
    }

    // Fechar modal
    closePostProjectModal();
}

// Carregar projetos para o novo post (sem renderizar na tela de projetos)
async function loadProjectsForPost() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/mobile/projects`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            cachedProjects = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.error('Erro ao carregar projetos para post:', error);
    }
}

// Resetar formulario de novo post
function resetNewPostForm() {
    selectedPostPhoto = null;
    selectedPostProjectId = null;
    selectedPostProjectName = null;

    const uploadArea = document.getElementById('postUploadArea');
    const preview = document.getElementById('postUploadPreview');
    const previewImg = document.getElementById('postPhotoPreview');
    const input = document.getElementById('postPhotoInput');
    const textInput = document.getElementById('postTextInput');
    const projectNameEl = document.getElementById('postProjectName');

    if (uploadArea) uploadArea.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (input) input.value = '';
    if (textInput) textInput.value = '';
    if (projectNameEl) projectNameEl.textContent = 'Selecione um projeto';
}

// =============================================
// FEED POSTS - Sistema de posts com IndexedDB (armazenamento maior)
// =============================================
let feedPosts = [];
let feedDB = null;
const FEED_DB_NAME = 'monofloorFeed';
const FEED_DB_VERSION = 1;
const FEED_STORE_NAME = 'posts';
const MAX_FEED_POSTS = 200; // IndexedDB suporta muito mais que localStorage!

// Inicializar IndexedDB
function initFeedDB() {
    return new Promise((resolve, reject) => {
        if (feedDB) {
            resolve(feedDB);
            return;
        }

        if (!window.indexedDB) {
            console.warn('IndexedDB nao suportado, usando localStorage como fallback');
            resolve(null);
            return;
        }

        const request = indexedDB.open(FEED_DB_NAME, FEED_DB_VERSION);

        request.onerror = (event) => {
            console.error('Erro ao abrir IndexedDB:', event.target.error);
            resolve(null); // Fallback para localStorage
        };

        request.onsuccess = (event) => {
            feedDB = event.target.result;
            console.log('IndexedDB inicializado com sucesso!');
            resolve(feedDB);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(FEED_STORE_NAME)) {
                const store = db.createObjectStore(FEED_STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('Object store criado com sucesso!');
            }
        };
    });
}

// Limpar feed completamente (para liberar espaco)
async function clearFeedPosts() {
    feedPosts = [];

    try {
        await initFeedDB();
        if (feedDB) {
            const transaction = feedDB.transaction([FEED_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(FEED_STORE_NAME);
            store.clear();
            console.log('Feed limpo do IndexedDB com sucesso!');
        }
    } catch (e) {
        console.error('Erro ao limpar IndexedDB:', e);
    }

    // Limpar localStorage tambem (para migração)
    localStorage.removeItem('feedPosts');
    console.log('Feed limpo com sucesso!');
}

// Carregar posts do servidor (API)
async function loadFeedPosts() {
    const token = localStorage.getItem('token');

    // Se nao tiver token, carregar do cache local
    if (!token) {
        console.log('Sem token, carregando feed do cache local');
        loadFeedPostsFromLocalStorage();
        return feedPosts;
    }

    try {
        const response = await fetch(`${API_URL}/api/mobile/feed?limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar feed do servidor');
        }

        const result = await response.json();

        if (result.success && result.data.posts) {
            // Transformar posts da API para o formato local
            feedPosts = result.data.posts.map(post => ({
                id: post.id,
                userId: post.user.id,
                userName: post.user.name,
                userInitials: post.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
                userPhotoUrl: post.user.photoUrl,
                userPrimaryBadge: post.user.primaryBadge || null,
                content: post.text || '',
                imageUrl: post.imageUrl ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`) : null,
                projectId: post.project?.id || null,
                projectName: post.project?.title || post.project?.cliente || 'Projeto',
                likes: post.likesCount,
                comments: post.commentsCount,
                liked: post.hasLiked,
                createdAt: post.createdAt
            }));
            console.log(`Feed carregado: ${feedPosts.length} posts do servidor`);

            // Salvar no cache local (IndexedDB como fallback offline)
            saveFeedPostsToCache();
        }

        return feedPosts;
    } catch (e) {
        console.error('Erro ao carregar feed do servidor, usando cache:', e);
        // Fallback para cache local
        loadFeedPostsFromLocalStorage();
        return feedPosts;
    }
}

// Salvar posts no cache local (para modo offline)
function saveFeedPostsToCache() {
    try {
        // Limitar para economizar espaco - sem imagens base64 no cache
        const postsForCache = feedPosts.slice(0, 30).map(post => ({
            ...post,
            imageUrl: post.imageUrl && post.imageUrl.startsWith('data:') ? null : post.imageUrl
        }));
        localStorage.setItem('feedPostsCache', JSON.stringify(postsForCache));
    } catch (e) {
        console.warn('Erro ao salvar cache do feed:', e);
    }
}

// Fallback: carregar do cache localStorage
function loadFeedPostsFromLocalStorage() {
    try {
        // Tentar cache primeiro
        let stored = localStorage.getItem('feedPostsCache');
        if (!stored) {
            // Fallback para formato antigo
            stored = localStorage.getItem('feedPosts');
        }
        feedPosts = stored ? JSON.parse(stored) : [];
        console.log(`Feed carregado: ${feedPosts.length} posts do cache local`);
    } catch (e) {
        console.error('Erro ao carregar do cache:', e);
        feedPosts = [];
    }
}

// Migrar posts do localStorage para IndexedDB
async function migrateToIndexedDB() {
    if (!feedDB || feedPosts.length === 0) return;

    const transaction = feedDB.transaction([FEED_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(FEED_STORE_NAME);

    feedPosts.forEach(post => {
        store.put(post);
    });

    transaction.oncomplete = () => {
        console.log('Migração concluída! Limpando localStorage...');
        localStorage.removeItem('feedPosts');
    };
}

// Salvar posts no IndexedDB
async function saveFeedPosts() {
    // Limitar quantidade máxima
    if (feedPosts.length > MAX_FEED_POSTS) {
        feedPosts = feedPosts.slice(0, MAX_FEED_POSTS);
    }

    try {
        await initFeedDB();

        if (feedDB) {
            const transaction = feedDB.transaction([FEED_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(FEED_STORE_NAME);

            // Salvar cada post
            feedPosts.forEach(post => {
                store.put(post);
            });

            transaction.oncomplete = () => {
                console.log('Feed salvo no IndexedDB com sucesso!');
            };

            transaction.onerror = (event) => {
                console.error('Erro ao salvar no IndexedDB:', event.target.error);
                saveFeedPostsToLocalStorage();
            };
        } else {
            saveFeedPostsToLocalStorage();
        }
    } catch (e) {
        console.error('Erro ao salvar feed:', e);
        saveFeedPostsToLocalStorage();
    }
}

// Fallback: salvar no localStorage
function saveFeedPostsToLocalStorage() {
    const MAX_POSTS = 30; // Limite menor para localStorage
    const postsToSave = feedPosts.slice(0, MAX_POSTS);

    try {
        localStorage.setItem('feedPosts', JSON.stringify(postsToSave));
        console.log(`Feed salvo no localStorage (${postsToSave.length} posts)`);
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('localStorage quota exceeded, salvando apenas posts recentes sem imagens...');
            const smallerPosts = postsToSave.slice(0, 10).map(post => ({
                ...post,
                imageUrl: post.imageUrl && post.imageUrl.length > 1000 ? null : post.imageUrl
            }));
            try {
                localStorage.setItem('feedPosts', JSON.stringify(smallerPosts));
            } catch (e2) {
                console.error('Nao foi possivel salvar no localStorage');
            }
        }
    }
}

// Adicionar um único post ao IndexedDB
async function addFeedPost(post) {
    feedPosts.unshift(post); // Adiciona no início do array

    try {
        await initFeedDB();

        if (feedDB) {
            const transaction = feedDB.transaction([FEED_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(FEED_STORE_NAME);
            store.put(post);
            console.log('Post adicionado ao IndexedDB');
        } else {
            saveFeedPostsToLocalStorage();
        }
    } catch (e) {
        console.error('Erro ao adicionar post:', e);
        saveFeedPostsToLocalStorage();
    }
}

// Deletar um post do IndexedDB
async function deleteFeedPost(postId) {
    try {
        await initFeedDB();

        if (feedDB) {
            const transaction = feedDB.transaction([FEED_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(FEED_STORE_NAME);
            store.delete(postId);
        }
    } catch (e) {
        console.error('Erro ao deletar post:', e);
    }
}

// Inicializar DB quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initFeedDB().then(() => {
        loadFeedPosts();
    });
});

// Mostrar modal de publicacao (Instagram style)
function showPublishingModal(imageUrl) {
    const modal = document.getElementById('publishing-modal');
    const preview = document.getElementById('publishingPreview');
    const img = document.getElementById('publishingImage');
    const progressBar = document.getElementById('publishingProgressBar');

    if (!modal) return;

    // Resetar progress bar
    if (progressBar) {
        progressBar.style.animation = 'none';
        progressBar.offsetHeight; // Trigger reflow
        progressBar.style.animation = 'publishingProgress 2s ease-in-out forwards';
    }

    // Configurar preview
    if (imageUrl) {
        preview.classList.remove('no-image');
        img.src = imageUrl;
        img.style.display = 'block';
    } else {
        preview.classList.add('no-image');
        img.style.display = 'none';
    }

    modal.classList.add('active');
}

// Esconder modal de publicacao
function hidePublishingModal() {
    const modal = document.getElementById('publishing-modal');
    if (modal) modal.classList.remove('active');
}

// Publicar post
async function publishPost() {
    const textContent = document.getElementById('postTextInput')?.value?.trim();
    const token = localStorage.getItem('token');

    // Validacoes
    if (!selectedPostPhoto && !textContent) {
        alert('Adicione uma foto ou escreva algo para publicar.');
        return;
    }

    if (!selectedPostProjectId) {
        alert('Selecione um projeto para vincular o post.');
        return;
    }

    if (!token) {
        alert('Voce precisa estar logado para publicar.');
        navigateTo('screen-login');
        return;
    }

    // Comprimir imagem antes de enviar (max 1080px, qualidade 0.7, max 800KB)
    let imageBase64 = null;
    if (selectedPostPhoto) {
        try {
            console.log(`Comprimindo imagem: ${selectedPostPhoto.name} (${(selectedPostPhoto.size / 1024 / 1024).toFixed(2)}MB)`);
            imageBase64 = await compressImage(selectedPostPhoto, {
                maxWidth: 1080,
                maxHeight: 1080,
                quality: 0.7,
                maxSizeKB: 800
            });
            console.log(`Imagem comprimida. Tamanho final: ${(imageBase64.length / 1024).toFixed(0)}KB`);
        } catch (err) {
            console.error('Erro ao comprimir imagem:', err);
            alert('Erro ao processar imagem. Tente novamente.');
            return;
        }
    }

    // Mostrar modal de loading estilo Instagram
    showPublishingModal(imageBase64);

    try {
        // Preparar dados do post (só inclui projectId se for válido)
        const postData = {
            text: textContent || null,
            imageBase64: imageBase64,
        };

        // Só adiciona projectId se for um UUID válido (não 'BEFORE_APP' ou outro valor especial)
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (selectedPostProjectId && uuidRegex.test(selectedPostProjectId)) {
            postData.projectId = selectedPostProjectId;
        }

        console.log('Enviando post:', {
            hasText: !!postData.text,
            hasImage: !!postData.imageBase64,
            projectId: postData.projectId || 'não definido'
        });

        // Enviar para o servidor
        const response = await fetch(`${API_URL}/api/mobile/feed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || 'Erro ao publicar');
        }

        // Obter dados do usuario (usar cachedProfile se disponivel para ter badges)
        const user = cachedProfile || getCurrentUser();

        // Adicionar post ao inicio da lista local
        const newPost = {
            id: result.data.id,
            userId: result.data.user.id,
            userName: result.data.user.name,
            userInitials: result.data.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
            userPhotoUrl: result.data.user.photoUrl,
            userPrimaryBadge: user?.primaryBadge || null,
            content: result.data.text || '',
            imageUrl: result.data.imageUrl ? (result.data.imageUrl.startsWith('http') ? result.data.imageUrl : `${API_URL}${result.data.imageUrl}`) : null,
            projectId: result.data.project?.id || selectedPostProjectId,
            projectName: result.data.project?.title || selectedPostProjectName || 'Projeto',
            likes: 0,
            comments: 0,
            liked: false,
            createdAt: result.data.createdAt
        };

        feedPosts.unshift(newPost);
        saveFeedPostsToCache();

        // Esconder modal de loading
        hidePublishingModal();

        // Resetar formulario
        resetNewPostForm();

        // Ir direto para o feed (sem modal de sucesso, mais fluido)
        navigateTo('screen-feed');

    } catch (error) {
        console.error('Erro ao publicar post:', error);
        hidePublishingModal();
        alert(error.message || 'Erro ao publicar. Tente novamente.');
    }
}

// Renderizar feed
function renderFeed() {
    loadFeedPosts();

    const emptyState = document.getElementById('feedEmptyState');
    const postsContainer = document.getElementById('feedPosts');

    if (!postsContainer) return;

    if (feedPosts.length === 0) {
        // Mostrar empty state
        if (emptyState) emptyState.style.display = 'flex';
        postsContainer.style.display = 'none';
    } else {
        // Esconder empty state e mostrar posts
        if (emptyState) emptyState.style.display = 'none';
        postsContainer.style.display = 'block';

        // Renderizar posts
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id || 'local';

        postsContainer.innerHTML = feedPosts.map(post => {
            const timeAgo = getTimeAgo(post.createdAt);
            const likedClass = post.liked ? 'liked' : '';
            const likesText = post.likes === 1 ? '1 curtida' : `${post.likes} curtidas`;
            const avatarContent = renderAvatar(post.userPhotoUrl, post.userName, 40);
            const commentsCount = post.commentsList?.length || post.comments || 0;
            const isOwnPost = post.userId === currentUserId;

            // Render badge if user has primary badge
            let badgeHtml = '';
            if (post.userPrimaryBadge && post.userPrimaryBadge.iconUrl) {
                const badgeIconUrl = post.userPrimaryBadge.iconUrl.startsWith('http')
                    ? post.userPrimaryBadge.iconUrl
                    : `${API_URL}${post.userPrimaryBadge.iconUrl}`;
                badgeHtml = `<img src="${badgeIconUrl}" alt="${post.userPrimaryBadge.name}" class="post-user-badge" title="${post.userPrimaryBadge.name}">`;
            }

            return `
                <div class="feed-post" data-post-id="${post.id}">
                    <div class="post-header">
                        <div class="post-avatar">${avatarContent}</div>
                        <div class="post-user-info">
                            <span class="post-user-name">${post.userName}${badgeHtml}</span>
                            <span class="post-project-name">${post.projectName}</span>
                        </div>
                        ${isOwnPost ? `
                            <button class="post-menu-btn" onclick="confirmDeletePost('${post.id}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        ` : `<span class="post-time">${timeAgo}</span>`}
                    </div>
                    ${post.imageUrl ? `
                        <div class="post-image">
                            <img src="${post.imageUrl}" alt="Post image">
                        </div>
                    ` : ''}
                    <div class="post-actions">
                        <button class="action-btn ${likedClass}" onclick="togglePostLike('${post.id}')">
                            <svg viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                        <button class="action-btn" onclick="openComments('${post.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </button>
                    </div>
                    ${post.likes > 0 ? `<div class="post-likes">${likesText}</div>` : ''}
                    ${post.content ? `
                        <div class="post-content">
                            <p><strong>${post.userName}</strong> ${post.content}</p>
                        </div>
                    ` : ''}
                    ${commentsCount > 0 ? `
                        <button class="post-view-comments" onclick="openComments('${post.id}')">
                            Ver ${commentsCount === 1 ? '1 comentario' : `todos os ${commentsCount} comentarios`}
                        </button>
                    ` : ''}
                    <div class="post-timestamp">${timeAgo}</div>
                </div>
            `;
        }).join('');
    }
}

// Toggle like em um post (conectado ao servidor)
async function togglePostLike(postId) {
    const postIndex = feedPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = feedPosts[postIndex];
    const wasLiked = post.liked;

    // Otimistic update
    post.liked = !post.liked;
    post.likes = post.liked ? post.likes + 1 : Math.max(0, post.likes - 1);
    renderFeed();

    // Enviar para o servidor
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/api/mobile/feed/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (result.success) {
                // Atualizar com valor real do servidor
                post.liked = result.data.liked;
                post.likes = result.data.likesCount;
                saveFeedPostsToCache();
                renderFeed();
            }
        } catch (e) {
            console.error('Erro ao curtir post:', e);
            // Reverter em caso de erro
            post.liked = wasLiked;
            post.likes = wasLiked ? post.likes + 1 : post.likes - 1;
            renderFeed();
        }
    } else {
        // Sem token, salvar apenas localmente
        saveFeedPostsToCache();
    }
}

// =============================================
// COMMENTS SYSTEM
// =============================================

let currentCommentPostId = null;

// Abrir tela de comentarios para um post
async function openComments(postId) {
    currentCommentPostId = postId;
    navigateTo('screen-comments');

    // Renderizar com cache local primeiro
    renderComments();

    // Carregar comentários do servidor
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/api/mobile/feed/${postId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.comments) {
                    const post = feedPosts.find(p => p.id === postId);
                    if (post) {
                        // Atualizar comentários do servidor
                        post.commentsList = result.data.comments.map(c => ({
                            id: c.id,
                            userId: c.user.id,
                            userName: c.user.name,
                            userPhotoUrl: c.user.photoUrl || null,
                            content: c.text,
                            createdAt: c.createdAt
                        }));
                        post.comments = post.commentsList.length;
                        saveFeedPostsToCache();
                        renderComments();
                    }
                }
            }
        } catch (e) {
            console.error('Erro ao carregar comentários:', e);
        }
    }
}

// Renderizar comentarios do post atual
function renderComments() {
    const post = feedPosts.find(p => p.id === currentCommentPostId);
    if (!post) return;

    // Inicializar array de comentarios se nao existir
    if (!post.commentsList) {
        post.commentsList = [];
    }

    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    if (post.commentsList.length === 0) {
        commentsList.innerHTML = `
            <div class="comments-empty">
                <p>Nenhum comentario ainda.</p>
                <p>Seja o primeiro a comentar!</p>
            </div>
        `;
    } else {
        commentsList.innerHTML = post.commentsList.map(comment => {
            const timeAgo = getTimeAgo(comment.createdAt);
            const avatarContent = renderAvatar(comment.userPhotoUrl, comment.userName, 36);
            return `
                <div class="comment">
                    <div class="comment-avatar">${avatarContent}</div>
                    <div class="comment-body">
                        <span class="comment-user">${comment.userName}</span>
                        <p>${comment.content}</p>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Adicionar comentario (conectado ao servidor)
async function addComment() {
    const input = document.getElementById('commentInput');
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    const post = feedPosts.find(p => p.id === currentCommentPostId);
    if (!post) return;

    const token = localStorage.getItem('token');

    // Inicializar array de comentarios se nao existir
    if (!post.commentsList) {
        post.commentsList = [];
    }

    const user = getCurrentUser();
    const userName = user?.name || 'Voce';
    const userPhotoUrl = user?.photoUrl || null;

    // Otimistic update
    const tempComment = {
        id: Date.now().toString(),
        userId: user?.id || 'local',
        userName: userName,
        userPhotoUrl: userPhotoUrl,
        content: content,
        createdAt: new Date().toISOString()
    };

    post.commentsList.push(tempComment);
    post.comments = post.commentsList.length;
    renderComments();
    input.value = '';

    // Enviar para o servidor
    if (token) {
        try {
            const response = await fetch(`${API_URL}/api/mobile/feed/${currentCommentPostId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: content }),
            });

            const result = await response.json();

            if (result.success) {
                // Atualizar comentario com dados do servidor
                const idx = post.commentsList.findIndex(c => c.id === tempComment.id);
                if (idx !== -1) {
                    post.commentsList[idx] = {
                        id: result.data.id,
                        userId: result.data.user.id,
                        userName: result.data.user.name,
                        userPhotoUrl: result.data.user.photoUrl,
                        content: result.data.text,
                        createdAt: result.data.createdAt
                    };
                }
                saveFeedPostsToCache();
            }
        } catch (e) {
            console.error('Erro ao adicionar comentario:', e);
            // Manter comentario local mesmo se falhar
        }
    } else {
        saveFeedPostsToCache();
    }
}

// =============================================
// DELETE POST SYSTEM
// =============================================

let postToDelete = null;

// Mostrar modal de confirmacao para deletar post
function confirmDeletePost(postId) {
    postToDelete = postId;
    const modal = document.getElementById('deletePostModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Fechar modal de delete
function closeDeletePostModal() {
    postToDelete = null;
    const modal = document.getElementById('deletePostModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Deletar post
async function deletePost() {
    if (!postToDelete) return;

    const postId = postToDelete;
    const postIndex = feedPosts.findIndex(p => p.id === postId);

    // Optimistic update - remove imediatamente da UI
    let deletedPost = null;
    if (postIndex !== -1) {
        deletedPost = feedPosts[postIndex];
        feedPosts.splice(postIndex, 1);
        saveFeedPostsToCache();
        renderFeed();
    }

    closeDeletePostModal();

    // Chamar API para deletar no servidor
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/api/mobile/feed/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // Se falhar, restaura o post
                if (deletedPost) {
                    feedPosts.splice(postIndex, 0, deletedPost);
                    saveFeedPostsToCache();
                    renderFeed();
                }
                console.error('Erro ao deletar post no servidor');
            }
        } catch (e) {
            // Se falhar, restaura o post
            if (deletedPost) {
                feedPosts.splice(postIndex, 0, deletedPost);
                saveFeedPostsToCache();
                renderFeed();
            }
            console.error('Erro ao deletar post:', e);
        }
    }
}

// Calcular tempo relativo
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// =============================================
// REPORT SYSTEM
// =============================================

// Audio Recording State
let isRecording = false;
let recordingTime = 0;
let recordingInterval = null;
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;
let recordedAudioUrl = null;
let audioElement = null;

// Report Media State
let reportMediaFiles = [];
let selectedTags = [];

// Initialize report screen
function initReportScreen() {
    // Update project name
    const projectNameEl = document.getElementById('reportProjectName');
    if (projectNameEl && selectedProject) {
        projectNameEl.textContent = selectedProject.cliente || selectedProject.title || 'Projeto';
    }

    // Update date
    const dateEl = document.getElementById('reportDate');
    if (dateEl) {
        const now = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('pt-BR', options);
    }

    // Reset state
    resetReportForm();
}

// Reset report form
function resetReportForm() {
    // Reset audio
    deleteRecordedAudio();

    // Reset tags
    selectedTags = [];
    document.querySelectorAll('.tag-item').forEach(tag => tag.classList.remove('selected'));
    // Remove custom tags
    document.querySelectorAll('.tag-item.custom-tag').forEach(tag => tag.remove());
    const customTagInput = document.getElementById('customTagInput');
    if (customTagInput) customTagInput.value = '';

    // Reset notes
    const notesEl = document.getElementById('reportNotes');
    if (notesEl) notesEl.value = '';

    // Reset media
    reportMediaFiles = [];
    renderMediaGrid();
}

// Toggle recording with real MediaRecorder
async function toggleRecording() {
    const recorder = document.getElementById('audioRecorder');
    const timeDisplay = document.getElementById('recordTime');
    const statusDisplay = document.getElementById('recordStatus');
    const recordBtn = document.getElementById('recordBtn');
    const micIcon = recordBtn.querySelector('.mic-icon');
    const stopIcon = recordBtn.querySelector('.stop-icon');

    if (!isRecording) {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                recordedAudioUrl = URL.createObjectURL(recordedAudioBlob);

                // Show playback section
                showAudioPlayback();

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            recorder.classList.add('recording');
            recordingTime = 0;

            // Update UI
            micIcon.style.display = 'none';
            stopIcon.style.display = 'block';
            statusDisplay.textContent = 'Gravando...';
            statusDisplay.style.color = 'var(--accent-red)';

            recordingInterval = setInterval(() => {
                recordingTime++;
                timeDisplay.textContent = formatTime(recordingTime);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            if (error.name === 'NotAllowedError') {
                alert('Permissão de microfone negada. Ative nas configurações do dispositivo.');
            } else {
                alert('Erro ao acessar microfone. Verifique se o dispositivo tem microfone disponível.');
            }
        }
    } else {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        isRecording = false;
        recorder.classList.remove('recording');
        clearInterval(recordingInterval);

        // Update UI
        micIcon.style.display = 'block';
        stopIcon.style.display = 'none';
        statusDisplay.textContent = 'Toque para gravar novamente';
        statusDisplay.style.color = 'var(--text-secondary)';
    }
}

// Show audio playback section
function showAudioPlayback() {
    const playbackSection = document.getElementById('audioPlayback');
    const durationEl = document.getElementById('audioPlaybackDuration');

    if (playbackSection) {
        playbackSection.style.display = 'flex';
        durationEl.textContent = formatTime(recordingTime);
    }

    // Create audio element for playback
    if (audioElement) {
        audioElement.pause();
        audioElement = null;
    }
    audioElement = new Audio(recordedAudioUrl);

    audioElement.onended = () => {
        const playIcon = document.querySelector('#audioPlayback .play-icon');
        const pauseIcon = document.querySelector('#audioPlayback .pause-icon');
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
    };
}

// Play recorded audio
function playRecordedAudio() {
    if (!audioElement) return;

    const playIcon = document.querySelector('#audioPlayback .play-icon');
    const pauseIcon = document.querySelector('#audioPlayback .pause-icon');

    if (audioElement.paused) {
        audioElement.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        audioElement.pause();
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

// Delete recorded audio
function deleteRecordedAudio() {
    if (audioElement) {
        audioElement.pause();
        audioElement = null;
    }

    if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
    }

    recordedAudioBlob = null;
    recordedAudioUrl = null;
    audioChunks = [];
    recordingTime = 0;

    const playbackSection = document.getElementById('audioPlayback');
    const timeDisplay = document.getElementById('recordTime');
    const statusDisplay = document.getElementById('recordStatus');

    if (playbackSection) playbackSection.style.display = 'none';
    if (timeDisplay) timeDisplay.textContent = '00:00';
    if (statusDisplay) {
        statusDisplay.textContent = 'Toque para gravar';
        statusDisplay.style.color = 'var(--text-secondary)';
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// =============================================
// QUICK TAGS
// =============================================

function toggleTag(element) {
    element.classList.toggle('selected');

    const tagText = element.textContent.trim();
    const index = selectedTags.indexOf(tagText);

    if (index === -1) {
        selectedTags.push(tagText);
    } else {
        selectedTags.splice(index, 1);
    }
}

function addCustomTag() {
    const input = document.getElementById('customTagInput');
    const tagText = input.value.trim();

    if (!tagText) return;
    if (tagText.length < 2) {
        alert('Tag muito curta');
        return;
    }

    // Check if tag already exists
    if (selectedTags.includes(tagText)) {
        alert('Tag já adicionada');
        return;
    }

    // Create new tag element
    const tagsContainer = document.getElementById('quickTags');
    const newTag = document.createElement('div');
    newTag.className = 'tag-item selected custom-tag';
    newTag.innerHTML = `
        ${tagText}
        <button class="tag-remove" onclick="event.stopPropagation(); removeCustomTag(this, '${tagText.replace(/'/g, "\\'")}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    newTag.onclick = function(e) {
        if (e.target.closest('.tag-remove')) return;
        toggleTag(this);
    };

    tagsContainer.appendChild(newTag);
    selectedTags.push(tagText);
    input.value = '';
}

function removeCustomTag(btn, tagText) {
    const tagEl = btn.closest('.tag-item');
    if (tagEl) tagEl.remove();

    const index = selectedTags.indexOf(tagText);
    if (index > -1) selectedTags.splice(index, 1);
}

// =============================================
// MEDIA UPLOAD (Photos/Videos)
// =============================================

function handleMediaUpload(event) {
    const files = Array.from(event.target.files);

    files.forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            alert(`Arquivo "${file.name}" não é uma imagem ou vídeo válido.`);
            return;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert(`Arquivo "${file.name}" é muito grande. Máximo 50MB.`);
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const mediaItem = {
                id: Date.now() + Math.random(),
                file: file,
                type: file.type.startsWith('video/') ? 'video' : 'image',
                previewUrl: e.target.result,
                name: file.name
            };

            reportMediaFiles.push(mediaItem);
            renderMediaGrid();
        };
        reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
}

function renderMediaGrid() {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;

    // Clear grid except add button
    grid.innerHTML = `
        <input type="file" id="mediaInput" accept="image/*,video/*" multiple style="display: none;" onchange="handleMediaUpload(event)">
        <div class="media-add" onclick="document.getElementById('mediaInput').click()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span>Adicionar</span>
        </div>
    `;

    // Add media items
    reportMediaFiles.forEach(item => {
        const mediaEl = document.createElement('div');
        mediaEl.className = 'media-item';

        if (item.type === 'video') {
            mediaEl.innerHTML = `
                <video src="${item.previewUrl}" class="media-preview"></video>
                <div class="media-video-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"/>
                    </svg>
                </div>
                <button class="media-remove" onclick="removeMedia('${item.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
        } else {
            mediaEl.innerHTML = `
                <img src="${item.previewUrl}" alt="${item.name}" class="media-preview">
                <button class="media-remove" onclick="removeMedia('${item.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
        }

        grid.appendChild(mediaEl);
    });
}

function removeMedia(mediaId) {
    reportMediaFiles = reportMediaFiles.filter(m => m.id != mediaId);
    renderMediaGrid();
}

// =============================================
// SUBMIT REPORT
// =============================================

async function submitReport() {
    const notes = document.getElementById('reportNotes')?.value?.trim() || '';

    // Validate: must have at least one of: audio, notes, tags, or media
    if (!recordedAudioBlob && !notes && selectedTags.length === 0 && reportMediaFiles.length === 0) {
        alert('Adicione pelo menos um conteúdo ao relatório: áudio, observações, tags ou fotos/vídeos.');
        return;
    }

    const submitBtn = document.getElementById('submitReportBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <div class="loading-spinner-small"></div>
        <span>Enviando...</span>
    `;

    try {
        // Build form data for multipart upload
        const formData = new FormData();

        if (selectedProject) {
            formData.append('projectId', selectedProject.id);
        }

        formData.append('notes', notes);
        formData.append('tags', JSON.stringify(selectedTags));

        // Add audio if recorded
        if (recordedAudioBlob) {
            formData.append('audio', recordedAudioBlob, 'report-audio.webm');
        }

        // Add media files
        reportMediaFiles.forEach((media, index) => {
            formData.append('media', media.file, media.name);
        });

        // Send to backend (or simulate for demo)
        // const response = await fetch(`${API_URL}/api/mobile/reports`, {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${getAuthToken()}`
        //     },
        //     body: formData
        // });

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Show success
        showSuccessModal('Relatório Enviado!', 'Seu relatório foi registrado com sucesso.');

        // Reset form
        resetReportForm();

        // Navigate back
        setTimeout(() => {
            navigateTo('screen-project-detail');
        }, 2000);

    } catch (error) {
        console.error('Erro ao enviar relatório:', error);
        alert(error.message || 'Erro ao enviar relatório. Tente novamente.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>Enviar Relatório</span>
        `;
    }
}

function getCurrentTime() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

// Like functionality (agora conectado ao servidor)
async function toggleLike(btn, postId) {
    const token = localStorage.getItem('token');

    // Atualizar UI imediatamente (otimistic update)
    const wasLiked = btn.classList.contains('liked');
    btn.classList.toggle('liked');
    const countSpan = btn.querySelector('span');
    let count = parseInt(countSpan.textContent);

    if (btn.classList.contains('liked')) {
        countSpan.textContent = count + 1;
    } else {
        countSpan.textContent = count - 1;
    }

    // Se tiver token e postId, enviar para o servidor
    if (token && postId) {
        try {
            const response = await fetch(`${API_URL}/api/mobile/feed/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (result.success) {
                // Atualizar com valor real do servidor
                countSpan.textContent = result.data.likesCount;
                if (result.data.liked) {
                    btn.classList.add('liked');
                } else {
                    btn.classList.remove('liked');
                }

                // Atualizar no cache local
                const post = feedPosts.find(p => p.id === postId);
                if (post) {
                    post.liked = result.data.liked;
                    post.likes = result.data.likesCount;
                    saveFeedPostsToCache();
                }
            }
        } catch (e) {
            console.error('Erro ao curtir post:', e);
            // Reverter UI em caso de erro
            if (wasLiked) {
                btn.classList.add('liked');
                countSpan.textContent = count;
            } else {
                btn.classList.remove('liked');
                countSpan.textContent = count;
            }
        }
    }
}

// Projeto selecionado atualmente
let selectedProject = null;
// Cache de projetos carregados
let cachedProjects = [];

// Obter token de autenticação
function getAuthToken() {
    return localStorage.getItem('token');
}

// Obter usuário logado
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Logout
function doLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Nota: NÃO remove savedEmail e savedPassword para auto-preenchimento
    cachedProjects = [];
    navigateTo('screen-login');
    // Preencher credenciais salvas após navegar para login
    setTimeout(() => fillSavedCredentials(), 100);
}

// Carregar e renderizar projetos do Backend
async function loadProjects() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    // Mostrar loading
    container.innerHTML = '<div class="loading-state"><span>Carregando projetos...</span></div>';

    try {
        const token = getAuthToken();

        if (!token) {
            container.innerHTML = '<div class="loading-state"><span>Faca login para ver projetos</span></div>';
            return;
        }

        const response = await fetch(`${API_URL}/api/mobile/projects`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // A API retorna data como array diretamente (não como data.projects)
            cachedProjects = Array.isArray(data.data) ? data.data : [];

            // Ordenar projetos por proximidade (se tiver localização)
            sortProjectsByProximity(cachedProjects).then(sortedProjects => {
                cachedProjects = sortedProjects;
                renderProjects(cachedProjects);
            });
        } else {
            throw new Error(data.error?.message || 'Erro ao carregar projetos');
        }
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        container.innerHTML = `
            <div class="error-state">
                <span>Erro ao carregar projetos</span>
                <button onclick="loadProjects()">Tentar novamente</button>
            </div>
        `;
    }
}

// Ordenar projetos por proximidade do usuário
async function sortProjectsByProximity(projects) {
    return new Promise((resolve) => {
        // Tentar obter localização do usuário
        if (!navigator.geolocation) {
            console.log('Geolocation not available, keeping original order');
            resolve(projects);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                // Calcular distância para cada projeto e ordenar
                const projectsWithDistance = projects.map(project => {
                    let distance = Infinity;

                    // Verificar se o projeto tem coordenadas
                    if (project.latitude && project.longitude) {
                        distance = haversineDistance(
                            userLat,
                            userLon,
                            parseFloat(project.latitude),
                            parseFloat(project.longitude)
                        );
                    }

                    return { ...project, _distance: distance };
                });

                // Ordenar por distância (mais próximo primeiro)
                projectsWithDistance.sort((a, b) => a._distance - b._distance);

                // Remover o campo temporário _distance
                const sortedProjects = projectsWithDistance.map(p => {
                    const { _distance, ...project } = p;
                    return project;
                });

                console.log('Projetos ordenados por proximidade');
                resolve(sortedProjects);
            },
            (error) => {
                console.log('Erro ao obter localizacao para ordenar:', error.message);
                // Se não conseguir localização, manter ordem original
                resolve(projects);
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000 // Cache de 1 minuto
            }
        );
    });
}

// Mapear status do backend para exibição
function getStatusLabel(status) {
    const statusMap = {
        'EM_EXECUCAO': 'Em Execução',
        'PAUSADO': 'Pausado',
        'CONCLUIDO': 'Concluído',
        'CANCELADO': 'Cancelado'
    };
    return statusMap[status] || status;
}

// Renderizar lista de projetos
function renderProjects(projects) {
    const container = document.getElementById('projectsList');
    if (!container) return;

    if (!projects || !projects.length) {
        container.innerHTML = '<div class="loading-state"><span>Nenhum projeto atribuido a voce</span></div>';
        return;
    }

    container.innerHTML = projects.map(project => {
        // Calcular m² total se não existir
        const m2Total = project.m2Total || (
            (parseFloat(project.m2Piso) || 0) +
            (parseFloat(project.m2Parede) || 0) +
            (parseFloat(project.m2Teto) || 0)
        );

        // Badge de etapa atual
        const stageBadge = project.currentStage
            ? `<span class="current-stage-badge">${project.currentStage.name} (${project.currentStage.completedCount}/${project.currentStage.totalCount})</span>`
            : `<span class="current-stage-badge no-stages">Sem etapas</span>`;

        return `
        <div class="project-card-full" onclick="openProject('${project.id}')">
            <div class="project-header-row">
                <div class="project-status-badge ${project.status === 'EM_EXECUCAO' ? 'active' : ''}">${getStatusLabel(project.status)}</div>
            </div>
            <h3>${project.cliente || project.title}</h3>
            ${stageBadge}
            <p class="project-address">${formatEndereco(project.endereco)}</p>

            <div class="project-tags">
                ${project.cor ? `<span class="project-tag cor">${project.cor}</span>` : ''}
                ${project.material ? `<span class="project-tag">${project.material.split(',')[0]}</span>` : ''}
            </div>

            <div class="project-stats-row">
                <div class="stat-item">
                    <span class="stat-value">${m2Total.toFixed(0)}</span>
                    <span class="stat-label">m² total</span>
                </div>
                ${project.m2Piso ? `
                <div class="stat-item">
                    <span class="stat-value">${parseFloat(project.m2Piso).toFixed(0)}</span>
                    <span class="stat-label">m² piso</span>
                </div>
                ` : ''}
                ${project.m2Parede ? `
                <div class="stat-item">
                    <span class="stat-value">${parseFloat(project.m2Parede).toFixed(0)}</span>
                    <span class="stat-label">m² parede</span>
                </div>
                ` : ''}
            </div>
        </div>
    `}).join('');
}

// Formatar endereço para exibição
function formatEndereco(endereco) {
    if (!endereco) return 'Endereco nao informado';
    // Pegar apenas cidade e rua, limitar tamanho
    const parts = endereco.split(',');
    if (parts.length > 2) {
        return parts.slice(0, 2).join(',').substring(0, 60) + '...';
    }
    return endereco.substring(0, 60) + (endereco.length > 60 ? '...' : '');
}

// Abrir detalhe do projeto
async function openProject(projectId) {
    // Buscar projeto no cache primeiro para mostrar dados básicos
    selectedProject = cachedProjects.find(p => p.id === projectId);
    if (selectedProject) {
        updateProjectDetailScreen(selectedProject);
        navigateTo('screen-project-detail');
        updateEntryRequestButton(); // Update entry request button state
    }

    // Buscar detalhes completos do projeto (incluindo equipe) da API
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/mobile/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            selectedProject = { ...selectedProject, ...data.data };
            // Atualizar a equipe na tela
            renderProjectTeam(data.data.team || []);

            // Load tasks if user is checked in to this project
            if (isCheckedIn && activeCheckinId) {
                loadProjectTasks(projectId);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes do projeto:', error);
    }
}

// Renderizar equipe do projeto
function renderProjectTeam(team) {
    const teamList = document.getElementById('teamList');
    if (!teamList) return;

    if (!team || team.length === 0) {
        teamList.innerHTML = '<div class="empty-team">Nenhum membro atribuído</div>';
        return;
    }

    teamList.innerHTML = team.map(member => {
        const initials = member.name
            ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : '??';

        const photoHtml = member.photoUrl
            ? `<img src="${getPhotoUrl(member.photoUrl)}" alt="${member.name}" class="member-avatar-img">`
            : initials;

        const roleLabel = getRoleLabel(member.projectRole || member.role);

        return `
            <div class="team-member">
                <div class="member-avatar">${photoHtml}</div>
                <div class="member-info">
                    <span class="member-name">${member.name || 'Sem nome'}</span>
                    <span class="member-role">${roleLabel}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Helper para obter label do cargo
function getRoleLabel(role) {
    const labels = {
        'LIDER': 'Líder',
        'APLICADOR_III': 'Aplicador III',
        'APLICADOR_II': 'Aplicador II',
        'APLICADOR_I': 'Aplicador I',
        'LIDER_PREPARACAO': 'Líder da Preparação',
        'PREPARADOR': 'Preparador',
        'AUXILIAR': 'Auxiliar'
    };
    return labels[role] || role || 'Membro';
}

// Atualizar tela de detalhes com dados do projeto
function updateProjectDetailScreen(project) {
    // Atualizar título do header
    const titleEl = document.querySelector('#screen-project-detail h1');
    if (titleEl) titleEl.textContent = 'Detalhes do Projeto';

    // Atualizar info do projeto no card de detalhes
    const projectDetailCard = document.querySelector('#screen-project-detail .project-detail-card');
    if (projectDetailCard) {
        const h2 = projectDetailCard.querySelector('h2');
        const address = projectDetailCard.querySelector('.project-address');

        if (h2) h2.textContent = project.cliente || project.title || 'Projeto';
        if (address) address.textContent = project.endereco || project.address || 'Endereço não informado';

        // Atualizar informações de horário de trabalho
        const scheduleInfo = document.getElementById('projectScheduleInfo');
        if (scheduleInfo) {
            const workStart = project.workStartTime || '08:00';
            const saturday = project.allowSaturday ? 'SIM' : 'NÃO';
            const sunday = project.allowSunday ? 'SIM' : 'NÃO';

            scheduleInfo.textContent = `Horário de entrada: ${workStart} / Sábado: ${saturday} / Domingo: ${sunday}`;
            scheduleInfo.style.display = 'block';
        }
    }

    // Atualizar info do projeto (card antigo se existir)
    const projectInfo = document.querySelector('#screen-project-detail .project-info-card h2');
    if (projectInfo) projectInfo.textContent = project.cliente || project.title;

    const projectAddr = document.querySelector('#screen-project-detail .project-info-card .project-address');
    if (projectAddr) projectAddr.textContent = project.endereco || 'Endereco nao informado';

    // Atualizar ícone do personagem no mapa (dentro do position-dot)
    const mapMarker = document.getElementById('mapYouMarker');
    if (mapMarker) {
        const user = getCurrentUser();
        const iconUrl = getCharacterIcon(user?.role);
        const positionDot = mapMarker.querySelector('.position-dot');
        if (positionDot) {
            positionDot.innerHTML = `<img src="${iconUrl}" alt="Você" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
    }

    // Iniciar monitoramento de geolocalização
    startGeolocationWatch();
}

// Atualizar dados do perfil na UI
function updateProfileUI(bustCache = false) {
    const user = getCurrentUser();
    if (!user) return;

    // Atualizar avatar com foto ou iniciais
    const avatars = document.querySelectorAll('.avatar');
    const photoUrl = getPhotoUrl(user.photoUrl, bustCache);

    avatars.forEach(avatar => {
        if (photoUrl) {
            avatar.innerHTML = `<img src="${photoUrl}" alt="Avatar" class="avatar-img">`;
        } else if (user.name) {
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            avatar.textContent = initials;
        }
    });

    // Atualizar nome no perfil
    const profileName = document.querySelector('#screen-profile .profile-name');
    if (profileName && user.name) {
        profileName.textContent = user.name;
    }

    // Atualizar username
    const profileUsername = document.querySelector('#screen-profile .profile-role');
    if (profileUsername && user.username) {
        profileUsername.textContent = '@' + user.username;
    }
}

// =============================================
// NEARBY PROJECTS SYSTEM
// =============================================
let nearbyProjects = [];
let nearbyProjectsOffset = 0;
let nearbyProjectsHasMore = true;
let nearbyProjectsTotal = 0;
let selectedContributionProject = null;
let nearbyProjectsLoaded = false;
let nearbyProjectsExpanded = false;
const NEARBY_PROJECTS_LIMIT = 5;

// Open nearby projects modal
function openNearbyProjectsModal() {
    const modal = document.getElementById('nearbyProjectsModal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Load projects when opening modal
    loadNearbyProjects();
}

// Close nearby projects modal
function closeNearbyProjectsModal() {
    const modal = document.getElementById('nearbyProjectsModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Reset nearby projects when navigating away
function resetNearbyProjectsSection() {
    nearbyProjectsLoaded = false;
    nearbyProjects = [];
    nearbyProjectsOffset = 0;
    closeNearbyProjectsModal();
}

// Load nearby projects from API
async function loadNearbyProjects() {
    const container = document.getElementById('nearbyProjectsList');
    const loadMoreBtn = document.getElementById('loadMoreNearbyBtn');

    if (!container) return;

    // Reset state
    nearbyProjects = [];
    nearbyProjectsOffset = 0;
    nearbyProjectsHasMore = true;

    // Show loading
    container.innerHTML = '<div class="nearby-loading"><div class="spinner"></div><span>Buscando sua localizacao...</span></div>';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    try {
        const token = getAuthToken();
        if (!token) {
            container.innerHTML = '<div class="nearby-empty">Faca login para ver projetos proximos</div>';
            return;
        }

        // Get current position
        const position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalizacao nao suportada'));
                return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000
            });
        });

        container.innerHTML = '<div class="nearby-loading"><div class="spinner"></div><span>Carregando projetos...</span></div>';

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const response = await fetch(
            `${API_URL}/api/mobile/projects/nearby?lat=${lat}&lng=${lng}&limit=${NEARBY_PROJECTS_LIMIT}&offset=0`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (data.success) {
            nearbyProjects = data.data.projects || [];
            nearbyProjectsTotal = data.data.total || 0;
            nearbyProjectsHasMore = data.data.hasMore || false;
            nearbyProjectsOffset = NEARBY_PROJECTS_LIMIT;

            renderNearbyProjects();
        } else {
            throw new Error(data.error?.message || 'Erro ao carregar projetos proximos');
        }
    } catch (error) {
        console.error('Erro ao carregar projetos proximos:', error);

        let errorMessage = 'Erro ao carregar projetos proximos';

        if (error.message.includes('permission') || error.code === 1) {
            errorMessage = 'Ative a localizacao para ver projetos proximos';
        } else if (error.message.includes('NO_TOKEN') || error.message.includes('token')) {
            errorMessage = 'Faca login para ver projetos proximos';
        } else if (error.message.includes('INVALID_TOKEN')) {
            errorMessage = 'Sessao expirada. Faca login novamente';
            // Clear invalid token
            localStorage.removeItem('token');
        } else if (error.message) {
            errorMessage = error.message;
        }

        container.innerHTML = `<div class="nearby-empty">${errorMessage}</div>`;
    }
}

// Render nearby projects list
function renderNearbyProjects() {
    const container = document.getElementById('nearbyProjectsList');
    const loadMoreBtn = document.getElementById('loadMoreNearbyBtn');

    if (!container) return;

    if (nearbyProjects.length === 0) {
        container.innerHTML = '<div class="nearby-empty">Nenhum projeto proximo encontrado</div>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    container.innerHTML = nearbyProjects.map(project => {
        const m2Total = project.m2Total || 0;
        const teamSize = project.teamSize || 0;
        const distance = project.distanceFormatted || formatDistance(project.distance);

        return `
            <div class="nearby-project-card">
                <div class="nearby-project-header">
                    <span class="nearby-project-icon">📍</span>
                    <span class="nearby-project-name">${project.name || project.cliente || 'Projeto'}</span>
                </div>
                <div class="nearby-project-info">
                    <span class="nearby-project-distance">${distance}</span>
                    <span class="nearby-project-separator">•</span>
                    <span class="nearby-project-m2">${m2Total.toFixed(0)} m²</span>
                    <span class="nearby-project-separator">•</span>
                    <span class="nearby-project-team">👥 ${teamSize} ${teamSize === 1 ? 'pessoa' : 'pessoas'}</span>
                </div>
                <button class="btn-contribute" onclick="openContributionModal('${project.id}', '${(project.name || project.cliente || 'Projeto').replace(/'/g, "\\'")}')">
                    QUERO CONTRIBUIR AQUI
                </button>
            </div>
        `;
    }).join('');

    // Show/hide load more button
    if (loadMoreBtn) {
        loadMoreBtn.style.display = nearbyProjectsHasMore ? 'flex' : 'none';
    }
}

// Format distance for display
function formatDistance(meters) {
    if (!meters && meters !== 0) return '-- km';
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

// Load more nearby projects
async function loadMoreNearbyProjects() {
    const loadMoreBtn = document.getElementById('loadMoreNearbyBtn');

    if (!nearbyProjectsHasMore) return;

    // Show loading state on button
    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<span class="btn-loading">Carregando...</span>';
        loadMoreBtn.disabled = true;
    }

    try {
        const token = getAuthToken();
        if (!token) return;

        // Get current position
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000
            });
        });

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const response = await fetch(
            `${API_URL}/api/mobile/projects/nearby?lat=${lat}&lng=${lng}&limit=${NEARBY_PROJECTS_LIMIT}&offset=${nearbyProjectsOffset}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (data.success) {
            const newProjects = data.data.projects || [];
            nearbyProjects = [...nearbyProjects, ...newProjects];
            nearbyProjectsHasMore = data.data.hasMore || false;
            nearbyProjectsOffset += NEARBY_PROJECTS_LIMIT;

            renderNearbyProjects();
        }
    } catch (error) {
        console.error('Erro ao carregar mais projetos:', error);
    } finally {
        // Reset button
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<span class="btn-plus">+</span> Carregar Mais';
            loadMoreBtn.disabled = false;
        }
    }
}

// Open contribution modal
function openContributionModal(projectId, projectName) {
    selectedContributionProject = { id: projectId, name: projectName };

    const modal = document.getElementById('contributionModal');
    const projectNameEl = document.getElementById('contributionProjectName');
    const descriptionEl = document.getElementById('contributionDescription');

    if (projectNameEl) projectNameEl.textContent = projectName;
    if (descriptionEl) descriptionEl.value = '';
    if (modal) modal.classList.add('active');
}

// Close contribution modal
function closeContributionModal() {
    const modal = document.getElementById('contributionModal');
    if (modal) modal.classList.remove('active');
    selectedContributionProject = null;
}

// Submit contribution request
async function submitContributionRequest() {
    if (!selectedContributionProject) return;

    const descriptionEl = document.getElementById('contributionDescription');
    const submitBtn = document.querySelector('#contributionModal .btn-primary');
    const description = descriptionEl ? descriptionEl.value.trim() : '';

    // Disable button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
    }

    try {
        const token = getAuthToken();
        if (!token) throw new Error('Nao autenticado');

        const response = await fetch(
            `${API_URL}/api/mobile/projects/${selectedContributionProject.id}/request-contribution`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ description })
            }
        );

        const data = await response.json();

        if (data.success) {
            closeContributionModal();
            showContributionSuccessModal();
        } else {
            throw new Error(data.error?.message || 'Erro ao enviar solicitacao');
        }
    } catch (error) {
        console.error('Erro ao enviar solicitacao:', error);
        alert(error.message || 'Erro ao enviar solicitacao. Tente novamente.');
    } finally {
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Solicitacao';
        }
    }
}

// Show contribution success modal
function showContributionSuccessModal() {
    const modal = document.getElementById('contributionSuccessModal');
    if (modal) modal.classList.add('active');
}

// Close contribution success modal
function closeContributionSuccessModal() {
    const modal = document.getElementById('contributionSuccessModal');
    if (modal) modal.classList.remove('active');
}

// Show contribution approved notification
function showContributionApprovedNotification(data) {
    const projectName = data.projectName || 'Projeto';

    // Create notification modal if it doesn't exist
    let modal = document.getElementById('contributionNotificationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'contributionNotificationModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="contribution-notification-modal approved">
            <div class="notification-icon approved">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
            </div>
            <h3>Solicitacao Aprovada!</h3>
            <p>Voce foi adicionado ao projeto:</p>
            <p class="project-name">${projectName}</p>
            <p class="notification-subtitle">O projeto agora aparece na sua lista de projetos.</p>
            <button class="btn-primary" onclick="closeContributionNotificationModal(); loadProjects();">Entendi</button>
        </div>
    `;

    modal.classList.add('active');

    // Reload projects list to show the new project
    loadProjects();
}

// Show contribution rejected notification
function showContributionRejectedNotification(data) {
    const projectName = data.projectName || 'Projeto';

    // Create notification modal if it doesn't exist
    let modal = document.getElementById('contributionNotificationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'contributionNotificationModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="contribution-notification-modal rejected">
            <div class="notification-icon rejected">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            </div>
            <h3>Solicitacao Negada</h3>
            <p>Sua solicitacao para o projeto:</p>
            <p class="project-name">${projectName}</p>
            <p class="notification-subtitle">foi negada pelo administrador.</p>
            <button class="btn-primary" onclick="closeContributionNotificationModal()">Entendi</button>
        </div>
    `;

    modal.classList.add('active');
}

// Close contribution notification modal
function closeContributionNotificationModal() {
    const modal = document.getElementById('contributionNotificationModal');
    if (modal) modal.classList.remove('active');
}

// =============================================
// LOCATION TRACKING
// =============================================
let locationTrackingInterval = null;

function startLocationTracking() {
    if (locationTrackingInterval) return;

    // Enviar localização a cada 2 minutos
    locationTrackingInterval = setInterval(sendLocation, 2 * 60 * 1000);

    // Enviar imediatamente
    sendLocation();
}

function stopLocationTracking() {
    if (locationTrackingInterval) {
        clearInterval(locationTrackingInterval);
        locationTrackingInterval = null;
    }

    // Marcar como offline
    markOffline();
}

async function sendLocation() {
    if (!navigator.geolocation) return;

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 30000
            });
        });

        await fetch(`${API_URL}/api/mobile/location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                isOnline: true
            })
        });

        // Atualizar UI do banner de localização
        updateLocationBanner(true);
    } catch (error) {
        console.log('Erro ao enviar localização:', error);
        updateLocationBanner(false);
    }
}

async function markOffline() {
    try {
        await fetch(`${API_URL}/api/mobile/location/offline`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
    } catch (error) {
        console.log('Erro ao marcar offline:', error);
    }
}

function updateLocationBanner(active) {
    const banner = document.getElementById('locationBanner');
    if (!banner) return;

    if (active) {
        banner.innerHTML = `
            <div class="location-icon" style="background-color: rgba(34, 197, 94, 0.15);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #22c55e;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
            </div>
            <span style="color: #22c55e;">Localização ativa</span>
        `;
    } else {
        banner.innerHTML = `
            <div class="location-icon" style="background-color: rgba(239, 68, 68, 0.15);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ef4444;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
            </div>
            <span style="color: #ef4444;">Localização indisponível</span>
        `;
    }
}

// =============================================
// HOURS - Carregar horas do backend
// =============================================
let currentHoursMonth = new Date().getMonth() + 1;
let currentHoursYear = new Date().getFullYear();

const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function changeHoursMonth(delta) {
    currentHoursMonth += delta;

    if (currentHoursMonth > 12) {
        currentHoursMonth = 1;
        currentHoursYear++;
    } else if (currentHoursMonth < 1) {
        currentHoursMonth = 12;
        currentHoursYear--;
    }

    // Atualizar texto do periodo
    const periodText = document.getElementById('hoursPeriodText');
    if (periodText) {
        periodText.textContent = `${monthNames[currentHoursMonth - 1]} ${currentHoursYear}`;
    }

    loadHours();
}

async function loadHours() {
    try {
        const response = await fetch(`${API_URL}/api/mobile/earnings?month=${currentHoursMonth}&year=${currentHoursYear}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            renderEarnings(data.data);
        }
    } catch (error) {
        console.error('Erro ao carregar ganhos:', error);
        // Mostrar estado vazio em caso de erro
        renderEarnings({ summary: { totalEarnings: 0, totalHours: 0 }, byProject: [], xp: {} });
    }
}

// Mapa de labels de cargo
const roleLabels = {
    'AUXILIAR': 'Ajudante',
    'PREPARADOR': 'Preparador',
    'LIDER_PREPARACAO': 'Finalizador',
    'APLICADOR_I': 'Aplicador I',
    'APLICADOR_II': 'Aplicador II',
    'APLICADOR_III': 'Aplicador III',
    'LIDER': 'Líder'
};

// Formatar valor em reais
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

// Formatar horas
function formatHours(hours) {
    const h = Math.floor(hours || 0);
    const m = Math.round(((hours || 0) - h) * 60);
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function renderEarnings(earningsData) {
    // Atualizar texto do periodo
    const periodText = document.getElementById('hoursPeriodText');
    if (periodText) {
        periodText.textContent = `${monthNames[currentHoursMonth - 1]} ${currentHoursYear}`;
    }

    // Atualizar cargo do usuário
    const roleEl = document.getElementById('hoursUserRole');
    if (roleEl && earningsData.currentRole) {
        roleEl.textContent = roleLabels[earningsData.currentRole] || earningsData.currentRole;
    }

    // Atualizar valor total
    const earningsTotalEl = document.getElementById('earningsTotalValue');
    if (earningsTotalEl) {
        earningsTotalEl.textContent = formatCurrency(earningsData.summary?.totalEarnings);
    }

    // Atualizar horas trabalhadas
    const totalHoursEl = document.getElementById('earningsTotalHours');
    if (totalHoursEl) {
        totalHoursEl.textContent = formatHours(earningsData.summary?.totalHours);
    }

    // Atualizar valor/hora atual
    const hourlyRateEl = document.getElementById('earningsHourlyRate');
    if (hourlyRateEl && earningsData.currentRates) {
        hourlyRateEl.textContent = formatCurrency(earningsData.currentRates.hourlyRate);
    }

    // Atualizar breakdown de horas
    const hoursNormalEl = document.getElementById('hoursNormalValue');
    if (hoursNormalEl) {
        hoursNormalEl.textContent = formatHours(earningsData.summary?.hoursNormal);
    }

    const hoursOvertimeEl = document.getElementById('hoursOvertimeValue');
    if (hoursOvertimeEl) {
        hoursOvertimeEl.textContent = formatHours(earningsData.summary?.hoursOvertime);
    }

    const hoursTravelModeEl = document.getElementById('hoursTravelModeValue');
    if (hoursTravelModeEl) {
        hoursTravelModeEl.textContent = formatHours(earningsData.summary?.hoursTravelMode);
    }

    const hoursTravelEl = document.getElementById('hoursTravelValue');
    if (hoursTravelEl) {
        const travel = (earningsData.summary?.hoursTravel || 0) + (earningsData.summary?.hoursSupplies || 0);
        hoursTravelEl.textContent = formatHours(travel);
    }

    // Atualizar XP
    const xpEarnedEl = document.getElementById('xpEarnedValue');
    if (xpEarnedEl) {
        xpEarnedEl.textContent = `+${earningsData.xp?.earnedThisMonth || 0}`;
    }

    const xpPenaltyEl = document.getElementById('xpPenaltyValue');
    if (xpPenaltyEl) {
        xpPenaltyEl.textContent = `-${earningsData.xp?.penaltyThisMonth || 0}`;
    }

    const xpTotalEl = document.getElementById('xpTotalValue');
    if (xpTotalEl) {
        xpTotalEl.textContent = earningsData.xp?.total || 0;
    }

    // Atualizar lista de projetos
    const projectsList = document.getElementById('hoursProjectList');
    const emptyState = document.getElementById('hoursEmptyState');

    if (!projectsList) return;

    if (!earningsData.byProject || earningsData.byProject.length === 0) {
        // Mostrar estado vazio
        if (emptyState) emptyState.style.display = 'flex';
        // Remover cards de projeto existentes
        projectsList.querySelectorAll('.project-earnings-card').forEach(card => card.remove());
    } else {
        // Esconder estado vazio
        if (emptyState) emptyState.style.display = 'none';

        // Renderizar projetos com ganhos
        const projectsHTML = earningsData.byProject.map(item => {
            const projectName = item.project?.title || 'Projeto';
            const clientName = item.project?.cliente || '';
            const isTravelMode = item.project?.isTravelMode || false;
            const earnings = item.earnings || 0;
            const hours = item.hours || 0;
            const hoursNormal = item.hoursNormal || 0;
            const hoursOvertime = item.hoursOvertime || 0;
            const checkins = item.checkins || 0;
            const xpEarned = item.xpEarned || 0;
            const xpPenalty = item.xpPenalty || 0;

            return `
                <div class="project-earnings-card ${isTravelMode ? 'travel-mode' : ''}">
                    <div class="project-earnings-header">
                        <div class="project-earnings-info">
                            <h3>${projectName} ${isTravelMode ? '<span class="travel-mode-badge">Viagem</span>' : ''}</h3>
                            ${clientName ? `<span class="client-name">${clientName}</span>` : ''}
                        </div>
                        <span class="project-earnings-value">${formatCurrency(earnings)}</span>
                    </div>
                    <div class="project-hours-breakdown">
                        <div class="project-hour-item">
                            <span class="project-hour-value">${formatHours(hours)}</span>
                            <span class="project-hour-label">Total</span>
                        </div>
                        <div class="project-hour-item">
                            <span class="project-hour-value">${formatHours(hoursNormal)}</span>
                            <span class="project-hour-label">Normais</span>
                        </div>
                        <div class="project-hour-item">
                            <span class="project-hour-value">${formatHours(hoursOvertime)}</span>
                            <span class="project-hour-label">Extras</span>
                        </div>
                        <div class="project-hour-item">
                            <span class="project-hour-value">${checkins}</span>
                            <span class="project-hour-label">Check-ins</span>
                        </div>
                    </div>
                    <div class="project-xp-row">
                        <div class="project-xp-item earned">
                            <span>⭐</span>
                            <span>+${xpEarned} XP ganho</span>
                        </div>
                        ${xpPenalty > 0 ? `
                        <div class="project-xp-item penalty">
                            <span>⚠️</span>
                            <span>-${xpPenalty} XP penalidade</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Remover cards existentes e adicionar novos
        projectsList.querySelectorAll('.project-earnings-card').forEach(card => card.remove());
        projectsList.querySelectorAll('.hours-project-card').forEach(card => card.remove());
        projectsList.insertAdjacentHTML('beforeend', projectsHTML);
    }
}

// =============================================
// REPORTS - Enviar relatório para o backend
// =============================================
async function submitReport() {
    if (!selectedProject && !currentProjectForCheckin) {
        alert('Selecione um projeto primeiro');
        return;
    }

    const projectId = currentProjectForCheckin || selectedProject?.id;
    const notesEl = document.getElementById('reportNotes');
    const notes = notesEl ? notesEl.value : '';

    try {
        const response = await fetch(`${API_URL}/api/mobile/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                projectId,
                notes
            })
        });

        const data = await response.json();

        if (data.success) {
            // Limpar form
            if (notesEl) notesEl.value = '';

            // Se o usuário ainda está checado, fazer checkout automático
            console.log('[REPORT] Verificando checkout automático - isCheckedIn:', isCheckedIn, 'activeCheckinId:', activeCheckinId);
            if (isCheckedIn && activeCheckinId) {
                console.log('[REPORT] Iniciando checkout automático após relatório...');
                try {
                    const checkoutResult = await doCheckoutWithTasksAndReminder('REPORT_SENT');
                    console.log('[REPORT] Checkout automático concluído!', checkoutResult);

                    // Mostrar animação de XP se ganhou XP
                    if (checkoutResult?.xp) {
                        showXPNotification(
                            checkoutResult.xp.totalEarned,
                            'Relatório + Checkout',
                            checkoutResult.xp.total
                        );
                    } else {
                        showSuccessModal('Relatório Enviado!', 'Relatório enviado e checkout realizado com sucesso.');
                    }
                } catch (checkoutError) {
                    console.error('[REPORT] Erro no checkout após relatório:', checkoutError);
                    showSuccessModal('Relatório Enviado!', 'Relatório enviado. Checkout pendente.');
                }
            } else {
                console.log('[REPORT] Usuário não está checado, pulando checkout automático');
                showSuccessModal('Relatório Enviado!', 'O relatório foi enviado para o time do projeto.');
            }

            // Voltar para tela de projetos
            setTimeout(() => {
                closeModal();
                navigateTo('screen-projects');
            }, 1500);
        } else {
            throw new Error(data.error?.message || 'Erro ao enviar relatório');
        }
    } catch (error) {
        console.error('Erro ao enviar relatório:', error);
        alert(error.message || 'Erro ao enviar relatório. Tente novamente.');
    }
}

// =============================================
// PROFILE - Carregar perfil do backend
// =============================================
let cachedProfile = null;

async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/api/mobile/profile`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Check for role evolution BEFORE updating the cached profile
            checkForRoleEvolution(data.data);

            cachedProfile = data.data;
            // Atualizar localStorage com dados atualizados
            localStorage.setItem('user', JSON.stringify(data.data));
            renderProfile(data.data);
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Usar dados do localStorage como fallback
        const user = getCurrentUser();
        if (user) renderProfile(user);
    }
}

function renderProfile(profile, bustCache = false) {
    // Atualizar avatar
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) {
        const photoUrl = getPhotoUrl(profile.photoUrl, bustCache);
        if (photoUrl) {
            avatarEl.innerHTML = `<img src="${photoUrl}" alt="Avatar" class="avatar-img">`;
        } else if (profile.name) {
            const initials = profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            avatarEl.textContent = initials;
        }
    }

    // Atualizar nome
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = profile.name || 'Usuario';

    // Atualizar username
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.textContent = '@' + (profile.username || 'usuario');

    // Atualizar icone do personagem e texto da role no badge
    const characterIconEl = document.getElementById('profileCharacterIcon');
    if (characterIconEl) {
        const iconUrl = getCharacterIcon(profile.role);
        characterIconEl.innerHTML = `<img src="${iconUrl}" alt="Personagem" class="character-icon-img">`;
    }

    const roleTextEl = document.getElementById('profileRoleText');
    if (roleTextEl) {
        roleTextEl.textContent = getCharacterLabel(profile.role);
    }

    // Atualizar estatisticas
    const hoursEl = document.getElementById('profileHours');
    if (hoursEl) hoursEl.textContent = Math.round(profile.totalHoursWorked || 0);

    const m2El = document.getElementById('profileM2');
    if (m2El) {
        const m2 = profile.totalM2Applied || 0;
        m2El.textContent = m2 >= 1000 ? (m2/1000).toFixed(1) + 'k' : Math.round(m2);
    }

    const projectsEl = document.getElementById('profileProjects');
    if (projectsEl) projectsEl.textContent = profile.totalProjectsCount || 0;

    // Render primary badge (verification badge next to name)
    renderPrimaryBadge(profile.primaryBadge);

    // Render badges collection
    renderBadgesSection(profile.badges || []);

    // Atualizar avatares globais
    updateProfileUI(bustCache);
}

// Render primary badge (like Instagram verification)
function renderPrimaryBadge(primaryBadge) {
    const badgeEl = document.getElementById('profileVerifiedBadge');
    const iconEl = document.getElementById('profileVerifiedIcon');

    if (!badgeEl || !iconEl) return;

    if (primaryBadge && primaryBadge.iconUrl) {
        // Build full URL for badge icon
        const iconUrl = primaryBadge.iconUrl.startsWith('http')
            ? primaryBadge.iconUrl
            : `${API_URL}${primaryBadge.iconUrl}`;
        iconEl.src = iconUrl;
        iconEl.alt = primaryBadge.name || 'Badge';
        iconEl.title = primaryBadge.name || '';
        badgeEl.style.display = 'flex';
        console.log('[Profile] Primary badge displayed:', primaryBadge.name);
    } else {
        badgeEl.style.display = 'none';
    }
}

// Render badges collection section
function renderBadgesSection(badges) {
    const gridEl = document.getElementById('badgesGrid');
    const countEl = document.getElementById('badgesCount');
    const emptyEl = document.getElementById('badgesEmpty');

    if (!gridEl) return;

    // Update badges count
    if (countEl) {
        countEl.textContent = badges ? badges.length : 0;
    }

    // If user has badges, render them
    if (badges && badges.length > 0) {
        // Hide empty state
        if (emptyEl) emptyEl.style.display = 'none';

        gridEl.innerHTML = badges.map(badge => {
            const rarityClass = badge.rarity ? `rarity-${badge.rarity.toLowerCase()}` : 'rarity-common';
            const primaryClass = badge.isPrimary ? 'is-primary' : '';
            // Build full URL for badge icon
            const iconUrl = badge.iconUrl && badge.iconUrl.startsWith('http')
                ? badge.iconUrl
                : (badge.iconUrl ? `${API_URL}${badge.iconUrl}` : 'icons/badge-default.png');

            return `
                <div class="badge-item ${rarityClass} ${primaryClass}" title="${badge.description || badge.name}" onclick="toggleBadgePrimary('${badge.id}', ${badge.isPrimary})">
                    <div class="badge-icon" style="background-color: ${badge.color || '#c9a962'}20;">
                        <img src="${iconUrl}" alt="${badge.name}" onerror="this.src='icons/badge-default.png'">
                    </div>
                    <span class="badge-name">${badge.name}</span>
                    ${badge.isPrimary ? '<span class="badge-primary-indicator">Principal</span>' : ''}
                </div>
            `;
        }).join('');

        console.log('[Profile] Badges rendered:', badges.length);
    } else {
        // Show empty state
        if (emptyEl) {
            emptyEl.style.display = 'flex';
            gridEl.innerHTML = '';
            gridEl.appendChild(emptyEl);
        }
    }
}

// Toggle badge as primary (click handler)
async function toggleBadgePrimary(badgeId, currentlyPrimary) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Voce precisa estar logado!');
            return;
        }

        const method = currentlyPrimary ? 'DELETE' : 'PUT';
        const response = await fetch(`${API_URL}/api/mobile/badges/${badgeId}/primary`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Reload profile to update badges
            await loadProfile();
            // Also reload badges screen if on it
            if (document.getElementById('screen-badges')?.classList.contains('active')) {
                loadBadgesScreen();
            }
            showSuccessModal(currentlyPrimary ? 'Badge Removido' : 'Badge Definido!',
                currentlyPrimary
                    ? 'Este badge nao e mais seu badge principal.'
                    : 'Este badge agora aparece ao lado do seu nome!');
        } else {
            alert(data.error?.message || 'Erro ao atualizar badge');
        }
    } catch (error) {
        console.error('[Badge] Error toggling primary:', error);
        alert('Erro ao atualizar badge. Tente novamente.');
    }
}

// =============================================
// BADGES SCREEN
// =============================================

// Load and display the badges screen
async function loadBadgesScreen() {
    const profile = cachedProfile || await loadProfileData();
    if (!profile) {
        console.error('[Badges] No profile data available');
        return;
    }

    const badges = profile.badges || [];
    const primaryBadge = profile.primaryBadge || null;

    // Update stats
    updateBadgesStats(badges);

    // Render primary badge section
    renderPrimaryBadgeSection(primaryBadge);

    // Render all badges list
    renderBadgesList(badges, primaryBadge);

    console.log('[Badges] Screen loaded with', badges.length, 'badges');
}

// Helper to load profile data if not cached
async function loadProfileData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const response = await fetch(`${API_URL}/api/mobile/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data.success) {
            cachedProfile = data.data;
            return data.data;
        }
    } catch (error) {
        console.error('[Badges] Error loading profile:', error);
    }
    return null;
}

// Update badges statistics
function updateBadgesStats(badges) {
    const totalEl = document.getElementById('totalBadgesCount');
    const legendaryEl = document.getElementById('legendaryBadgesCount');
    const epicEl = document.getElementById('epicBadgesCount');
    const rareEl = document.getElementById('rareBadgesCount');

    if (totalEl) totalEl.textContent = badges.length;

    // Count by rarity
    const counts = {
        LEGENDARY: 0,
        EPIC: 0,
        RARE: 0,
        COMMON: 0
    };

    badges.forEach(badge => {
        const rarity = badge.rarity || 'COMMON';
        if (counts[rarity] !== undefined) {
            counts[rarity]++;
        }
    });

    if (legendaryEl) legendaryEl.textContent = counts.LEGENDARY;
    if (epicEl) epicEl.textContent = counts.EPIC;
    if (rareEl) rareEl.textContent = counts.RARE;
}

// Render primary badge section
function renderPrimaryBadgeSection(primaryBadge) {
    const sectionEl = document.getElementById('primaryBadgeSection');
    const cardEl = document.getElementById('primaryBadgeCard');

    if (!sectionEl || !cardEl) return;

    if (primaryBadge) {
        sectionEl.style.display = 'block';

        const iconUrl = primaryBadge.iconUrl && primaryBadge.iconUrl.startsWith('http')
            ? primaryBadge.iconUrl
            : (primaryBadge.iconUrl ? `${API_URL}${primaryBadge.iconUrl}` : 'icons/badge-default.png');

        const earnedDate = primaryBadge.earnedAt
            ? new Date(primaryBadge.earnedAt).toLocaleDateString('pt-BR')
            : '';

        const rarityLabel = {
            'LEGENDARY': 'Lendaria',
            'EPIC': 'Epica',
            'RARE': 'Rara',
            'COMMON': 'Comum'
        }[primaryBadge.rarity] || 'Comum';

        cardEl.innerHTML = `
            <img src="${iconUrl}" alt="${primaryBadge.name}" class="primary-badge-icon" onerror="this.src='icons/badge-default.png'">
            <div class="primary-badge-info">
                <div class="primary-badge-name">${primaryBadge.name}</div>
                <span class="primary-badge-rarity ${primaryBadge.rarity || 'COMMON'}">${rarityLabel}</span>
                ${earnedDate ? `<div class="primary-badge-date">Conquistado em ${earnedDate}</div>` : ''}
            </div>
            <button class="remove-primary-btn" onclick="toggleBadgePrimary('${primaryBadge.id}', true)" title="Remover destaque">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
    } else {
        sectionEl.style.display = 'none';
    }
}

// Render badges list
function renderBadgesList(badges, primaryBadge) {
    const listEl = document.getElementById('badgesList');
    const emptyEl = document.getElementById('badgesEmptyState');

    if (!listEl) return;

    if (badges && badges.length > 0) {
        // Hide empty state
        if (emptyEl) emptyEl.style.display = 'none';

        // Sort badges: primary first, then by rarity (legendary > epic > rare > common)
        const rarityOrder = { 'LEGENDARY': 0, 'EPIC': 1, 'RARE': 2, 'COMMON': 3 };
        const sortedBadges = [...badges].sort((a, b) => {
            // Primary first
            if (a.isPrimary && !b.isPrimary) return -1;
            if (!a.isPrimary && b.isPrimary) return 1;
            // Then by rarity
            const rarityA = rarityOrder[a.rarity] ?? 3;
            const rarityB = rarityOrder[b.rarity] ?? 3;
            return rarityA - rarityB;
        });

        listEl.innerHTML = sortedBadges.map(badge => {
            const isPrimary = primaryBadge && primaryBadge.id === badge.id;
            const iconUrl = badge.iconUrl && badge.iconUrl.startsWith('http')
                ? badge.iconUrl
                : (badge.iconUrl ? `${API_URL}${badge.iconUrl}` : 'icons/badge-default.png');

            const earnedDate = badge.earnedAt
                ? new Date(badge.earnedAt).toLocaleDateString('pt-BR')
                : '';

            const rarityLabel = {
                'LEGENDARY': 'Lendaria',
                'EPIC': 'Epica',
                'RARE': 'Rara',
                'COMMON': 'Comum'
            }[badge.rarity] || 'Comum';

            return `
                <div class="badge-item ${isPrimary ? 'is-primary' : ''}" onclick="toggleBadgePrimary('${badge.id}', ${isPrimary})">
                    <img src="${iconUrl}" alt="${badge.name}" class="badge-item-icon" onerror="this.src='icons/badge-default.png'">
                    <div class="badge-item-info">
                        <div class="badge-item-name">${badge.name}</div>
                        <div class="badge-item-meta">
                            <span class="badge-item-rarity ${badge.rarity || 'COMMON'}">${rarityLabel}</span>
                            ${earnedDate ? `<span class="badge-item-date">${earnedDate}</span>` : ''}
                        </div>
                    </div>
                    <div class="badge-item-action" title="${isPrimary ? 'Remover destaque' : 'Definir como principal'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // Show empty state
        if (emptyEl) emptyEl.style.display = 'flex';
        listEl.innerHTML = '';
    }
}

// Variable to store selected photo for edit
let editProfilePhotoFile = null;

// Preview photo when editing profile (with compression)
async function previewEditPhoto(input) {
    if (input.files && input.files[0]) {
        const originalFile = input.files[0];

        // Show loading state
        const editAvatarEl = document.getElementById('editAvatar');
        if (editAvatarEl) {
            editAvatarEl.innerHTML = '<div class="loading-spinner-small"></div>';
        }

        try {
            // Compress the image
            const compressedFile = await compressImage(originalFile, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
            editProfilePhotoFile = compressedFile;

            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                if (editAvatarEl) {
                    editAvatarEl.innerHTML = `<img src="${e.target.result}" alt="Avatar" class="avatar-img">`;
                }
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Erro ao comprimir imagem:', error);
            alert('Erro ao processar a imagem. Tente novamente.');
            // Reset avatar
            if (editAvatarEl) {
                const profile = cachedProfile || getCurrentUser();
                if (profile?.name) {
                    const initials = profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    editAvatarEl.textContent = initials;
                }
            }
        }
    }
}

// Preencher formulario de edicao
function loadEditProfile() {
    const profile = cachedProfile || getCurrentUser();
    if (!profile) return;

    // Reset photo file
    editProfilePhotoFile = null;
    const photoInput = document.getElementById('editProfilePhotoInput');
    if (photoInput) photoInput.value = '';

    // Avatar
    const editAvatarEl = document.getElementById('editAvatar');
    if (editAvatarEl) {
        const photoUrl = getPhotoUrl(profile.photoUrl);
        if (photoUrl) {
            editAvatarEl.innerHTML = `<img src="${photoUrl}" alt="Avatar" class="avatar-img">`;
        } else if (profile.name) {
            const initials = profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            editAvatarEl.textContent = initials;
        }
    }

    // Campos
    const nameInput = document.getElementById('editName');
    if (nameInput) nameInput.value = profile.name || '';

    const usernameInput = document.getElementById('editUsername');
    if (usernameInput) usernameInput.value = profile.username || '';

    const emailInput = document.getElementById('editEmail');
    if (emailInput) emailInput.value = profile.email || '';

    const phoneInput = document.getElementById('editPhone');
    if (phoneInput) phoneInput.value = profile.phone || '';
}

// Salvar perfil editado
async function saveProfile() {
    const name = document.getElementById('editName')?.value?.trim();
    const username = document.getElementById('editUsername')?.value?.trim();
    const phone = document.getElementById('editPhone')?.value?.trim();

    if (!name) {
        alert('O nome e obrigatorio');
        return;
    }

    const saveBtn = document.querySelector('#screen-edit-profile .text-btn');
    if (saveBtn) {
        saveBtn.textContent = 'Salvando...';
        saveBtn.disabled = true;
    }

    try {
        let response;

        // Use FormData if there's a photo to upload
        if (editProfilePhotoFile) {
            const formData = new FormData();
            formData.append('name', name);
            if (username) formData.append('username', username);
            if (phone) formData.append('phone', phone.replace(/\D/g, ''));
            formData.append('profilePhoto', editProfilePhotoFile);

            response = await fetch(`${API_URL}/api/mobile/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: formData
            });
        } else {
            // Use JSON if no photo
            response = await fetch(`${API_URL}/api/mobile/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({
                    name,
                    username,
                    phone: phone?.replace(/\D/g, '')
                })
            });
        }

        const data = await response.json();

        if (data.success) {
            // Atualizar cache e localStorage
            cachedProfile = data.data;
            localStorage.setItem('user', JSON.stringify(data.data));

            // Reset photo file
            editProfilePhotoFile = null;

            // Force refresh all avatars with cache busting
            renderProfile(data.data, true);

            showSuccessModal('Perfil Atualizado!', 'Suas informacoes foram salvas com sucesso.');

            setTimeout(() => {
                closeModal();
                navigateTo('screen-profile');
            }, 1500);
        } else {
            throw new Error(data.error?.message || 'Erro ao salvar perfil');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert(error.message || 'Erro ao salvar perfil. Tente novamente.');
    } finally {
        if (saveBtn) {
            saveBtn.textContent = 'Salvar';
            saveBtn.disabled = false;
        }
    }
}

// =============================================
// INITIALIZE
// =============================================
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se há usuário logado
    const token = getAuthToken();
    if (token) {
        // Redirecionar para projetos se estiver logado
        navigateTo('screen-projects');

        // Carregar projetos do backend
        loadProjects();
        updateProfileUI();

        // Verificar check-in ativo
        checkActiveCheckin();

        // Carregar perfil
        loadProfile();

        // Carregar horas
        loadHours();

        // Check for pending report reminders
        checkPendingReminders();

        // Initialize location and battery tracking system
        initLocationSystem();

        // Check URL parameters for campaign to show (from push notification)
        const urlParams = new URLSearchParams(window.location.search);
        const forceShowCampaignId = urlParams.get('forceShowCampaign');
        const showCampaignId = urlParams.get('showCampaign');

        if (forceShowCampaignId || showCampaignId) {
            console.log('[Campaign] URL param detected:', forceShowCampaignId || showCampaignId);

            // If forceShow, clear from seen cache first
            if (forceShowCampaignId) {
                const seenCampaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) || '[]');
                const index = seenCampaigns.indexOf(forceShowCampaignId);
                if (index > -1) {
                    seenCampaigns.splice(index, 1);
                    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(seenCampaigns));
                    console.log('[Campaign] Cleared from seen cache via URL param:', forceShowCampaignId);
                }
            }

            // Fetch campaigns and show
            await fetchCampaignsFromAPI();
            const campaignId = forceShowCampaignId || showCampaignId;
            const campaign = cachedCampaigns.find(c => c.id === campaignId);
            if (campaign) {
                setTimeout(() => {
                    showCampaign(campaign);
                }, 1000);
            }

            // Clean URL params
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } else {
        // Não está logado - preencher credenciais salvas na tela de login
        fillSavedCredentials();
    }

    // Quick tags
    const quickTags = document.querySelectorAll('.tag-item');
    quickTags.forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });

    // Like buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        if (btn.querySelector('path[d*="20.84"]')) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleLike(this);
            });
        }
    });

    // Animate progress bars on load
    setTimeout(() => {
        document.querySelectorAll('.progress-fill, .path-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 300);

    // Marcar offline ao fechar página
    window.addEventListener('beforeunload', () => {
        if (isCheckedIn) {
            markOffline();
        }
    });
});

// Recarregar dados ao navegar para certas telas
function navigateTo(screenId) {
    // Parar monitoramento de geolocalização se saindo da tela de detalhes do projeto
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen && currentScreen.id === 'screen-project-detail' && screenId !== 'screen-project-detail') {
        stopGeolocationWatch();
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    updateBottomNav(screenId);

    // Scroll to top when navigating
    window.scrollTo(0, 0);

    // Recarregar dados conforme a tela
    if (screenId === 'screen-hours') {
        loadHours();
    } else if (screenId === 'screen-profile') {
        loadProfile();
    } else if (screenId === 'screen-projects') {
        loadProjects();
        // Reset nearby projects section when navigating away
        resetNearbyProjectsSection();
    } else if (screenId === 'screen-edit-profile') {
        loadEditProfile();
    } else if (screenId === 'screen-feed') {
        renderFeed();
    } else if (screenId === 'screen-new-post') {
        resetNewPostForm();
        // Carregar projetos se ainda nao carregados
        if (cachedProjects.length === 0) {
            loadProjectsForPost();
        }
    } else if (screenId === 'screen-report') {
        initReportScreen();
    } else if (screenId === 'screen-badges') {
        loadBadgesScreen();
    } else if (screenId === 'screen-learn') {
        loadXPRanking();
    }
}

// =============================================
// REQUEST HELP/MATERIAL SYSTEM
// =============================================

// Audio Recording State
let materialAudioRecorder = null;
let helpAudioRecorder = null;
let materialAudioChunks = [];
let helpAudioChunks = [];
let materialRecordingTimer = null;
let helpRecordingTimer = null;
let materialRecordingSeconds = 0;
let helpRecordingSeconds = 0;
let materialAudioBlob = null;
let helpAudioBlob = null;
let helpVideoBlob = null;

// Open Request Modal
function openRequestModal() {
    const modal = document.getElementById('requestTypeModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close Request Type Modal
function closeRequestTypeModal() {
    const modal = document.getElementById('requestTypeModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Open Material Request Modal
function openMaterialRequest() {
    closeRequestTypeModal();
    const modal = document.getElementById('materialRequestModal');
    if (modal) {
        modal.classList.add('active');
        // Set project name
        const projectName = document.getElementById('materialProjectName');
        if (projectName && selectedProject) {
            projectName.textContent = selectedProject.cliente || selectedProject.title || 'Projeto atual';
        }
        resetMaterialForm();
    }
}

// Open Help Request Modal
function openHelpRequest() {
    closeRequestTypeModal();
    const modal = document.getElementById('helpRequestModal');
    if (modal) {
        modal.classList.add('active');
        // Set project name
        const projectName = document.getElementById('helpProjectName');
        if (projectName && selectedProject) {
            projectName.textContent = selectedProject.cliente || selectedProject.title || 'Projeto atual';
        }
        resetHelpForm();
    }
}

// Close Material Request Modal
function closeMaterialRequest() {
    const modal = document.getElementById('materialRequestModal');
    if (modal) {
        modal.classList.remove('active');
    }
    stopMaterialRecording();
    resetMaterialForm();
}

// Close Help Request Modal
function closeHelpRequest() {
    const modal = document.getElementById('helpRequestModal');
    if (modal) {
        modal.classList.remove('active');
    }
    stopHelpRecording();
    resetHelpForm();
}

// Reset Material Form
function resetMaterialForm() {
    const materialName = document.getElementById('materialName');
    const materialQuantity = document.getElementById('materialQuantity');
    const materialAudioPlayback = document.getElementById('materialAudioPlayback');
    const materialRecordTime = document.getElementById('materialRecordTime');
    const materialRecordStatus = document.getElementById('materialRecordStatus');
    const materialAudioRecorder = document.getElementById('materialAudioRecorder');
    const recordBtn = document.getElementById('materialRecordBtn');

    if (materialName) materialName.value = '';
    if (materialQuantity) materialQuantity.value = '';
    if (materialAudioPlayback) {
        materialAudioPlayback.style.display = 'none';
    }
    if (materialRecordTime) {
        materialRecordTime.textContent = '00:00';
    }
    if (materialRecordStatus) {
        materialRecordStatus.textContent = 'Toque para gravar';
    }
    if (materialAudioRecorder) {
        materialAudioRecorder.classList.remove('recording');
        materialAudioRecorder.style.display = 'flex';
    }
    if (recordBtn) {
        recordBtn.classList.remove('recording');
        const micIcon = recordBtn.querySelector('.mic-icon');
        const stopIcon = recordBtn.querySelector('.stop-icon');
        if (micIcon) micIcon.style.display = 'block';
        if (stopIcon) stopIcon.style.display = 'none';
    }

    materialAudioBlob = null;
    materialRecordingSeconds = 0;
}

// Reset Help Form
function resetHelpForm() {
    const helpDescription = document.getElementById('helpDescription');
    const helpAudioPlayback = document.getElementById('helpAudioPlayback');
    const helpRecordTime = document.getElementById('helpRecordTime');
    const helpRecordStatus = document.getElementById('helpRecordStatus');
    const helpAudioRecorderEl = document.getElementById('helpAudioRecorder');
    const helpVideoPreview = document.getElementById('helpVideoPreview');
    const recordBtn = document.getElementById('helpRecordBtn');

    if (helpDescription) helpDescription.value = '';
    if (helpAudioPlayback) {
        helpAudioPlayback.style.display = 'none';
    }
    if (helpRecordTime) {
        helpRecordTime.textContent = '00:00';
    }
    if (helpRecordStatus) {
        helpRecordStatus.textContent = 'Toque para gravar';
    }
    if (helpAudioRecorderEl) {
        helpAudioRecorderEl.classList.remove('recording');
        helpAudioRecorderEl.style.display = 'flex';
    }
    if (helpVideoPreview) {
        helpVideoPreview.style.display = 'none';
    }
    if (recordBtn) {
        recordBtn.classList.remove('recording');
        const micIcon = recordBtn.querySelector('.mic-icon');
        const stopIcon = recordBtn.querySelector('.stop-icon');
        if (micIcon) micIcon.style.display = 'block';
        if (stopIcon) stopIcon.style.display = 'none';
    }

    helpAudioBlob = null;
    helpVideoBlob = null;
    helpRecordingSeconds = 0;
}

// Toggle Material Recording
async function toggleMaterialRecording() {
    const recordBtn = document.getElementById('materialRecordBtn');
    const recorderEl = document.getElementById('materialAudioRecorder');
    const recordStatus = document.getElementById('materialRecordStatus');

    if (materialAudioRecorder && materialAudioRecorder.state === 'recording') {
        // Stop recording
        stopMaterialRecording();
    } else {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            materialAudioRecorder = new MediaRecorder(stream);
            materialAudioChunks = [];

            materialAudioRecorder.ondataavailable = (event) => {
                materialAudioChunks.push(event.data);
            };

            materialAudioRecorder.onstop = () => {
                materialAudioBlob = new Blob(materialAudioChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                showMaterialAudioPreview();
            };

            materialAudioRecorder.start();
            recordBtn.classList.add('recording');
            recorderEl.classList.add('recording');

            // Toggle icons
            const micIcon = recordBtn.querySelector('.mic-icon');
            const stopIcon = recordBtn.querySelector('.stop-icon');
            if (micIcon) micIcon.style.display = 'none';
            if (stopIcon) stopIcon.style.display = 'block';

            if (recordStatus) recordStatus.textContent = 'Gravando...';
            materialRecordingSeconds = 0;
            updateMaterialRecordingTimer();

            materialRecordingTimer = setInterval(() => {
                materialRecordingSeconds++;
                updateMaterialRecordingTimer();
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Não foi possível acessar o microfone. Verifique as permissões.');
        }
    }
}

// Stop Material Recording
function stopMaterialRecording() {
    if (materialAudioRecorder && materialAudioRecorder.state === 'recording') {
        materialAudioRecorder.stop();
    }

    const recordBtn = document.getElementById('materialRecordBtn');
    const recorderEl = document.getElementById('materialAudioRecorder');

    if (recordBtn) {
        recordBtn.classList.remove('recording');
        const micIcon = recordBtn.querySelector('.mic-icon');
        const stopIcon = recordBtn.querySelector('.stop-icon');
        if (micIcon) micIcon.style.display = 'block';
        if (stopIcon) stopIcon.style.display = 'none';
    }
    if (recorderEl) recorderEl.classList.remove('recording');

    if (materialRecordingTimer) {
        clearInterval(materialRecordingTimer);
        materialRecordingTimer = null;
    }
}

// Update Material Recording Timer
function updateMaterialRecordingTimer() {
    const recordTime = document.getElementById('materialRecordTime');
    if (recordTime) {
        const minutes = Math.floor(materialRecordingSeconds / 60).toString().padStart(2, '0');
        const seconds = (materialRecordingSeconds % 60).toString().padStart(2, '0');
        recordTime.textContent = `${minutes}:${seconds}`;
    }
}

// Show Material Audio Preview
function showMaterialAudioPreview() {
    const recorderEl = document.getElementById('materialAudioRecorder');
    const playbackEl = document.getElementById('materialAudioPlayback');
    const durationEl = document.getElementById('materialAudioDuration');
    const recordStatus = document.getElementById('materialRecordStatus');

    if (recorderEl) recorderEl.style.display = 'none';

    if (playbackEl && materialAudioBlob) {
        playbackEl.style.display = 'flex';
        if (durationEl) {
            const minutes = Math.floor(materialRecordingSeconds / 60).toString().padStart(2, '0');
            const seconds = (materialRecordingSeconds % 60).toString().padStart(2, '0');
            durationEl.textContent = `${minutes}:${seconds}`;
        }
    }

    if (recordStatus) recordStatus.textContent = 'Gravação concluída';
}

// Play Material Audio
function playMaterialAudio() {
    if (materialAudioBlob) {
        const audioUrl = URL.createObjectURL(materialAudioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    }
}

// Delete Material Audio
function deleteMaterialAudio() {
    materialAudioBlob = null;
    materialRecordingSeconds = 0;

    const recorderEl = document.getElementById('materialAudioRecorder');
    const playbackEl = document.getElementById('materialAudioPlayback');
    const recordTime = document.getElementById('materialRecordTime');
    const recordStatus = document.getElementById('materialRecordStatus');

    if (recorderEl) recorderEl.style.display = 'flex';
    if (playbackEl) playbackEl.style.display = 'none';
    if (recordTime) recordTime.textContent = '00:00';
    if (recordStatus) recordStatus.textContent = 'Toque para gravar';
}

// Toggle Help Recording
async function toggleHelpRecording() {
    const recordBtn = document.getElementById('helpRecordBtn');
    const recorderEl = document.getElementById('helpAudioRecorder');
    const recordStatus = document.getElementById('helpRecordStatus');

    if (helpAudioRecorder && helpAudioRecorder.state === 'recording') {
        // Stop recording
        stopHelpRecording();
    } else {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            helpAudioRecorder = new MediaRecorder(stream);
            helpAudioChunks = [];

            helpAudioRecorder.ondataavailable = (event) => {
                helpAudioChunks.push(event.data);
            };

            helpAudioRecorder.onstop = () => {
                helpAudioBlob = new Blob(helpAudioChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                showHelpAudioPreview();
            };

            helpAudioRecorder.start();
            recordBtn.classList.add('recording');
            recorderEl.classList.add('recording');

            // Toggle icons
            const micIcon = recordBtn.querySelector('.mic-icon');
            const stopIcon = recordBtn.querySelector('.stop-icon');
            if (micIcon) micIcon.style.display = 'none';
            if (stopIcon) stopIcon.style.display = 'block';

            if (recordStatus) recordStatus.textContent = 'Gravando...';
            helpRecordingSeconds = 0;
            updateHelpRecordingTimer();

            helpRecordingTimer = setInterval(() => {
                helpRecordingSeconds++;
                updateHelpRecordingTimer();
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Não foi possível acessar o microfone. Verifique as permissões.');
        }
    }
}

// Stop Help Recording
function stopHelpRecording() {
    if (helpAudioRecorder && helpAudioRecorder.state === 'recording') {
        helpAudioRecorder.stop();
    }

    const recordBtn = document.getElementById('helpRecordBtn');
    const recorderEl = document.getElementById('helpAudioRecorder');

    if (recordBtn) {
        recordBtn.classList.remove('recording');
        const micIcon = recordBtn.querySelector('.mic-icon');
        const stopIcon = recordBtn.querySelector('.stop-icon');
        if (micIcon) micIcon.style.display = 'block';
        if (stopIcon) stopIcon.style.display = 'none';
    }
    if (recorderEl) recorderEl.classList.remove('recording');

    if (helpRecordingTimer) {
        clearInterval(helpRecordingTimer);
        helpRecordingTimer = null;
    }
}

// Update Help Recording Timer
function updateHelpRecordingTimer() {
    const recordTime = document.getElementById('helpRecordTime');
    if (recordTime) {
        const minutes = Math.floor(helpRecordingSeconds / 60).toString().padStart(2, '0');
        const seconds = (helpRecordingSeconds % 60).toString().padStart(2, '0');
        recordTime.textContent = `${minutes}:${seconds}`;
    }
}

// Show Help Audio Preview
function showHelpAudioPreview() {
    const recorderEl = document.getElementById('helpAudioRecorder');
    const playbackEl = document.getElementById('helpAudioPlayback');
    const durationEl = document.getElementById('helpAudioDuration');
    const recordStatus = document.getElementById('helpRecordStatus');

    if (recorderEl) recorderEl.style.display = 'none';

    if (playbackEl && helpAudioBlob) {
        playbackEl.style.display = 'flex';
        if (durationEl) {
            const minutes = Math.floor(helpRecordingSeconds / 60).toString().padStart(2, '0');
            const seconds = (helpRecordingSeconds % 60).toString().padStart(2, '0');
            durationEl.textContent = `${minutes}:${seconds}`;
        }
    }

    if (recordStatus) recordStatus.textContent = 'Gravação concluída';
}

// Play Help Audio
function playHelpAudio() {
    if (helpAudioBlob) {
        const audioUrl = URL.createObjectURL(helpAudioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    }
}

// Delete Help Audio
function deleteHelpAudio() {
    helpAudioBlob = null;
    helpRecordingSeconds = 0;

    const recorderEl = document.getElementById('helpAudioRecorder');
    const playbackEl = document.getElementById('helpAudioPlayback');
    const recordTime = document.getElementById('helpRecordTime');
    const recordStatus = document.getElementById('helpRecordStatus');

    if (recorderEl) recorderEl.style.display = 'flex';
    if (playbackEl) playbackEl.style.display = 'none';
    if (recordTime) recordTime.textContent = '00:00';
    if (recordStatus) recordStatus.textContent = 'Toque para gravar';
}

// Transcribe Audio using Whisper API
async function transcribeAudio(audioBlob, type) {
    const transcriptionDiv = document.getElementById(type === 'material' ? 'materialTranscription' : 'helpTranscription');
    const transcriptionText = transcriptionDiv?.querySelector('p');

    if (!transcriptionDiv || !transcriptionText) return;

    transcriptionDiv.classList.add('active');
    transcriptionText.textContent = 'Transcrevendo...';

    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/mobile/transcribe`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.transcription) {
                transcriptionText.textContent = data.data.transcription;
            } else {
                transcriptionText.textContent = 'Nao foi possivel transcrever o audio.';
            }
        } else {
            transcriptionText.textContent = 'Erro ao transcrever. Tente novamente.';
        }
    } catch (error) {
        console.error('Transcription error:', error);
        transcriptionText.textContent = 'Erro de conexao. O audio sera enviado sem transcricao.';
    }
}

// Capture Video from Camera
async function captureVideoFromCamera() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.capture = 'environment';

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                helpVideoBlob = file;
                showHelpVideoPreview();
            }
        };

        input.click();
    } catch (error) {
        console.error('Error capturing video:', error);
        alert('Nao foi possivel acessar a camera.');
    }
}

// Select Video from Library
function selectVideoFromLibrary() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            helpVideoBlob = file;
            showHelpVideoPreview();
        }
    };

    input.click();
}

// Show Help Video Preview
function showHelpVideoPreview() {
    const previewDiv = document.getElementById('helpVideoPreview');

    if (previewDiv && helpVideoBlob) {
        const videoUrl = URL.createObjectURL(helpVideoBlob);
        previewDiv.innerHTML = `
            <video controls src="${videoUrl}"></video>
            <div class="video-preview-actions">
                <button class="btn-remove-video" onclick="removeHelpVideo()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    Remover video
                </button>
            </div>
        `;
        previewDiv.classList.add('active');
    }

    updateHelpSubmitButton();
}

// Handle Help Video Select
function handleHelpVideoSelect(event) {
    const file = event.target.files[0];
    if (file) {
        helpVideoBlob = file;
        const videoUrl = URL.createObjectURL(file);
        const previewDiv = document.getElementById('helpVideoPreview');
        const videoPlayer = document.getElementById('helpVideoPlayer');
        const mediaGrid = document.getElementById('helpMediaGrid');

        if (videoPlayer) {
            videoPlayer.src = videoUrl;
        }
        if (previewDiv) {
            previewDiv.style.display = 'block';
        }
        if (mediaGrid) {
            mediaGrid.style.display = 'none';
        }
    }
}

// Remove Help Video
function removeHelpVideo() {
    helpVideoBlob = null;
    const previewDiv = document.getElementById('helpVideoPreview');
    const mediaGrid = document.getElementById('helpMediaGrid');
    const videoPlayer = document.getElementById('helpVideoPlayer');

    if (previewDiv) {
        previewDiv.style.display = 'none';
    }
    if (videoPlayer) {
        videoPlayer.src = '';
    }
    if (mediaGrid) {
        mediaGrid.style.display = 'flex';
    }
}

// Update Material Submit Button (not used - button always enabled)
function updateMaterialSubmitButton() {
    // No validation needed
}

// Update Help Submit Button (not used - button always enabled)
function updateHelpSubmitButton() {
    // No validation needed
}

// Submit Material Request
async function submitMaterialRequest() {
    const materialName = document.getElementById('materialName')?.value;
    const materialQuantity = document.getElementById('materialQuantity')?.value.trim();

    if (!materialName) {
        alert('Por favor, selecione qual material você precisa.');
        return;
    }

    const submitBtn = document.getElementById('submitMaterialBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enviando...</span>';
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Você precisa fazer login primeiro.');
            navigateTo('login');
            return;
        }

        const formData = new FormData();
        formData.append('type', 'MATERIAL');
        formData.append('materialName', materialName);
        if (materialQuantity) formData.append('quantity', materialQuantity);
        if (materialAudioBlob) {
            formData.append('audio', materialAudioBlob, 'audio.webm');
        }
        if (selectedProject?.id) {
            formData.append('projectId', selectedProject.id);
        }

        const response = await fetch(`${API_URL}/api/mobile/help-requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            closeMaterialRequest();
            showRequestSuccessModal('Material solicitado com sucesso!', 'Sua solicitacao foi enviada e sera analisada em breve.');
        } else {
            const data = await response.json();
            alert(data.error?.message || 'Erro ao enviar solicitacao.');
        }
    } catch (error) {
        console.error('Error submitting material request:', error);
        alert('Erro de conexao. Tente novamente.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                <span>Enviar Solicitação</span>
            `;
        }
    }
}

// Submit Help Request
async function submitHelpRequest() {
    const helpDescription = document.getElementById('helpDescription')?.value.trim();

    if (!helpDescription) {
        alert('Por favor, descreva o que está acontecendo.');
        return;
    }

    const submitBtn = document.getElementById('submitHelpBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enviando...</span>';
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Você precisa fazer login primeiro.');
            navigateTo('login');
            return;
        }

        const formData = new FormData();
        formData.append('type', 'HELP');
        formData.append('description', helpDescription);
        if (helpAudioBlob) {
            formData.append('audio', helpAudioBlob, 'audio.webm');
        }
        if (helpVideoBlob) {
            formData.append('video', helpVideoBlob, 'video.mp4');
        }
        if (selectedProject?.id) {
            formData.append('projectId', selectedProject.id);
        }

        const response = await fetch(`${API_URL}/api/mobile/help-requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            closeHelpRequest();
            showRequestSuccessModal('Ajuda solicitada com sucesso!', 'Sua solicitacao foi enviada e um responsavel entrara em contato.');
        } else {
            const data = await response.json();
            alert(data.error?.message || 'Erro ao enviar solicitacao.');
        }
    } catch (error) {
        console.error('Error submitting help request:', error);
        alert('Erro de conexao. Tente novamente.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                <span>Enviar Solicitação</span>
            `;
        }
    }
}

// Show Request Success Modal
function showRequestSuccessModal(title, message) {
    const modal = document.getElementById('requestSuccessModal');
    const titleEl = modal?.querySelector('h3');
    const messageEl = modal?.querySelector('p');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    if (modal) {
        modal.classList.add('active');
    }
}

// Close Request Success Modal
function closeRequestSuccessModal() {
    const modal = document.getElementById('requestSuccessModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Add event listeners for form inputs
document.addEventListener('DOMContentLoaded', function() {
    const materialNameInput = document.getElementById('materialName');
    const helpDescriptionInput = document.getElementById('helpDescription');
    const justificationTextarea = document.getElementById('auto-checkout-justification-text');

    if (materialNameInput) {
        materialNameInput.addEventListener('input', updateMaterialSubmitButton);
    }

    if (helpDescriptionInput) {
        helpDescriptionInput.addEventListener('input', updateHelpSubmitButton);
    }

    // Auto-checkout justification character counter
    if (justificationTextarea) {
        justificationTextarea.addEventListener('input', updateJustifyCharCount);
    }
});

// =============================================
// XP RANKING
// =============================================

async function loadXPRanking() {
    const container = document.getElementById('xp-ranking-list');
    if (!container) return;

    // Mostrar loading
    container.innerHTML = '<div class="loading-state"><span>Carregando ranking...</span></div>';

    try {
        const token = getAuthToken();

        if (!token) {
            container.innerHTML = '<div class="loading-state"><span>Faça login para ver o ranking</span></div>';
            return;
        }

        const response = await fetch(`${API_URL}/api/mobile/ranking/top10`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
            const users = result.data;

            if (users.length === 0) {
                container.innerHTML = '<div class="loading-state"><span>Nenhum usuário no ranking ainda</span></div>';
                return;
            }

            // Find max XP for percentage calculation
            const maxXP = users.length > 0 ? users[0].xpTotal : 0;

            // Render ranking items
            container.innerHTML = users.map((user, index) => {
                const position = index + 1;
                const xpPercentage = maxXP > 0 ? ((user.xpTotal || 0) / maxXP) * 100 : 0;

                return `
                    <div class="xp-ranking-item">
                        <div class="xp-rank">#${position}</div>
                        <div class="xp-user-info">
                            <div class="xp-user-name">${user.name || 'Anônimo'}</div>
                            <div class="xp-bar-container">
                                <div class="xp-bar" style="width: ${xpPercentage}%"></div>
                            </div>
                        </div>
                        <div class="xp-value">${(user.xpTotal || 0).toLocaleString()} XP</div>
                    </div>
                `;
            }).join('');

        } else {
            throw new Error(result.error?.message || 'Erro ao carregar ranking');
        }
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        container.innerHTML = `
            <div class="error-state">
                <span>Erro ao carregar ranking</span>
                <button onclick="loadXPRanking()">Tentar novamente</button>
            </div>
        `;
    }
}

// =============================================
// GLOBAL TEST FUNCTIONS (for browser console)
// =============================================

// Expose animation functions globally for testing
window.testXPGain = function(amount = 150, reason = 'Check-in realizado!') {
    showXPGain(amount, reason);
};

window.testCampaignWinner = function(position = 1) {
    showCampaignWinner({
        campaignName: 'Maratona de Produtividade',
        position: position,
        xpReward: 500,
        prize: 'Day-off + R$200 bônus'
    });
};

window.testGameAlert = function() {
    showGameAlert({
        type: 'removed',
        icon: '💀',
        title: 'REMOVIDO!',
        message: 'Você foi removido(a) da campanha "Teste"',
        buttonText: 'DROGA!'
    });
};

// Log available test functions
console.log('🎮 Animation test functions available:');
console.log('  - testXPGain(amount, reason) - Test XP gain animation');
console.log('  - testCampaignWinner(position) - Test winner animation (1, 2, or 3)');
console.log('  - testGameAlert() - Test game alert');

// =============================================
// TASK COMPLETION FLOW (Checkout with Tasks)
// =============================================

/**
 * Load tasks for the current project and display task block section
 * Called when project detail is loaded and user has active checkin
 */
async function loadProjectTasks(projectId) {
    const token = getAuthToken();
    if (!token || !projectId) return;

    try {
        const response = await fetch(`${API_URL}/api/mobile/projects/${projectId}/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.log('Tasks not available for this project');
            return;
        }

        const data = await response.json();

        if (data.success && data.data) {
            currentProjectTasks = data.data;
            renderTaskBlockSection(data.data);
        }
    } catch (error) {
        console.error('Error loading project tasks:', error);
    }
}

/**
 * Render the task block section in project detail - organized by phase
 */
function renderTaskBlockSection(tasksData) {
    const section = document.getElementById('taskBlockSection');
    const itemsContainer = document.getElementById('taskBlockItems');
    const countElement = document.getElementById('taskBlockCount');

    if (!section || !tasksData) return;

    const { currentPhase, phaseUnlocked, tasksByPhase, phaseProgress, phaseDeadlines, projectProgress } = tasksData;

    // Check if we have tasks in any phase
    const hasTasks = tasksByPhase && (
        tasksByPhase.PREPARO?.length > 0 ||
        tasksByPhase.APLICACAO?.length > 0 ||
        tasksByPhase.ACABAMENTO?.length > 0
    );

    if (!hasTasks) {
        section.style.display = 'none';
        return;
    }

    // Show section only when checked in
    if (isCheckedIn && activeCheckinId) {
        section.style.display = 'block';
    }

    // Update count
    if (countElement && projectProgress) {
        countElement.textContent = `${projectProgress.completed}/${projectProgress.total}`;
    }

    // Phase names in Portuguese
    const phaseNames = {
        PREPARO: 'Preparo',
        APLICACAO: 'Aplicacao',
        ACABAMENTO: 'Acabamento'
    };

    // Phase icons
    const phaseIcons = {
        PREPARO: '🔧',
        APLICACAO: '🎨',
        ACABAMENTO: '✨'
    };

    // Render phase tabs and tasks
    let html = `
        <div class="phase-tabs">
            ${['PREPARO', 'APLICACAO', 'ACABAMENTO'].map(phase => {
                const isActive = currentPhase === phase;
                const isLocked = !phaseUnlocked[phase];
                const progress = phaseProgress?.[phase] || { completed: 0, total: 0, percentage: 0 };
                return `
                    <div class="phase-tab ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                         onclick="${isLocked ? '' : `switchPhaseView('${phase}')`}">
                        <span class="phase-icon">${isLocked ? '🔒' : phaseIcons[phase]}</span>
                        <span class="phase-name">${phaseNames[phase]}</span>
                        <span class="phase-progress">${progress.completed}/${progress.total}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Current phase indicator
    html += `
        <div class="current-phase-indicator">
            <span class="phase-badge ${currentPhase.toLowerCase()}">${phaseNames[currentPhase]}</span>
            <span class="phase-status">${phaseProgress[currentPhase]?.percentage || 0}% concluido</span>
        </div>
    `;

    // Phase deadline countdown
    const currentDeadline = phaseDeadlines?.[currentPhase];
    if (currentDeadline && currentDeadline.daysRemaining !== null) {
        const days = currentDeadline.daysRemaining;
        const isUrgent = days <= 2;
        const isWarning = days <= 5 && days > 2;
        const isPast = days < 0;

        let deadlineMessage = '';
        let deadlineClass = '';

        if (isPast) {
            deadlineMessage = `Atrasado ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}!`;
            deadlineClass = 'deadline-past';
        } else if (days === 0) {
            deadlineMessage = 'Ultimo dia para terminar!';
            deadlineClass = 'deadline-urgent';
        } else if (days === 1) {
            deadlineMessage = 'Voce tem 1 dia para terminar esta etapa';
            deadlineClass = 'deadline-urgent';
        } else {
            deadlineMessage = `Voce tem ${days} dias para terminar a etapa de ${phaseNames[currentPhase]}`;
            deadlineClass = isUrgent ? 'deadline-urgent' : isWarning ? 'deadline-warning' : 'deadline-normal';
        }

        html += `
            <div class="phase-deadline-countdown ${deadlineClass}">
                <span class="deadline-icon">${isPast ? '⚠️' : isUrgent ? '⏰' : '📅'}</span>
                <span class="deadline-message">${deadlineMessage}</span>
            </div>
        `;
    }

    // Render tasks for current phase
    const currentPhaseTasks = tasksByPhase?.[currentPhase] || [];

    if (currentPhaseTasks.length === 0) {
        html += `
            <div class="empty-phase-message">
                <p>Nenhuma tarefa nesta fase.</p>
            </div>
        `;
    } else {
        // Filter out completed tasks - only show pending/in_progress
        const pendingTasks = currentPhaseTasks.filter(t => t.status !== 'COMPLETED');

        if (pendingTasks.length === 0) {
            html += `
                <div class="empty-phase-message completed-all">
                    <span class="completed-icon">✓</span>
                    <p>Todas as tarefas desta fase foram concluidas!</p>
                </div>
            `;
        } else {
            html += `<div class="phase-tasks-list">`;
            pendingTasks.forEach((task) => {
                const isPartial = task.status === 'IN_PROGRESS' || task.completionType === 'PARTIAL';
                const taskProgress = task.progress || 0;

                html += `
                    <div class="task-block-item-simple ${isPartial ? 'partial' : ''}"
                         data-task-id="${task.id}"
                         data-progress="${taskProgress}">
                        <div class="task-color-bar" style="background-color: ${task.color || '#c9a962'}"></div>
                        <div class="task-info">
                            <div class="task-name">${escapeHtml(task.title)}</div>
                            ${task.surface && task.surface !== 'GERAL' ? `
                                <span class="task-surface-tag ${task.surface.toLowerCase()}">${task.surface}</span>
                            ` : ''}
                        </div>
                        ${isPartial ? `
                            <div class="task-partial-badge">${taskProgress}%</div>
                        ` : ''}
                    </div>
                `;
            });
            html += `</div>`;
        }
    }

    // Show next phase preview if current phase is complete
    if (phaseProgress[currentPhase]?.percentage === 100) {
        const nextPhase = currentPhase === 'PREPARO' ? 'APLICACAO' : (currentPhase === 'APLICACAO' ? 'ACABAMENTO' : null);
        if (nextPhase && tasksByPhase[nextPhase]?.length > 0) {
            html += `
                <div class="next-phase-preview">
                    <div class="next-phase-header">
                        <span class="next-phase-icon">${phaseIcons[nextPhase]}</span>
                        <span>Proxima fase: ${phaseNames[nextPhase]}</span>
                    </div>
                    <p class="next-phase-hint">Clique na aba acima para ver as tarefas</p>
                </div>
            `;
        }
    }

    itemsContainer.innerHTML = html;
}

/**
 * Switch to viewing a different phase
 */
function switchPhaseView(phase) {
    if (!currentProjectTasks || !currentProjectTasks.phaseUnlocked[phase]) {
        showToast('Fase bloqueada. Complete a fase anterior primeiro.');
        return;
    }

    // Update the currentPhase in our local data to show the selected phase
    const tempData = { ...currentProjectTasks, currentPhase: phase };
    renderTaskBlockSection(tempData);
}

/**
 * Show task completion options modal (Integral or Partial)
 */
function showTaskCompletionOptions(taskId, taskTitle, currentProgress) {
    // Check if already at 100%
    if (currentProgress === 100) {
        // Toggle off - remove completion
        completeTaskWithType(taskId, null, 0);
        return;
    }

    // Show completion options modal
    const modal = document.createElement('div');
    modal.className = 'task-completion-modal-overlay';
    modal.innerHTML = `
        <div class="task-completion-options-modal">
            <h3>Conclusao da Tarefa</h3>
            <p class="task-title-preview">${taskTitle}</p>

            <div class="completion-options">
                <button class="completion-option integral" onclick="completeTaskWithType('${taskId}', 'INTEGRAL', 100); closeTaskCompletionModal();">
                    <span class="option-icon">✓</span>
                    <span class="option-text">
                        <strong>Conclusao Integral</strong>
                        <small>Tarefa 100% concluida</small>
                    </span>
                    <span class="xp-badge">+50 XP</span>
                </button>

                <button class="completion-option partial" onclick="showPartialCompletionSlider('${taskId}'); ">
                    <span class="option-icon">◐</span>
                    <span class="option-text">
                        <strong>Conclusao Parcial</strong>
                        <small>Tarefa parcialmente concluida</small>
                    </span>
                    <span class="xp-badge">XP proporcional</span>
                </button>
            </div>

            <div class="partial-slider-container" id="partialSliderContainer" style="display: none;">
                <label>Porcentagem concluida:</label>
                <input type="range" id="partialProgressSlider" min="10" max="90" step="10" value="${currentProgress || 50}"
                       oninput="updatePartialProgressLabel(this.value)">
                <div class="slider-labels">
                    <span>10%</span>
                    <span id="currentProgressLabel">${currentProgress || 50}%</span>
                    <span>90%</span>
                </div>
                <button class="confirm-partial-btn" onclick="confirmPartialCompletion('${taskId}');">
                    Confirmar Parcial
                </button>
            </div>

            ${currentProgress > 0 ? `
                <button class="reset-task-btn" onclick="completeTaskWithType('${taskId}', null, 0); closeTaskCompletionModal();">
                    Resetar Tarefa
                </button>
            ` : ''}

            <button class="cancel-btn" onclick="closeTaskCompletionModal();">Cancelar</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTaskCompletionModal();
        }
    });
}

/**
 * Show partial completion slider
 */
function showPartialCompletionSlider(taskId) {
    const container = document.getElementById('partialSliderContainer');
    if (container) {
        container.style.display = 'block';
    }
}

/**
 * Update partial progress label
 */
function updatePartialProgressLabel(value) {
    const label = document.getElementById('currentProgressLabel');
    if (label) {
        label.textContent = value + '%';
    }
}

/**
 * Confirm partial completion
 */
function confirmPartialCompletion(taskId) {
    const slider = document.getElementById('partialProgressSlider');
    const progress = slider ? parseInt(slider.value) : 50;
    completeTaskWithType(taskId, 'PARTIAL', progress);
    closeTaskCompletionModal();
}

/**
 * Close task completion modal
 */
function closeTaskCompletionModal() {
    const modal = document.querySelector('.task-completion-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

/**
 * Complete task with specific completion type (INTEGRAL, PARTIAL, or null to reset)
 */
async function completeTaskWithType(taskId, completionType, progress) {
    const token = getAuthToken();
    if (!token) {
        showToast('Voce precisa estar logado');
        return;
    }

    try {
        const body = completionType ? { completionType, progress } : {};

        const response = await fetch(`${API_URL}/api/mobile/tasks/${taskId}/toggle-complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.success) {
            // Update progress counter
            const countElement = document.getElementById('taskBlockCount');
            if (countElement && data.data.progress) {
                countElement.textContent = `${data.data.progress.completed}/${data.data.progress.total}`;
            }

            // Show XP notification if earned
            if (data.data.xpEarned > 0) {
                const message = completionType === 'PARTIAL'
                    ? `Tarefa ${data.data.taskProgress}% concluida!`
                    : 'Tarefa concluida!';
                showXPNotification(data.data.xpEarned, message);
            }

            // Update local state
            updateLocalTaskState(taskId, data.data);

            // Re-render tasks with updated phase data
            if (currentProjectTasks) {
                currentProjectTasks.currentPhase = data.data.currentPhase;
                currentProjectTasks.phaseUnlocked = data.data.phaseUnlocked;
                currentProjectTasks.phaseProgress = data.data.phaseProgress;
                renderTaskBlockSection(currentProjectTasks);
            }

            // Check if phase changed - show celebration
            if (data.data.phaseUnlocked && !currentProjectTasks?.phaseUnlocked?.APLICACAO && data.data.phaseUnlocked.APLICACAO) {
                showToast('Preparo concluido! Fase de Aplicacao liberada!');
            }
            if (data.data.phaseUnlocked && !currentProjectTasks?.phaseUnlocked?.ACABAMENTO && data.data.phaseUnlocked.ACABAMENTO) {
                showToast('Aplicacao concluida! Fase de Acabamento liberada!');
            }

        } else {
            console.error('Error completing task:', data.error);
            showToast(data.error?.message || 'Erro ao marcar tarefa');
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('Erro de conexao');
    }
}

/**
 * Update local task state after completion
 */
function updateLocalTaskState(taskId, responseData) {
    if (!currentProjectTasks) return;

    const { isCompleted, taskProgress, completionType } = responseData;
    const newStatus = isCompleted ? 'COMPLETED' : (taskProgress > 0 ? 'IN_PROGRESS' : 'PENDING');

    // Update in tasksByPhase
    if (currentProjectTasks.tasksByPhase) {
        ['PREPARO', 'APLICACAO', 'ACABAMENTO'].forEach(phase => {
            const tasks = currentProjectTasks.tasksByPhase[phase];
            if (tasks) {
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex >= 0) {
                    tasks[taskIndex].status = newStatus;
                    tasks[taskIndex].progress = taskProgress;
                    tasks[taskIndex].completionType = completionType;
                }
            }
        });
    }

    // Update in allTasks
    if (currentProjectTasks.allTasks) {
        const taskIndex = currentProjectTasks.allTasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
            currentProjectTasks.allTasks[taskIndex].status = newStatus;
            currentProjectTasks.allTasks[taskIndex].progress = taskProgress;
            currentProjectTasks.allTasks[taskIndex].completionType = completionType;
        }
    }

    // Update in currentTaskBlock (legacy)
    if (currentProjectTasks.currentTaskBlock) {
        const taskIndex = currentProjectTasks.currentTaskBlock.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
            currentProjectTasks.currentTaskBlock[taskIndex].status = newStatus;
            currentProjectTasks.currentTaskBlock[taskIndex].progress = taskProgress;
            currentProjectTasks.currentTaskBlock[taskIndex].completionType = completionType;
        }
    }
}

/**
 * Toggle task completion on project detail screen (legacy - now calls completeTaskWithType)
 */
async function toggleProjectTask(element, taskId) {
    // Get current progress
    const currentProgress = parseInt(element.dataset.progress) || 0;

    if (currentProgress === 100) {
        // Already complete - toggle off
        completeTaskWithType(taskId, null, 0);
    } else {
        // Show options modal
        const taskTitle = element.querySelector('.task-name')?.textContent || 'Tarefa';
        showTaskCompletionOptions(taskId, taskTitle, currentProgress);
    }
}

/**
 * Show task completion modal (called during checkout flow)
 */
async function showTaskCompletionModal() {
    const modal = document.getElementById('taskCompletionModal');
    const listContainer = document.getElementById('todayTasksList');

    if (!modal || !listContainer) {
        // If modal not available, proceed with checkout directly
        await doCheckoutWithTasksAndReminder();
        return;
    }

    // Reset selected tasks and completions
    selectedTaskIds = [];
    taskCompletions = {};

    // Load tasks if not already loaded
    if (!currentProjectTasks && selectedProject) {
        await loadProjectTasks(selectedProject.id);
    }

    // Build the deadline message
    let deadlineHtml = '';
    if (currentProjectTasks?.phaseDeadlines) {
        const currentPhase = currentProjectTasks.currentPhase || 'PREPARO';
        const deadline = currentProjectTasks.phaseDeadlines[currentPhase];
        if (deadline && deadline.daysRemaining !== null) {
            const days = deadline.daysRemaining;
            const isUrgent = days <= 2;
            const isPast = days < 0;

            let message = '';
            let cssClass = 'checkout-deadline';
            if (isPast) {
                message = `Atrasado ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}!`;
                cssClass += ' past';
            } else if (days === 0) {
                message = 'Ultimo dia para terminar estas tarefas!';
                cssClass += ' urgent';
            } else if (days === 1) {
                message = 'Voce tem 1 dia para terminar estas tarefas';
                cssClass += ' urgent';
            } else {
                message = `Voce tem ${days} dias para terminar estas tarefas`;
                cssClass += isUrgent ? ' urgent' : '';
            }

            deadlineHtml = `
                <div class="${cssClass}">
                    <span class="deadline-icon">${isPast ? '⚠️' : isUrgent ? '⏰' : '📅'}</span>
                    <span>${message}</span>
                </div>
            `;
        }
    }

    // Reset day blocks counter
    loadedDayBlocks = 1;

    // Get all pending tasks and organize: first 4 PAREDE + first 4 PISO, then the rest
    if (currentProjectTasks && currentProjectTasks.currentTaskBlock) {
        const pendingTasks = currentProjectTasks.currentTaskBlock.filter(t => t.status !== 'COMPLETED');

        // Separate tasks by surface and sort by sortOrder
        const paredeTasks = pendingTasks.filter(t => t.surface === 'PAREDE').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const pisoTasks = pendingTasks.filter(t => t.surface === 'PISO').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const geralTasks = pendingTasks.filter(t => t.surface === 'GERAL' || !t.surface).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        // First 4 PAREDE + first 4 PISO, then remaining PAREDE, remaining PISO, then GERAL
        const first4Parede = paredeTasks.slice(0, 4);
        const first4Piso = pisoTasks.slice(0, 4);
        const remainingParede = paredeTasks.slice(4);
        const remainingPiso = pisoTasks.slice(4);

        allCheckoutTasks = [...first4Parede, ...first4Piso, ...remainingParede, ...remainingPiso, ...geralTasks];

        if (allCheckoutTasks.length === 0) {
            listContainer.innerHTML = `
                ${deadlineHtml}
                <div class="empty-tasks-message">
                    <p>Todas as tarefas do bloco ja foram concluidas!</p>
                </div>
            `;
        } else {
            // Pre-populate completions with PARTIAL as default for all tasks
            allCheckoutTasks.forEach(task => {
                taskCompletions[task.id] = {
                    type: 'PARTIAL',
                    progress: 50 // Fixed 50% for PARTIAL
                };
                if (!selectedTaskIds.includes(task.id)) {
                    selectedTaskIds.push(task.id);
                }
            });

            // Render initial tasks (4 PAREDE + 4 PISO)
            renderCheckoutTasks(listContainer, deadlineHtml);
        }
    } else {
        listContainer.innerHTML = `
            ${deadlineHtml}
            <div class="empty-tasks-message">
                <p>Nenhuma tarefa atribuida para hoje.</p>
            </div>
        `;
    }

    modal.classList.add('active');
}

/**
 * Render checkout tasks with "load more" functionality
 */
function renderCheckoutTasks(container, deadlineHtml) {
    const TASKS_PER_BLOCK = 8; // Show 4 PAREDE + 4 PISO initially
    const tasksToShow = allCheckoutTasks.slice(0, loadedDayBlocks * TASKS_PER_BLOCK);
    const hasMore = allCheckoutTasks.length > tasksToShow.length;
    const remaining = allCheckoutTasks.length - tasksToShow.length;

    let html = deadlineHtml;
    html += '<div class="checkout-tasks-list">';

    tasksToShow.forEach(task => {
        html += createTaskCheckboxItem(task, false);
    });

    html += '</div>';

    // Add "load more" button if there are more tasks
    if (hasMore) {
        html += `
            <button class="checkout-load-more" onclick="loadMoreCheckoutTasks()">
                <span class="plus-icon">+</span>
                <span>Carregar mais ${remaining} tarefa${remaining > 1 ? 's' : ''}</span>
            </button>
        `;
    }

    container.innerHTML = html;
}

/**
 * Load more tasks in checkout modal
 */
function loadMoreCheckoutTasks() {
    loadedDayBlocks++;
    const listContainer = document.getElementById('todayTasksList');
    if (listContainer) {
        // Rebuild deadline HTML
        let deadlineHtml = '';
        if (currentProjectTasks?.phaseDeadlines) {
            const currentPhase = currentProjectTasks.currentPhase || 'PREPARO';
            const deadline = currentProjectTasks.phaseDeadlines[currentPhase];
            if (deadline && deadline.daysRemaining !== null) {
                const days = deadline.daysRemaining;
                const isUrgent = days <= 2;
                const isPast = days < 0;
                let message = '';
                let cssClass = 'checkout-deadline';
                if (isPast) {
                    message = `Atrasado ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}!`;
                    cssClass += ' past';
                } else if (days === 0) {
                    message = 'Ultimo dia para terminar estas tarefas!';
                    cssClass += ' urgent';
                } else if (days === 1) {
                    message = 'Voce tem 1 dia para terminar estas tarefas';
                    cssClass += ' urgent';
                } else {
                    message = `Voce tem ${days} dias para terminar estas tarefas`;
                    cssClass += isUrgent ? ' urgent' : '';
                }
                deadlineHtml = `
                    <div class="${cssClass}">
                        <span class="deadline-icon">${isPast ? '⚠️' : isUrgent ? '⏰' : '📅'}</span>
                        <span>${message}</span>
                    </div>
                `;
            }
        }
        renderCheckoutTasks(listContainer, deadlineHtml);
    }
}

/**
 * Create a task item HTML for checkout with dropdown
 */
function createTaskCheckboxItem(task, isChecked = false) {
    const currentProgress = task.progress || 0;
    const completion = taskCompletions[task.id];
    // Default to PARTIAL if not set
    const selectedType = completion?.type || 'PARTIAL';

    // Surface badge
    const surfaceBadge = task.surface && task.surface !== 'GERAL'
        ? `<span class="checkout-surface-badge ${task.surface.toLowerCase()}">${task.surface === 'PAREDE' ? 'Parede' : 'Piso'}</span>`
        : '';

    return `
        <div class="checkout-task-item"
             data-task-id="${task.id}"
             data-current-progress="${currentProgress}">
            <div class="checkout-task-color" style="background-color: ${task.color || '#c9a962'}"></div>
            <div class="checkout-task-info">
                <div class="checkout-task-header">
                    <span class="checkout-task-name">${escapeHtml(task.title)}</span>
                    ${surfaceBadge}
                </div>
                ${currentProgress > 0 ? `<div class="checkout-task-current">Progresso atual: ${currentProgress}%</div>` : ''}
            </div>
            <div class="checkout-task-dropdown">
                <select onchange="onCheckoutDropdownChange('${task.id}', this.value)">
                    <option value="PARTIAL" ${selectedType === 'PARTIAL' ? 'selected' : ''}>Parcial</option>
                    <option value="INTEGRAL" ${selectedType === 'INTEGRAL' ? 'selected' : ''}>Concluida</option>
                </select>
            </div>
        </div>
    `;
}

/**
 * Handle dropdown change for task completion
 */
function onCheckoutDropdownChange(taskId, value) {
    if (value === 'INTEGRAL') {
        taskCompletions[taskId] = { type: 'INTEGRAL', progress: 100 };
    } else {
        // PARTIAL - fixed at 50%
        taskCompletions[taskId] = { type: 'PARTIAL', progress: 50 };
    }
    // Always add to selectedTaskIds (no skip option)
    if (!selectedTaskIds.includes(taskId)) {
        selectedTaskIds.push(taskId);
    }
}

/**
 * Set task completion type for checkout (legacy - keep for compatibility)
 */
function setCheckoutTaskCompletion(taskId, type, event) {
    if (event) event.stopPropagation();

    const taskItem = document.querySelector(`.checkout-task-item[data-task-id="${taskId}"]`);
    const currentProgress = parseInt(taskItem?.dataset.currentProgress || 0);

    if (taskCompletions[taskId]?.type === type) {
        // Toggle off
        delete taskCompletions[taskId];
        selectedTaskIds = selectedTaskIds.filter(id => id !== taskId);
    } else {
        // Set completion type
        taskCompletions[taskId] = {
            type: type,
            progress: type === 'INTEGRAL' ? 100 : Math.max(currentProgress + 10, 50)
        };
        if (!selectedTaskIds.includes(taskId)) {
            selectedTaskIds.push(taskId);
        }
    }

    // Re-render the task item
    refreshCheckoutTaskItem(taskId);
}

/**
 * Refresh a single task item in checkout modal
 */
function refreshCheckoutTaskItem(taskId) {
    const taskItem = document.querySelector(`.checkout-task-item[data-task-id="${taskId}"]`);
    if (!taskItem) return;

    // Find the task in current tasks
    let task = null;
    if (currentProjectTasks?.currentTaskBlock) {
        task = currentProjectTasks.currentTaskBlock.find(t => t.id === taskId);
    }
    if (!task && currentProjectTasks?.allTasks) {
        task = currentProjectTasks.allTasks.find(t => t.id === taskId);
    }

    if (task) {
        const newHtml = createTaskCheckboxItem(task, selectedTaskIds.includes(taskId));
        taskItem.outerHTML = newHtml;
    }
}

/**
 * Toggle task checkbox state
 */
function toggleTaskCheckbox(element) {
    const taskId = element.dataset.taskId;

    element.classList.toggle('checked');

    if (element.classList.contains('checked')) {
        if (!selectedTaskIds.includes(taskId)) {
            selectedTaskIds.push(taskId);
        }
    } else {
        selectedTaskIds = selectedTaskIds.filter(id => id !== taskId);
    }
}

/**
 * Show all project tasks modal
 */
function showAllProjectTasks() {
    const modal = document.getElementById('allTasksModal');
    const listContainer = document.getElementById('allTasksList');

    if (!modal || !listContainer) return;

    // Get all tasks that are not in the current block
    if (currentProjectTasks && currentProjectTasks.allTasks) {
        const currentBlockIds = (currentProjectTasks.currentTaskBlock || []).map(t => t.id);
        const otherTasks = currentProjectTasks.allTasks.filter(t =>
            !currentBlockIds.includes(t.id) && t.status !== 'COMPLETED'
        );

        allProjectTasksFromModal = otherTasks;

        if (otherTasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-tasks-message">
                    <p>Nao ha outras tarefas disponiveis no projeto.</p>
                </div>
            `;
        } else {
            let html = '';
            otherTasks.forEach(task => {
                // Keep checked state if already selected
                const isChecked = selectedTaskIds.includes(task.id);
                html += createTaskCheckboxItem(task, isChecked);
            });
            listContainer.innerHTML = html;
        }
    } else {
        listContainer.innerHTML = `
            <div class="empty-tasks-message">
                <p>Carregando tarefas...</p>
            </div>
        `;
    }

    modal.classList.add('active');
}

/**
 * Close all tasks modal
 */
function closeAllTasksModal() {
    const modal = document.getElementById('allTasksModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Confirm selection from all tasks modal
 */
function confirmAllTaskSelection() {
    closeAllTasksModal();
    // Selected tasks are already tracked in selectedTaskIds
}

/**
 * Skip task completion and go directly to report reminder
 */
function skipTaskCompletion() {
    const modal = document.getElementById('taskCompletionModal');
    if (modal) {
        modal.classList.remove('active');
    }

    selectedTaskIds = [];
    showReportReminderModal();
}

/**
 * Submit task completions and show report reminder
 */
async function submitTaskCompletions() {
    const modal = document.getElementById('taskCompletionModal');
    if (modal) {
        modal.classList.remove('active');
    }

    showReportReminderModal();
}

/**
 * Show report reminder modal
 */
function showReportReminderModal() {
    const modal = document.getElementById('reportReminderModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Hide report reminder modal
 */
function hideReportReminderModal() {
    const modal = document.getElementById('reportReminderModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Go to report screen (user chose "Enviar agora")
 * Does NOT complete checkout - user stays checked in while writing report
 */
function goToReportScreen() {
    hideReportReminderModal();

    // Close the leaving modal if open
    const leavingModal = document.getElementById('leavingModal');
    if (leavingModal) {
        leavingModal.classList.remove('active');
    }

    // Navigate to report screen (user remains checked in)
    navigateTo('screen-report');
}

/**
 * Schedule report reminder for 60 minutes
 */
async function scheduleReportReminder() {
    hideReportReminderModal();

    // Complete checkout with tasks and schedule reminder
    await doCheckoutWithTasksAndReminder('LATER_60MIN');
}

/**
 * Skip report reminder
 */
async function skipReportReminder() {
    hideReportReminderModal();

    // Complete checkout with tasks, no reminder
    await doCheckoutWithTasksAndReminder('SKIP');
}

/**
 * Complete checkout with task completion and report reminder option
 */
async function doCheckoutWithTasksAndReminder(reportOption = 'SKIP') {
    console.log('[CHECKOUT] doCheckoutWithTasksAndReminder chamado com reportOption:', reportOption);
    console.log('[CHECKOUT] activeCheckinId:', activeCheckinId);
    console.log('[CHECKOUT] selectedTaskIds:', selectedTaskIds);

    if (!activeCheckinId) {
        console.error('[CHECKOUT] No active checkin - abortando');
        return;
    }

    try {
        // Get current location
        let latitude = null;
        let longitude = null;

        if (navigator.geolocation && locationPermissionStatus === 'granted') {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (geoError) {
                console.log('Geolocation not available:', geoError);
            }
        }

        // For REPORT_SENT, we skip task selection (user already sent report, just checkout)
        const isReportSent = reportOption === 'REPORT_SENT';
        const taskIdsToSend = isReportSent ? [] : (selectedTaskIds || []);

        // Build task completions array with type and progress
        const taskCompletionsArray = taskIdsToSend.map(taskId => {
            const completion = taskCompletions[taskId];
            return {
                taskId,
                completionType: completion?.type || 'INTEGRAL',
                progress: completion?.progress || 100
            };
        });

        // Map REPORT_SENT to SKIP since report was already sent (API only accepts NOW, LATER_60MIN, SKIP)
        const apiReportOption = isReportSent ? 'SKIP' : reportOption;

        // IMPORTANT: Backend only accepts 'OUTRO_PROJETO' or 'FIM_EXPEDIENTE' as checkoutReason
        // Use 'FIM_EXPEDIENTE' as default if pendingCheckoutReason is not valid
        const validCheckoutReasons = ['OUTRO_PROJETO', 'FIM_EXPEDIENTE'];
        const checkoutReasonToSend = validCheckoutReasons.includes(pendingCheckoutReason)
            ? pendingCheckoutReason
            : 'FIM_EXPEDIENTE';

        console.log('[CHECKOUT] Enviando para API:', {
            completedTaskIds: taskIdsToSend,
            taskCompletions: taskCompletionsArray.length,
            checkoutReason: checkoutReasonToSend,
            reportOption: apiReportOption
        });

        const response = await fetch(`${API_URL}/api/mobile/checkins/${activeCheckinId}/complete-tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                completedTaskIds: taskIdsToSend,
                taskCompletions: taskCompletionsArray,
                checkoutReason: checkoutReasonToSend,
                reportOption: apiReportOption,
                latitude,
                longitude
            })
        });

        const data = await response.json();
        console.log('[CHECKOUT] Resposta da API:', data.success ? 'SUCCESS' : 'FAILED', data);

        if (data.success) {
            console.log('[CHECKOUT] Checkout realizado com sucesso, resetando estado...');
            // Reset state
            isCheckedIn = false;
            activeCheckinId = null;
            currentProjectForCheckin = null;
            pendingCheckoutReason = null;
            selectedTaskIds = [];
            taskCompletions = {};
            currentProjectTasks = null;

            updateCheckinUI(false);

            // Stop GPS background verification
            stopGPSBackgroundVerification();

            // Hide task block section
            const taskSection = document.getElementById('taskBlockSection');
            if (taskSection) taskSection.style.display = 'none';

            // Restart tracking
            restartLocationTracking();

            // Check if report is required NOW
            if (data.data?.requiresReport) {
                // Navigate to report screen immediately
                hideReportReminderModal();
                closeTaskCompletionModal();
                navigateTo('report');
                showSuccessModal('Relatorio Obrigatorio', 'Por favor, envie seu relatorio antes de finalizar.');
                return;
            }

            // Show XP notification if earned (skip if report was just sent - caller handles notification)
            if (data.xp) {
                updateUserXP(data.xp.total, data.xp.level);
                if (reportOption !== 'REPORT_SENT') {
                    showXPNotification(data.xp.totalEarned, 'Checkout + Tarefas', data.xp.total);
                }
            }

            // Skip showing success modal if report was just sent (caller handles it)
            // Return XP data so caller can show notification
            if (reportOption === 'REPORT_SENT') {
                console.log('[CHECKOUT] reportOption=REPORT_SENT, retornando dados de XP para caller');
                return { success: true, xp: data.xp, tasksCompleted: data.data?.tasksCompleted || 0 };
            }

            // Show success message
            const tasksCompleted = data.data?.tasksCompleted || 0;
            let message = 'Check-out realizado com sucesso!';

            if (tasksCompleted > 0) {
                message = `${tasksCompleted} tarefa(s) atualizada(s)!`;
            }

            if (data.data?.reportAlreadySubmitted) {
                message += '\n\nRelatorio ja foi enviado hoje por outro membro da equipe.';
            } else if (reportOption === 'LATER_60MIN' && data.data?.reportReminder) {
                message += '\n\nVoce sera lembrado em 60 minutos para enviar o relatorio.';
                // Store reminder for in-app display
                storePendingReminder(data.data.reportReminder);
            }

            showSuccessModal('Check-out Realizado', message);
        } else {
            // If called from report submission, throw error so caller can handle
            const errorMessage = data.error?.message || 'Nao foi possivel completar o check-out.';
            console.error('[CHECKOUT] API retornou erro:', errorMessage);
            if (reportOption === 'REPORT_SENT') {
                throw new Error(errorMessage);
            }
            showSuccessModal('Erro', errorMessage);
        }
    } catch (error) {
        console.error('[CHECKOUT] Checkout with tasks error:', error);
        // Re-throw if called from report submission so caller can handle
        if (reportOption === 'REPORT_SENT') {
            throw error;
        }
        showSuccessModal('Erro', 'Erro de conexao. Tente novamente.');
    }
}

/**
 * Update task block visibility based on checkin state
 */
function updateTaskBlockVisibility(show) {
    const section = document.getElementById('taskBlockSection');
    if (section) {
        section.style.display = show ? 'block' : 'none';
    }
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================
// REPORT REMINDER SYSTEM
// =============================================

/**
 * Store a pending reminder in localStorage
 */
function storePendingReminder(reminder) {
    if (!reminder) return;
    localStorage.setItem('pendingReportReminder', JSON.stringify({
        id: reminder.id,
        scheduledFor: reminder.scheduledFor,
        createdAt: new Date().toISOString()
    }));
}

/**
 * Check and display pending reminders on app startup
 */
async function checkPendingReminders() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/mobile/report-reminders/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
            // Show the most recent pending reminder
            const reminder = data.data[0];
            showInAppReminderBanner(reminder);
        }
    } catch (error) {
        console.log('Could not check pending reminders:', error);
    }
}

/**
 * Show in-app reminder banner
 */
function showInAppReminderBanner(reminder) {
    // Remove existing banner if any
    const existingBanner = document.querySelector('.reminder-banner');
    if (existingBanner) existingBanner.remove();

    const reminderCount = reminder.reminderCount || 0;
    const projectName = reminder.project?.title || reminder.project?.cliente || 'Projeto';

    const banner = document.createElement('div');
    banner.className = 'reminder-banner';
    banner.innerHTML = `
        <div class="reminder-banner-content">
            <div class="reminder-icon">📋</div>
            <div class="reminder-text">
                <strong>Lembrete de Relatorio</strong>
                <p>${projectName} - Aviso ${reminderCount + 1} de 3</p>
            </div>
            <button class="reminder-action" onclick="goToReportFromReminder('${reminder.id}')">
                Enviar
            </button>
            <button class="reminder-dismiss" onclick="dismissReminderBanner('${reminder.id}')">
                ✕
            </button>
        </div>
    `;

    document.body.appendChild(banner);

    // Auto-hide after 30 seconds
    setTimeout(() => {
        banner.classList.add('hiding');
        setTimeout(() => banner.remove(), 300);
    }, 30000);
}

/**
 * Go to report screen from reminder banner
 */
function goToReportFromReminder(reminderId) {
    // Remove banner
    const banner = document.querySelector('.reminder-banner');
    if (banner) banner.remove();

    // Navigate to report
    navigateTo('report');
}

/**
 * Dismiss reminder banner
 */
async function dismissReminderBanner(reminderId) {
    // Remove banner
    const banner = document.querySelector('.reminder-banner');
    if (banner) {
        banner.classList.add('hiding');
        setTimeout(() => banner.remove(), 300);
    }

    // Notify backend (optional - just hide locally)
    try {
        const token = getAuthToken();
        if (token) {
            await fetch(`${API_URL}/api/mobile/report-reminders/${reminderId}/dismiss`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
    } catch (error) {
        console.log('Could not dismiss reminder on server:', error);
    }
}

/**
 * Handle message from Service Worker about report reminders
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'DISMISS_REPORT_REMINDER') {
            dismissReminderBanner(event.data.reminderId);
        } else if (event.data?.type === 'SHOW_XP_LOSS') {
            // Show XP loss animation from push notification
            const { amount, reason, projectName } = event.data;
            showXPLossNotification(
                Math.abs(amount),
                `${projectName}: ${reason}`
            );
        } else if (event.data?.type === 'SHOW_XP_GAIN') {
            // Show XP gain animation from push notification (admin praise)
            // Using showXPGain for full-screen celebration effect
            console.log('[APP] SHOW_XP_GAIN received from Service Worker:', event.data);
            const { amount, reason, totalXP } = event.data;
            console.log('[APP] Calling showXPGain with amount:', amount, 'reason:', reason);
            showXPGain(Math.abs(amount), `Elogio: ${reason}`);
            // Update profile XP display if totalXP is provided
            if (totalXP !== undefined && totalXP !== null) {
                console.log('[APP] Updating currentUser.xpTotal to:', totalXP);
                currentUser.xpTotal = totalXP;
                updateProfileXP();
            }
        } else if (event.data?.type === 'ABSENCE_INQUIRY') {
            // Show absence inquiry modal from push notification
            showAbsenceInquiryModal(event.data.unreportedAbsenceId, event.data.absenceDate);
        }
    });
}

// =============================================
// ABSENCE NOTICE SYSTEM
// =============================================

let absenceDatesOffset = 0;
let selectedAbsenceDate = null;
let pendingAbsenceInquiryId = null;
let pendingAbsenceResponse = null;

/**
 * Open the absence notice modal
 */
async function openAbsenceModal() {
    const modal = document.getElementById('absenceModal');
    if (!modal) return;

    // Reset state
    absenceDatesOffset = 0;
    selectedAbsenceDate = null;
    document.getElementById('absenceReason').value = '';
    document.getElementById('btnConfirmAbsence').disabled = true;
    document.getElementById('absenceWarning').style.display = 'none';

    // Load available dates
    await loadAbsenceDates();

    modal.classList.add('active');
}

/**
 * Close the absence notice modal
 */
function closeAbsenceModal() {
    const modal = document.getElementById('absenceModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Load available dates for absence notice
 */
async function loadAbsenceDates() {
    const container = document.getElementById('absenceDatesList');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner-small"></div>';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Faca login para continuar</p>';
            return;
        }

        const response = await fetch(`${API_URL}/api/mobile/absences/available-dates?offset=${absenceDatesOffset}&count=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load dates');

        const result = await response.json();
        const dates = result.data || [];

        if (absenceDatesOffset === 0) {
            container.innerHTML = '';
        } else {
            // Remove loading spinner if it exists
            const spinner = container.querySelector('.loading-spinner-small');
            if (spinner) spinner.remove();
        }

        dates.forEach(dateInfo => {
            const btn = document.createElement('button');
            btn.className = 'absence-date-btn';
            btn.dataset.date = dateInfo.date;
            btn.innerHTML = `<span class="day-name">${dateInfo.dayOfWeek}</span> ${dateInfo.dayOfMonth}/${dateInfo.month}`;
            btn.onclick = () => selectAbsenceDate(btn, dateInfo.date);
            container.appendChild(btn);
        });

        // Check for same-day warning
        updateAbsenceWarning();

    } catch (error) {
        console.error('Error loading absence dates:', error);
        container.innerHTML = '<p style="color: var(--accent-red);">Erro ao carregar datas</p>';
    }
}

/**
 * Load more dates
 */
function loadMoreAbsenceDates() {
    absenceDatesOffset += 5;
    loadAbsenceDates();
}

/**
 * Select an absence date
 */
function selectAbsenceDate(btn, date) {
    // Remove selection from all buttons
    document.querySelectorAll('.absence-date-btn').forEach(b => b.classList.remove('selected'));

    // Select this button
    btn.classList.add('selected');
    selectedAbsenceDate = date;

    // Update confirm button state
    updateConfirmButton();

    // Check for same-day warning
    updateAbsenceWarning();
}

/**
 * Update the confirm button state
 */
function updateConfirmButton() {
    const btn = document.getElementById('btnConfirmAbsence');
    const reason = document.getElementById('absenceReason').value.trim();
    btn.disabled = !selectedAbsenceDate || reason.length < 3;
}

/**
 * Update the same-day warning visibility
 */
function updateAbsenceWarning() {
    const warning = document.getElementById('absenceWarning');
    if (!selectedAbsenceDate) {
        warning.style.display = 'none';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(selectedAbsenceDate);
    selected.setHours(0, 0, 0, 0);

    // Show warning if it's today
    if (selected.getTime() === today.getTime()) {
        warning.style.display = 'flex';
    } else {
        warning.style.display = 'none';
    }
}

/**
 * Submit absence notice
 */
async function submitAbsenceNotice() {
    if (!selectedAbsenceDate) return;

    const reason = document.getElementById('absenceReason').value.trim();
    if (reason.length < 3) {
        showToast('Digite um motivo para a falta', 'error');
        return;
    }

    const btn = document.getElementById('btnConfirmAbsence');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Sessao expirada. Faca login novamente.', 'error');
            return;
        }

        const response = await fetch(`${API_URL}/api/mobile/absences`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                absenceDate: selectedAbsenceDate,
                reason: reason
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || 'Erro ao registrar falta');
        }

        // Show success message
        closeAbsenceModal();

        if (result.data.xpPenalty > 0) {
            showXPLossNotification(result.data.xpPenalty, 'Aviso de falta no mesmo dia');
        }

        showToast(result.data.message, result.data.wasAdvanceNotice ? 'success' : 'warning');

    } catch (error) {
        console.error('Error submitting absence:', error);
        showToast(error.message || 'Erro ao registrar falta', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirmar Falta';
    }
}

/**
 * Show absence inquiry modal (called from push notification)
 */
function showAbsenceInquiryModal(unreportedAbsenceId, absenceDate) {
    pendingAbsenceInquiryId = unreportedAbsenceId;

    const modal = document.getElementById('absenceInquiryModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Hide absence inquiry modal
 */
function hideAbsenceInquiryModal() {
    const modal = document.getElementById('absenceInquiryModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Respond to absence inquiry
 */
function respondAbsenceInquiry(response) {
    pendingAbsenceResponse = response;
    hideAbsenceInquiryModal();

    // Show reason modal
    const reasonModal = document.getElementById('absenceReasonModal');
    const title = document.getElementById('absenceReasonTitle');

    if (response === 'SIM') {
        title.textContent = 'Qual foi o motivo da falta?';
    } else {
        title.textContent = 'Por que nao houve atividade?';
    }

    document.getElementById('absenceReasonInput').value = '';
    reasonModal.classList.add('active');
}

/**
 * Submit absence reason
 */
async function submitAbsenceReason() {
    const reasonInput = document.getElementById('absenceReasonInput');
    const reason = reasonInput.value.trim();

    if (reason.length < 3) {
        showToast('Digite um motivo/explicacao', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Sessao expirada', 'error');
            return;
        }

        const response = await fetch(`${API_URL}/api/mobile/absences/respond`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                unreportedAbsenceId: pendingAbsenceInquiryId,
                response: pendingAbsenceResponse,
                reasonOrExplanation: reason
            })
        });

        const result = await response.json();

        // Close modal
        document.getElementById('absenceReasonModal').classList.remove('active');

        if (!response.ok) {
            throw new Error(result.error?.message || 'Erro ao enviar resposta');
        }

        showToast(result.data.message, 'success');

        // Reset state
        pendingAbsenceInquiryId = null;
        pendingAbsenceResponse = null;

    } catch (error) {
        console.error('Error submitting absence reason:', error);
        showToast(error.message || 'Erro ao enviar resposta', 'error');
    }
}

/**
 * Check for pending absence inquiries on app load
 */
async function checkPendingAbsenceInquiry() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/api/mobile/absences/pending-inquiry`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const result = await response.json();

        if (result.data) {
            // Show inquiry modal
            showAbsenceInquiryModal(result.data.id, result.data.absenceDate);
        }
    } catch (error) {
        console.log('Could not check pending absence inquiry:', error);
    }
}

// Add event listener for reason textarea to update confirm button
document.getElementById('absenceReason')?.addEventListener('input', updateConfirmButton);

// Check for pending absence inquiries when app loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkPendingAbsenceInquiry, 2000);
});

// =============================================
// DEBUG: Push Notification Testing
// =============================================

/**
 * Debug function to test push notifications
 * Call from browser console: window.testPush()
 */
window.testPush = async function() {
    console.log('===== TESTE DE PUSH NOTIFICATIONS =====\n');

    // 1. Check Service Worker support
    console.log('1. Service Worker support:', 'serviceWorker' in navigator ? '✅ OK' : '❌ Não suportado');

    // 2. Check Push support
    console.log('2. Push Manager support:', 'PushManager' in window ? '✅ OK' : '❌ Não suportado');

    // 3. Check Notification support
    console.log('3. Notification support:', 'Notification' in window ? '✅ OK' : '❌ Não suportado');

    // 4. Check Notification permission
    console.log('4. Notification permission:', Notification.permission);

    // 5. Check Service Worker registration
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            console.log('5. Service Worker registrado:');
            console.log('   - Scope:', registration.scope);
            console.log('   - Active:', registration.active ? '✅ Sim' : '❌ Não');
            console.log('   - Waiting:', registration.waiting ? '⚠️ Sim (pendente update)' : 'Não');
            console.log('   - Installing:', registration.installing ? '⚠️ Instalando...' : 'Não');

            // 6. Check push subscription
            try {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    console.log('6. Push Subscription: ✅ Ativa');
                    console.log('   - Endpoint:', subscription.endpoint.substring(0, 60) + '...');
                } else {
                    console.log('6. Push Subscription: ❌ Não existe');
                }
            } catch (e) {
                console.log('6. Push Subscription: ❌ Erro:', e.message);
            }
        } else {
            console.log('5. Service Worker: ❌ Não registrado');
        }
    }

    console.log('\n===== FIM DO DIAGNÓSTICO =====');
    return 'Diagnóstico completo. Veja os logs acima.';
};

/**
 * Force update Service Worker
 * Call from browser console: window.updateSW()
 */
window.updateSW = async function() {
    console.log('Forçando atualização do Service Worker...');

    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.update();
            console.log('✅ Service Worker atualizado. Recarregue a página.');

            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                console.log('✅ SKIP_WAITING enviado. Recarregando...');
                setTimeout(() => window.location.reload(), 1000);
            }
        } else {
            console.log('❌ Nenhum Service Worker registrado');
        }
    }
};

/**
 * Test local notification (not push)
 * Call from browser console: window.testLocalNotification()
 */
window.testLocalNotification = async function() {
    console.log('Testando notificação local...');

    if (Notification.permission !== 'granted') {
        console.log('Solicitando permissão...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('❌ Permissão negada');
            return;
        }
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
        await registration.showNotification('TESTE LOCAL', {
            body: 'Esta é uma notificação de teste local',
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            tag: 'test-local',
            vibrate: [200, 100, 200],
            data: { type: 'test' }
        });
        console.log('✅ Notificação local enviada! Olhe na tela.');
    } else {
        console.log('❌ Service Worker não registrado');
    }
};

/**
 * Simulate receiving XP gain notification
 * Call from browser console: window.simulateXPGain(500, 'Elogio do Admin')
 */
window.simulateXPGain = function(amount = 100, reason = 'Teste') {
    console.log('Simulando recebimento de XP Gain...');
    showXPGain(amount, reason);
    console.log('✅ Animação de XP Gain exibida!');
};

/**
 * Simulate receiving XP loss notification
 * Call from browser console: window.simulateXPLoss(100, 'Penalidade do Admin')
 */
window.simulateXPLoss = function(amount = 100, reason = 'Teste') {
    console.log('Simulando recebimento de XP Loss...');
    showXPLoss(amount, `Penalidade: ${reason}`);
    console.log('✅ Animação de XP Loss exibida!');
};

console.log('[DEBUG] Funções de teste disponíveis:');
console.log('  - window.testPush() - Diagnóstico de push notifications');
console.log('  - window.updateSW() - Forçar atualização do Service Worker');
console.log('  - window.testLocalNotification() - Testar notificação local');
console.log('  - window.simulateXPGain(100, "razão") - Simular XP Gain');
console.log('  - window.simulateXPLoss(100, "razão") - Simular XP Loss');

// =============================================
// OFFLINE LOCATION SYSTEM with IndexedDB
// =============================================

/**
 * Initialize IndexedDB for offline locations
 */
function initLocationDB() {
    return new Promise((resolve, reject) => {
        if (locationDB) {
            resolve(locationDB);
            return;
        }

        if (!window.indexedDB) {
            console.warn('[LocationDB] IndexedDB não suportado, usando array em memória');
            resolve(null);
            return;
        }

        const request = indexedDB.open(LOCATION_DB_NAME, LOCATION_DB_VERSION);

        request.onerror = (event) => {
            console.error('[LocationDB] Erro ao abrir:', event.target.error);
            resolve(null);
        };

        request.onsuccess = (event) => {
            locationDB = event.target.result;
            console.log('[LocationDB] IndexedDB inicializado');
            resolve(locationDB);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Store for pending locations
            if (!db.objectStoreNames.contains(LOCATION_STORE_NAME)) {
                const locationStore = db.createObjectStore(LOCATION_STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                locationStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('[LocationDB] Store de localizações criado');
            }

            // Store for GPS off logs
            if (!db.objectStoreNames.contains(GPS_LOG_STORE_NAME)) {
                const gpsLogStore = db.createObjectStore(GPS_LOG_STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                gpsLogStore.createIndex('startTime', 'startTime', { unique: false });
                console.log('[LocationDB] Store de GPS logs criado');
            }

            // Store for timeline events (24h movement tracking)
            if (!db.objectStoreNames.contains(TIMELINE_STORE_NAME)) {
                const timelineStore = db.createObjectStore(TIMELINE_STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                timelineStore.createIndex('timestamp', 'timestamp', { unique: false });
                timelineStore.createIndex('type', 'type', { unique: false });
                timelineStore.createIndex('date', 'date', { unique: false });
                console.log('[LocationDB] Store de timeline criado');
            }
        };
    });
}

/**
 * Save location to IndexedDB when offline
 */
async function saveLocationToIndexedDB(location) {
    try {
        await initLocationDB();

        if (!locationDB) {
            // Fallback to memory array
            pendingLocationUpdates.push(location);
            console.log('[LocationDB] Fallback: salvo em memória');
            return;
        }

        const transaction = locationDB.transaction([LOCATION_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LOCATION_STORE_NAME);
        store.add(location);

        transaction.oncomplete = () => {
            console.log('[LocationDB] Localização salva offline');
        };

        transaction.onerror = (event) => {
            console.error('[LocationDB] Erro ao salvar:', event.target.error);
            pendingLocationUpdates.push(location);
        };
    } catch (error) {
        console.error('[LocationDB] Erro:', error);
        pendingLocationUpdates.push(location);
    }
}

/**
 * Get all pending locations from IndexedDB
 */
async function getPendingLocationsFromIndexedDB() {
    try {
        await initLocationDB();

        if (!locationDB) {
            return pendingLocationUpdates;
        }

        return new Promise((resolve, reject) => {
            const transaction = locationDB.transaction([LOCATION_STORE_NAME], 'readonly');
            const store = transaction.objectStore(LOCATION_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const dbLocations = request.result || [];
                // Combine with memory array
                const allLocations = [...pendingLocationUpdates, ...dbLocations];
                resolve(allLocations);
            };

            request.onerror = () => {
                resolve(pendingLocationUpdates);
            };
        });
    } catch (error) {
        console.error('[LocationDB] Erro ao buscar:', error);
        return pendingLocationUpdates;
    }
}

/**
 * Clear all pending locations from IndexedDB after successful sync
 */
async function clearPendingLocationsFromIndexedDB() {
    try {
        pendingLocationUpdates = [];

        if (!locationDB) return;

        const transaction = locationDB.transaction([LOCATION_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LOCATION_STORE_NAME);
        store.clear();

        console.log('[LocationDB] Localizações pendentes limpos');
    } catch (error) {
        console.error('[LocationDB] Erro ao limpar:', error);
    }
}

/**
 * Sync all pending locations to server
 */
async function syncPendingLocations() {
    const locations = await getPendingLocationsFromIndexedDB();

    if (locations.length === 0) {
        console.log('[LocationSync] Nenhuma localização pendente');
        return;
    }

    console.log(`[LocationSync] Sincronizando ${locations.length} localizações...`);

    const token = getAuthToken();
    if (!token) {
        console.log('[LocationSync] Sem token, sync cancelado');
        return;
    }

    let successCount = 0;
    const failedLocations = [];

    for (const location of locations) {
        try {
            const response = await fetch(`${API_URL}/api/mobile/location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...location,
                    wasQueued: true,
                    syncedAt: new Date().toISOString()
                })
            });

            if (response.ok) {
                successCount++;
            } else {
                failedLocations.push(location);
            }
        } catch (error) {
            console.log('[LocationSync] Erro ao enviar:', error);
            failedLocations.push(location);
        }
    }

    // Clear successful syncs
    await clearPendingLocationsFromIndexedDB();

    // Re-save failed ones
    for (const failed of failedLocations) {
        await saveLocationToIndexedDB(failed);
    }

    console.log(`[LocationSync] Sincronizado: ${successCount}/${locations.length}`);

    if (successCount > 0) {
        showToast(`${successCount} localização(ões) sincronizada(s)`, 'success');
    }
}

// =============================================
// GPS OFF PERIOD LOGGING
// =============================================

/**
 * Notify backend about GPS status change
 * Backend will auto-checkout after 60 seconds with GPS off
 */
async function notifyBackendGPSStatus(status) {
    const token = getAuthToken();
    if (!token) {
        console.log('[GPS Backend] Sem token, não notificando');
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/api/mobile/location/gps-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        console.log('[GPS Backend] Status atualizado:', data);

        if (data.success && status !== 'granted' && activeCheckinId) {
            const timeRemaining = Math.max(0, 60 - (data.secondsOff || 0));
            console.log(`[GPS Backend] Checkout automático em ${timeRemaining} segundos`);

            // Show warning modal if checked in
            if (timeRemaining > 0) {
                showGPSWarningModal(timeRemaining);
            }
        }

        return data;
    } catch (error) {
        console.error('[GPS Backend] Erro ao notificar:', error);
        return null;
    }
}

/**
 * Show GPS warning modal with countdown
 */
function showGPSWarningModal(secondsRemaining) {
    // Remove existing modal if any
    const existingModal = document.getElementById('gps-warning-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'gps-warning-modal';
    modal.className = 'gps-mobile-modal active';
    modal.innerHTML = `
        <div class="gps-mobile-content warning">
            <button class="gps-modal-close" onclick="hideGPSWarningModal()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <div class="gps-mobile-header">
                <div class="gps-mobile-icon-wrapper warning">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                        <line x1="4" y1="4" x2="20" y2="20" stroke="#ef4444" stroke-width="3"/>
                    </svg>
                </div>
                <h3 class="gps-mobile-title">GPS Desativado</h3>
            </div>
            <div class="gps-mobile-body">
                <div class="gps-countdown-circle">
                    <span id="gps-countdown">${secondsRemaining}</span>
                    <span class="gps-countdown-label">segundos</span>
                </div>
                <p class="gps-mobile-message">Seu check-out será realizado automaticamente</p>
                <p class="gps-mobile-hint">Ative o GPS para continuar trabalhando</p>
            </div>
            <div class="gps-modal-actions">
                <button class="gps-modal-btn primary" onclick="requestLocationPermissionFromModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Ativar Localização
                </button>
                <button class="gps-modal-btn secondary" onclick="hideGPSWarningModal()">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Countdown with animation
    let remaining = secondsRemaining;
    const countdownInterval = setInterval(() => {
        remaining--;
        const countdownEl = document.getElementById('gps-countdown');
        if (countdownEl) {
            countdownEl.textContent = remaining;
            countdownEl.classList.add('pulse');
            setTimeout(() => countdownEl.classList.remove('pulse'), 200);
        }
        if (remaining <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    // Store interval ID for cleanup
    modal.dataset.intervalId = countdownInterval;
}

/**
 * Hide GPS warning modal
 */
function hideGPSWarningModal() {
    const modal = document.getElementById('gps-warning-modal');
    if (modal) {
        const intervalId = modal.dataset.intervalId;
        if (intervalId) {
            clearInterval(parseInt(intervalId));
        }
        modal.remove();
    }
}

/**
 * Request location permission from GPS warning modal
 * Tries to re-request geolocation permission
 */
function requestLocationPermissionFromModal() {
    if (!navigator.geolocation) {
        showToast('Seu dispositivo não suporta GPS', 'error');
        return;
    }

    // Show loading state on button
    const btn = document.querySelector('.gps-modal-btn.primary');
    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Solicitando...';
        btn.disabled = true;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            // Success! GPS is back on
            console.log('[GPS] Localização reativada com sucesso');
            locationPermissionStatus = 'granted';
            gpsOffStartTime = null;

            // Notify backend
            notifyBackendGPSStatus('granted');

            // Hide modal and show success
            hideGPSWarningModal();
            hideLocationDeniedBanner();
            showToast('Localização ativada com sucesso!', 'success');

            // Restart location tracking
            startLocationTracking();
        },
        (error) => {
            console.log('[GPS] Erro ao solicitar localização:', error);

            // Reset button
            if (btn) {
                btn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Ativar Localização
                `;
                btn.disabled = false;
            }

            if (error.code === error.PERMISSION_DENIED) {
                showToast('Permissão negada. Ative nas configurações do navegador.', 'error');
            } else {
                showToast('Não foi possível obter localização. Tente novamente.', 'warning');
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

/**
 * Show GPS auto-checkout notification
 * Displayed when backend performs auto-checkout due to GPS off 60+ seconds
 */
function showGPSAutoCheckoutNotification(projectName) {
    // Remove existing modals
    hideGPSWarningModal();
    const existingModal = document.getElementById('gps-autocheckout-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'gps-autocheckout-modal';
    modal.className = 'gps-mobile-modal active';
    modal.innerHTML = `
        <div class="gps-mobile-content checkout">
            <div class="gps-mobile-header">
                <div class="gps-mobile-icon-wrapper checkout">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M15 9l-6 6"/>
                        <path d="M9 9l6 6"/>
                    </svg>
                </div>
                <h3 class="gps-mobile-title">Check-out Realizado</h3>
            </div>
            <div class="gps-mobile-body">
                <div class="gps-project-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>${projectName}</span>
                </div>
                <p class="gps-mobile-message-checkout">Seu check-out automático foi realizado</p>
                <p class="gps-mobile-warning">Suas horas não serão computadas</p>
                <p class="gps-mobile-reason">GPS desativado por mais de 5 minutos</p>
            </div>
            <button class="gps-mobile-btn" onclick="closeGPSAutoCheckoutModal()">
                <span>Entendi</span>
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    // Vibrate if available
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
    }

    // Auto-close after 15 seconds
    setTimeout(() => {
        closeGPSAutoCheckoutModal();
    }, 15000);
}

/**
 * Close GPS auto-checkout notification modal
 */
function closeGPSAutoCheckoutModal() {
    const modal = document.getElementById('gps-autocheckout-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Log when GPS is turned off during active check-in
 */
async function logGPSOffStart() {
    if (gpsOffStartTime) return; // Already tracking

    gpsOffStartTime = new Date().toISOString();

    console.log('[GPS Log] GPS desligado às', gpsOffStartTime);

    // Notify backend about GPS status change
    // Backend will auto-checkout after 60 seconds
    notifyBackendGPSStatus('denied');

    // Show persistent alert if checked in
    if (activeCheckinId) {
        showGPSOffAlert();
    }
}

/**
 * Log when GPS is turned back on
 */
async function logGPSOffEnd() {
    if (!gpsOffStartTime) return;

    const endTime = new Date().toISOString();
    const startTime = gpsOffStartTime;
    gpsOffStartTime = null;

    // Calculate duration
    const durationMs = new Date(endTime) - new Date(startTime);
    const durationMinutes = Math.round(durationMs / 60000);

    console.log(`[GPS Log] GPS ligado após ${durationMinutes} minutos`);

    // Hide persistent alert and warning modal
    hideGPSOffAlert();
    hideGPSWarningModal();

    // Notify backend that GPS is back on (cancels auto-checkout)
    notifyBackendGPSStatus('granted');

    // Save log to IndexedDB
    await saveGPSOffLog({
        startTime,
        endTime,
        durationMinutes,
        hadActiveCheckin: !!activeCheckinId,
        checkinId: activeCheckinId
    });

    // Try to sync immediately
    if (isOnline) {
        await syncGPSOffLogs();
    }
}

/**
 * Save GPS off period to IndexedDB
 */
async function saveGPSOffLog(log) {
    try {
        await initLocationDB();

        if (!locationDB) {
            console.log('[GPS Log] IndexedDB não disponível, log perdido');
            return;
        }

        const transaction = locationDB.transaction([GPS_LOG_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(GPS_LOG_STORE_NAME);
        store.add(log);

        console.log('[GPS Log] Período sem GPS salvo:', log.durationMinutes, 'min');
    } catch (error) {
        console.error('[GPS Log] Erro ao salvar:', error);
    }
}

/**
 * Sync GPS off logs to server
 */
async function syncGPSOffLogs() {
    try {
        await initLocationDB();
        if (!locationDB) return;

        const transaction = locationDB.transaction([GPS_LOG_STORE_NAME], 'readonly');
        const store = transaction.objectStore(GPS_LOG_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async () => {
            const logs = request.result || [];
            if (logs.length === 0) return;

            const token = getAuthToken();
            if (!token) return;

            console.log(`[GPS Log] Sincronizando ${logs.length} logs...`);

            try {
                const response = await fetch(`${API_URL}/api/mobile/location/gps-off-logs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ logs })
                });

                if (response.ok) {
                    // Clear synced logs
                    const clearTx = locationDB.transaction([GPS_LOG_STORE_NAME], 'readwrite');
                    clearTx.objectStore(GPS_LOG_STORE_NAME).clear();
                    console.log('[GPS Log] Logs sincronizados e limpos');
                }
            } catch (error) {
                console.log('[GPS Log] Erro ao sincronizar:', error);
            }
        };
    } catch (error) {
        console.error('[GPS Log] Erro:', error);
    }
}

// =============================================
// PERSISTENT GPS ALERT (during check-in)
// =============================================

/**
 * Show GPS off warning modal during check-in
 * Shows warning with button to enable GPS
 * After 3 dismissals without enabling, forces checkout
 */
function showGPSOffAlert() {
    if (gpsAlertShown) return;
    if (!activeCheckinId) return; // Only show during active check-in

    gpsAlertShown = true;
    const remainingWarnings = GPS_MAX_WARNINGS - gpsWarningDismissCount;

    // Create or update the GPS warning modal
    let modal = document.getElementById('gps-warning-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gps-warning-modal';
        modal.className = 'gps-warning-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="gps-warning-content">
            <div class="gps-warning-icon">📍</div>
            <h2>Localização Desativada!</h2>
            <p class="gps-warning-text">
                Seu GPS está <strong>desligado</strong>. Isso afetará diretamente suas <strong>horas de trabalho</strong>.
            </p>
            <p class="gps-warning-counter">
                ${remainingWarnings > 0
                    ? `⚠️ Aviso ${gpsWarningDismissCount + 1} de ${GPS_MAX_WARNINGS}`
                    : '🚨 Último aviso!'}
            </p>
            ${remainingWarnings <= 1 ? `
                <p class="gps-warning-urgent">
                    Se você ignorar este aviso, será feito <strong>checkout automático</strong> do projeto.
                </p>
            ` : ''}
            <div class="gps-warning-actions">
                <button class="btn-enable-gps" onclick="openLocationSettings()">
                    <span>📍</span> Ativar Localização
                </button>
                <button class="btn-dismiss-gps" onclick="dismissGPSWarning()">
                    Ignorar ${remainingWarnings > 1 ? `(${remainingWarnings - 1} restantes)` : '(Fazer Checkout)'}
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    // Vibrate intensely to get attention
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Also show the banner
    const banner = document.getElementById('gps-off-alert-banner');
    if (banner) {
        banner.style.display = 'block';
        banner.classList.add('pulse-alert');
    }
}

/**
 * Hide GPS off alert
 */
function hideGPSOffAlert() {
    gpsAlertShown = false;

    const modal = document.getElementById('gps-warning-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    const banner = document.getElementById('gps-off-alert-banner');
    if (banner) {
        banner.style.display = 'none';
        banner.classList.remove('pulse-alert');
    }
}

/**
 * User dismissed the GPS warning without enabling
 * After 3 dismissals, forces automatic checkout with retry mechanism
 */
async function dismissGPSWarning() {
    gpsWarningDismissCount++;
    hideGPSOffAlert();

    console.log(`[GPS Warning] Dismissed ${gpsWarningDismissCount}/${GPS_MAX_WARNINGS}`);

    // Log timeline event
    await logTimelineEvent('GPS_WARNING_DISMISSED', {
        dismissCount: gpsWarningDismissCount,
        maxWarnings: GPS_MAX_WARNINGS
    });

    if (gpsWarningDismissCount >= GPS_MAX_WARNINGS) {
        // Force checkout after 3 dismissals with retry mechanism
        console.log('[GPS Warning] Max dismissals reached, FORCING checkout with retry');
        showToast('Checkout automático - GPS desativado por muito tempo', 'warning');

        // Try checkout with retry mechanism
        const checkoutSuccess = await forceGPSCheckout();

        if (checkoutSuccess) {
            console.log('[GPS Warning] Forced checkout SUCCESSFUL');
            gpsWarningDismissCount = 0;
        } else {
            // Checkout failed - keep trying every 10 seconds
            console.error('[GPS Warning] Forced checkout FAILED - starting retry loop');
            startForcedCheckoutRetry();
        }
    } else {
        // Show warning again after delay
        setTimeout(() => {
            if (activeCheckinId && locationPermissionStatus !== 'granted') {
                gpsAlertShown = false; // Reset to allow showing again
                showGPSOffAlert();
            }
        }, 30000); // 30 seconds between warnings
    }
}

// Retry interval for forced checkout
let forcedCheckoutRetryInterval = null;
let forcedCheckoutRetryCount = 0;
const FORCED_CHECKOUT_MAX_RETRIES = 10;

/**
 * Force checkout due to GPS being disabled
 * Uses INTERNET-ONLY checkout (no GPS required)
 * Returns true if successful, false otherwise
 */
async function forceGPSCheckout() {
    if (!activeCheckinId) {
        console.log('[GPS Checkout] No active checkin to checkout');
        return true; // Consider success if no checkin
    }

    console.log('[GPS Checkout] Attempting INTERNET-ONLY checkout (no GPS)...');

    // Use direct API call WITHOUT trying to get location
    const success = await doCheckoutWithoutGPS();

    if (success) {
        // Double verification - check state after checkout
        if (!activeCheckinId && !isCheckedIn) {
            console.log('[GPS Checkout] VERIFIED - No active checkin after checkout');
            return true;
        } else {
            console.error('[GPS Checkout] State mismatch - still has active checkin');
            // Force clear local state
            forceLocalCheckoutClear();
            return true;
        }
    }

    return false;
}

/**
 * Checkout via internet only - NO GPS REQUIRED
 * Used when GPS is disabled and we need to force checkout
 */
async function doCheckoutWithoutGPS() {
    const checkinId = activeCheckinId;
    if (!checkinId) {
        console.log('[Checkout NoGPS] No active checkin');
        return false;
    }

    console.log(`[Checkout NoGPS] Sending checkout request for checkin ${checkinId}`);

    try {
        const response = await fetch(`${API_URL}/api/mobile/checkins/${checkinId}/checkout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                // NO latitude/longitude - GPS is off
                latitude: null,
                longitude: null,
                reason: 'GPS_DESATIVADO'
            })
        });

        const data = await response.json();
        console.log('[Checkout NoGPS] API response:', data);

        if (data.success) {
            // Clear local state
            isCheckedIn = false;
            activeCheckinId = null;
            currentProjectForCheckin = null;
            pendingCheckoutReason = null;
            updateCheckinUI(false);
            stopGPSBackgroundVerification();
            restartLocationTracking();

            console.log('[Checkout NoGPS] SUCCESS');
            return true;
        } else {
            console.error('[Checkout NoGPS] API returned error:', data.error);
            return false;
        }
    } catch (error) {
        console.error('[Checkout NoGPS] Network error:', error);
        return false;
    }
}

/**
 * Force clear local checkout state (last resort)
 */
function forceLocalCheckoutClear() {
    console.log('[Checkout] FORCING local state clear');
    isCheckedIn = false;
    activeCheckinId = null;
    currentProjectForCheckin = null;
    pendingCheckoutReason = null;
    updateCheckinUI(false);
    stopGPSBackgroundVerification();
}

/**
 * Start retry loop for forced checkout
 * Keeps trying until checkout succeeds or max retries reached
 */
function startForcedCheckoutRetry() {
    // Clear any existing retry interval
    if (forcedCheckoutRetryInterval) {
        clearInterval(forcedCheckoutRetryInterval);
    }

    forcedCheckoutRetryCount = 0;

    forcedCheckoutRetryInterval = setInterval(async () => {
        forcedCheckoutRetryCount++;
        console.log(`[GPS Checkout] Retry ${forcedCheckoutRetryCount}/${FORCED_CHECKOUT_MAX_RETRIES}`);

        // Check if still need to checkout
        if (!activeCheckinId) {
            console.log('[GPS Checkout] No active checkin - stopping retry');
            clearInterval(forcedCheckoutRetryInterval);
            forcedCheckoutRetryInterval = null;
            gpsWarningDismissCount = 0;
            return;
        }

        const success = await forceGPSCheckout();

        if (success) {
            console.log('[GPS Checkout] Retry SUCCESSFUL');
            clearInterval(forcedCheckoutRetryInterval);
            forcedCheckoutRetryInterval = null;
            gpsWarningDismissCount = 0;
            showToast('Checkout automático realizado com sucesso', 'success');
        } else if (forcedCheckoutRetryCount >= FORCED_CHECKOUT_MAX_RETRIES) {
            console.error('[GPS Checkout] Max retries reached - forcing local clear');
            clearInterval(forcedCheckoutRetryInterval);
            forcedCheckoutRetryInterval = null;

            // Force clear local state regardless
            isCheckedIn = false;
            const oldCheckinId = activeCheckinId;
            activeCheckinId = null;
            currentProjectForCheckin = null;
            updateCheckinUI(false);
            stopGPSBackgroundVerification();
            gpsWarningDismissCount = 0;

            // Log this critical event
            await logTimelineEvent('FORCED_CHECKOUT_FAILED', {
                checkinId: oldCheckinId,
                retryCount: forcedCheckoutRetryCount,
                reason: 'Max retries exceeded - local state cleared'
            });

            showToast('Sessão encerrada localmente. Contate suporte se necessário.', 'warning');
        }
    }, 10000); // Retry every 10 seconds
}

/**
 * Start GPS background verification - SIMPLIFIED RULE
 * Checks every 10 seconds. If GPS is off for 5 minutes = automatic checkout (backend handles via 10 confirmations)
 * NO WARNINGS - Just immediate checkout with notification
 */
function startGPSBackgroundVerification() {
    // Clear existing interval if any
    if (gpsVerificationInterval) {
        clearInterval(gpsVerificationInterval);
    }

    console.log('[GPS Verification] Starting - 5 minute rule active (warning after 60s)');
    gpsCheckoutInProgress = false;

    gpsVerificationInterval = setInterval(async () => {
        // Only verify if user has active check-in and not already processing
        if (!activeCheckinId || !isCheckedIn || gpsCheckoutInProgress) {
            return;
        }

        // Check current GPS permission status
        const currentStatus = await checkLocationPermission();

        if (currentStatus !== 'granted') {
            // GPS is not available
            if (!gpsOffStartTime) {
                // Just turned off - start the countdown
                gpsOffStartTime = Date.now();
                console.log('[GPS] Localização DESLIGADA - iniciando contagem de 5 minutos');

                // CRITICAL: Notify backend about GPS status change
                // This is what triggers the auto-checkout confirmation system
                notifyBackendGPSStatus('denied');
            } else {
                // Calculate how long GPS has been off
                const offDuration = Date.now() - gpsOffStartTime;
                const secondsLeft = Math.max(0, Math.ceil((GPS_MAX_OFF_DURATION - offDuration) / 1000));

                console.log(`[GPS] Localização off há ${Math.round(offDuration / 1000)}s (${secondsLeft}s restantes)`);

                // Only show warning modal after 60 seconds (GPS_WARNING_THRESHOLD)
                if (offDuration >= GPS_WARNING_THRESHOLD && offDuration < GPS_MAX_OFF_DURATION) {
                    // Show warning modal with countdown
                    showGPSWarningModal(secondsLeft);
                }

                if (offDuration >= GPS_MAX_OFF_DURATION && !gpsCheckoutInProgress) {
                    // BACKEND HANDLES CHECKOUT - Frontend only shows warning
                    // The backend monitors location updates and triggers checkout via socket
                    // after 10 confirmations (5 minutes of GPS off)
                    console.log('[GPS] ⚠️ 5 MINUTOS ATINGIDO - aguardando backend fazer checkout via socket');

                    // Log critical event
                    await logTimelineEvent('GPS_WAITING_BACKEND_CHECKOUT', {
                        offDuration: offDuration,
                        rule: 'Backend handles checkout via 10 confirmations (5 min)'
                    });

                    // Show warning that checkout is imminent (backend will trigger it)
                    showToast('⚠️ GPS desligado! Checkout automático em breve...', 'error');
                }
            }
        } else {
            // GPS is back on - reset timer
            if (gpsOffStartTime) {
                console.log('[GPS] Localização RESTAURADA - timer resetado');
                gpsOffStartTime = null;

                // Notify backend that GPS is back on (cancels auto-checkout)
                notifyBackendGPSStatus('granted');

                showToast('✅ Localização ativada!', 'success');
            }
        }
    }, GPS_VERIFICATION_INTERVAL);
}

/**
 * Execute automatic checkout due to GPS being off for 5 minutes
 * Uses INTERNET-ONLY checkout (no GPS dependency)
 * Shows prominent notification and does checkout
 */
async function executeGPSAutoCheckout() {
    const checkoutMessage = 'Seu check-out automático foi realizado e suas horas no projeto não serão computadas.';

    console.log('[GPS Auto-Checkout] EXECUTING - 5 minutes GPS off reached');

    // Show in-app modal FIRST (prominent, can't be missed)
    showGPSCheckoutModal(checkoutMessage);

    // Try to show device notification
    sendGPSCheckoutNotification(checkoutMessage);

    // Execute the actual checkout via INTERNET ONLY (no GPS needed)
    try {
        console.log('[GPS Auto-Checkout] Attempting internet-only checkout...');
        const success = await forceGPSCheckout();

        if (success) {
            console.log('[GPS Auto-Checkout] ✅ SUCCESS - checkout completed via API');
            gpsOffStartTime = null;
            gpsCheckoutInProgress = false;
        } else {
            // Retry once
            console.log('[GPS Auto-Checkout] First attempt failed - retrying in 2s...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const retrySuccess = await forceGPSCheckout();

            if (retrySuccess) {
                console.log('[GPS Auto-Checkout] ✅ Retry SUCCESS');
            } else {
                // Force local state clear as LAST RESORT
                console.log('[GPS Auto-Checkout] ⚠️ API failed - forcing local clear');
                forceLocalCheckoutClear();
            }

            gpsOffStartTime = null;
            gpsCheckoutInProgress = false;
        }
    } catch (error) {
        console.error('[GPS Auto-Checkout] ❌ Error:', error);
        // Force local clear on any error
        forceLocalCheckoutClear();
        gpsOffStartTime = null;
        gpsCheckoutInProgress = false;
    }
}

/**
 * Show prominent modal for GPS auto-checkout
 */
function showGPSCheckoutModal(message) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('gps-checkout-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gps-checkout-modal';
        modal.className = 'gps-checkout-modal';
        modal.innerHTML = `
            <div class="gps-checkout-content">
                <div class="gps-checkout-icon">⚠️</div>
                <h2>Check-out Automático</h2>
                <p id="gps-checkout-message"></p>
                <button onclick="closeGPSCheckoutModal()" class="btn-gps-checkout-ok">Entendi</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('gps-checkout-message').textContent = message;
    modal.style.display = 'flex';

    // Auto-close after 10 seconds
    setTimeout(() => {
        closeGPSCheckoutModal();
    }, 10000);
}

function closeGPSCheckoutModal() {
    const modal = document.getElementById('gps-checkout-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Send device push notification for GPS checkout
 */
async function sendGPSCheckoutNotification(message) {
    try {
        // Check if notifications are supported and permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Monofloor - Check-out Automático', {
                body: message,
                icon: '/logo.png',
                tag: 'gps-checkout',
                requireInteraction: true
            });
            console.log('[GPS] Device notification sent');
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            // Request permission
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification('Monofloor - Check-out Automático', {
                    body: message,
                    icon: '/logo.png',
                    tag: 'gps-checkout',
                    requireInteraction: true
                });
            }
        }
    } catch (error) {
        console.log('[GPS] Could not send device notification:', error);
    }
}

/**
 * Stop GPS background verification
 */
function stopGPSBackgroundVerification() {
    if (gpsVerificationInterval) {
        clearInterval(gpsVerificationInterval);
        gpsVerificationInterval = null;
        console.log('[GPS Verification] Stopped background verification');
    }
}

/**
 * Open device location settings
 * Works on most mobile browsers
 */
function openLocationSettings() {
    hideGPSOffAlert();

    // Try to open location settings
    // Different approaches for different platforms

    // First, try requesting permission again (this will prompt the user)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // Success! GPS is back on
                console.log('[GPS] Location enabled successfully');
                locationPermissionStatus = 'granted';
                gpsWarningDismissCount = 0; // Reset counter
                await logGPSOffEnd();
                hideLocationDeniedBanner();
                startLocationTracking();
                showToast('✅ GPS ativado! Localização restaurada.', 'success');
            },
            (error) => {
                console.log('[GPS] Still denied, showing instructions');
                // Show instructions for manual enabling
                showLocationSettingsInstructions();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        showLocationSettingsInstructions();
    }
}

/**
 * Show instructions on how to enable GPS manually
 */
function showLocationSettingsInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let instructions = '';
    if (isIOS) {
        instructions = `
            <p><strong>No iPhone/iPad:</strong></p>
            <ol>
                <li>Abra <strong>Ajustes</strong></li>
                <li>Toque em <strong>Privacidade e Segurança</strong></li>
                <li>Toque em <strong>Serviços de Localização</strong></li>
                <li>Ative a <strong>Localização</strong></li>
                <li>Encontre o Safari/navegador e permita</li>
            </ol>
        `;
    } else if (isAndroid) {
        instructions = `
            <p><strong>No Android:</strong></p>
            <ol>
                <li>Abra <strong>Configurações</strong></li>
                <li>Toque em <strong>Localização</strong></li>
                <li>Ative a <strong>Localização</strong></li>
                <li>Volte para o app e recarregue</li>
            </ol>
        `;
    } else {
        instructions = `
            <p>Abra as configurações do seu dispositivo e ative a localização para este site.</p>
        `;
    }

    // Show modal with instructions
    let modal = document.getElementById('gps-instructions-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gps-instructions-modal';
        modal.className = 'gps-warning-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="gps-warning-content gps-instructions">
            <div class="gps-warning-icon">⚙️</div>
            <h2>Como Ativar o GPS</h2>
            <div class="gps-instructions-text">
                ${instructions}
            </div>
            <div class="gps-warning-actions">
                <button class="btn-enable-gps" onclick="closeInstructionsAndRetry()">
                    <span>🔄</span> Já Ativei, Verificar
                </button>
                <button class="btn-dismiss-gps" onclick="closeInstructionsModal()">
                    Fechar
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

/**
 * Close instructions modal and retry GPS
 */
function closeInstructionsAndRetry() {
    const modal = document.getElementById('gps-instructions-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Try to get location again
    openLocationSettings();
}

/**
 * Close instructions modal
 */
function closeInstructionsModal() {
    const modal = document.getElementById('gps-instructions-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Show warning again after delay if still no GPS
    setTimeout(() => {
        if (activeCheckinId && locationPermissionStatus !== 'granted') {
            gpsAlertShown = false;
            showGPSOffAlert();
        }
    }, 10000);
}

/**
 * User clicked to enable GPS from alert (legacy function)
 */
async function requestGPSFromAlert() {
    openLocationSettings();
}

// =============================================
// Enhanced GPS Monitoring
// =============================================

/**
 * Monitor GPS permission changes
 */
async function initGPSMonitoring() {
    if (!navigator.permissions) return;

    try {
        const status = await navigator.permissions.query({ name: 'geolocation' });

        // Check INITIAL status and notify backend
        console.log('[GPS Monitor] Status inicial:', status.state);
        locationPermissionStatus = status.state;

        // Notify backend about initial GPS status (important for auto-checkout)
        if (status.state === 'denied') {
            logGPSOffStart();
            showLocationDeniedBanner();
        } else if (status.state === 'granted') {
            notifyBackendGPSStatus('granted');
        }

        // Listen for changes
        status.addEventListener('change', () => {
            console.log('[GPS Monitor] Permissão mudou para:', status.state);

            if (status.state === 'granted') {
                locationPermissionStatus = 'granted';
                logGPSOffEnd();
                hideLocationDeniedBanner();
                startLocationTracking();
            } else if (status.state === 'denied') {
                locationPermissionStatus = 'denied';
                logGPSOffStart();
                showLocationDeniedBanner();

                // Show persistent alert if checked in
                if (activeCheckinId) {
                    showGPSOffAlert();
                }
            }
        });

        console.log('[GPS Monitor] Monitoramento de permissão iniciado');
    } catch (error) {
        console.log('[GPS Monitor] Erro:', error);
    }
}

// Initialize systems on load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize offline location DB
    initLocationDB().then(() => {
        console.log('[LocationDB] Pronto');
    });

    // Initialize GPS monitoring
    initGPSMonitoring();

    // Sync pending data when online
    if (isOnline) {
        setTimeout(() => {
            syncPendingLocations();
            syncGPSOffLogs();
        }, 3000);
    }
});

// Sync when coming back online
window.addEventListener('online', () => {
    setTimeout(() => {
        syncPendingLocations();
        syncGPSOffLogs();
    }, 2000);
});

// =============================================
// ACCELEROMETER & MOVEMENT TRACKING SYSTEM
// =============================================

/**
 * Start accelerometer monitoring (only when NOT checked in)
 */
function startAccelerometerMonitoring() {
    if (accelerometerActive) return;
    if (activeCheckinId) {
        console.log('[Accelerometer] Ignorado - usuário com check-in ativo');
        return;
    }

    if (!window.DeviceMotionEvent) {
        console.log('[Accelerometer] DeviceMotion API não suportada');
        return;
    }

    // Check if we need permission (iOS 13+)
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    setupAccelerometerListener();
                } else {
                    console.log('[Accelerometer] Permissão negada');
                }
            })
            .catch(console.error);
    } else {
        setupAccelerometerListener();
    }
}

/**
 * Setup accelerometer event listener
 */
function setupAccelerometerListener() {
    window.addEventListener('devicemotion', handleDeviceMotion);
    accelerometerActive = true;
    console.log('[Accelerometer] Monitoramento iniciado');

    // Start interval for location updates when moving
    startMovementLocationInterval();
}

/**
 * Stop accelerometer monitoring
 */
function stopAccelerometerMonitoring() {
    if (!accelerometerActive) return;

    window.removeEventListener('devicemotion', handleDeviceMotion);
    accelerometerActive = false;

    if (movementLocationInterval) {
        clearInterval(movementLocationInterval);
        movementLocationInterval = null;
    }

    console.log('[Accelerometer] Monitoramento parado');
}

/**
 * Handle device motion events
 */
function handleDeviceMotion(event) {
    if (activeCheckinId) {
        // User checked in - stop accelerometer, use GPS instead
        stopAccelerometerMonitoring();
        return;
    }

    const acc = event.acceleration || event.accelerationIncludingGravity;
    if (!acc) return;

    // Calculate total acceleration magnitude
    const magnitude = Math.sqrt(
        (acc.x || 0) ** 2 +
        (acc.y || 0) ** 2 +
        (acc.z || 0) ** 2
    );

    // Subtract gravity (~9.8) if using accelerationIncludingGravity
    const effectiveMagnitude = event.acceleration ? magnitude : Math.abs(magnitude - 9.8);

    if (effectiveMagnitude > MOVEMENT_THRESHOLD) {
        // Device is moving
        if (!isDeviceMoving) {
            isDeviceMoving = true;
            console.log('[Accelerometer] Movimento detectado:', effectiveMagnitude.toFixed(2), 'm/s²');

            // Log timeline event
            logTimelineEvent('MOVEMENT_START', {
                accelerationMagnitude: effectiveMagnitude
            });
        }
        lastMovementTime = Date.now();

        // Check for morning activity
        checkMorningActivity();
    } else {
        // Device is still
        if (isDeviceMoving && lastMovementTime && (Date.now() - lastMovementTime > 30000)) {
            // Stopped moving for 30+ seconds
            isDeviceMoving = false;
            console.log('[Accelerometer] Dispositivo parou');

            // Log timeline event
            logTimelineEvent('MOVEMENT_STOP', {
                duration: Date.now() - lastMovementTime
            });
        }
    }
}

/**
 * Start interval for sending location when moving (every 5 minutes)
 */
function startMovementLocationInterval() {
    if (movementLocationInterval) return;

    movementLocationInterval = setInterval(async () => {
        // Only send if moving and not checked in
        if (!isDeviceMoving || activeCheckinId) return;

        await sendMovementLocation();
    }, MOVEMENT_LOCATION_INTERVAL);

    console.log('[Movement] Intervalo de localização iniciado (5 min)');
}

/**
 * Send location when movement is detected
 */
async function sendMovementLocation() {
    if (!navigator.geolocation) return;
    if (locationPermissionStatus !== 'granted') return;

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000
            });
        });

        const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: new Date().toISOString(),
            source: 'movement_tracking',
            isMoving: isDeviceMoving,
            hasActiveCheckin: false
        };

        // Log to timeline
        await logTimelineEvent('LOCATION_UPDATE', {
            ...locationData,
            trigger: 'accelerometer'
        });

        // Send to server if online
        if (isOnline) {
            const token = getAuthToken();
            if (token) {
                await fetch(`${API_URL}/api/mobile/location`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(locationData)
                });
                console.log('[Movement] Localização enviada:', position.coords.latitude.toFixed(4), position.coords.longitude.toFixed(4));
            }
        } else {
            // Save for later sync
            await saveLocationToIndexedDB(locationData);
        }

        lastMovementLocation = locationData;
    } catch (error) {
        console.log('[Movement] Erro ao obter localização:', error);
    }
}

/**
 * Check for morning activity (wake-up indicator)
 */
function checkMorningActivity() {
    const now = new Date();
    const hour = now.getHours();
    const today = now.toISOString().split('T')[0];

    // Only during morning hours
    if (hour < MORNING_START_HOUR || hour >= MORNING_END_HOUR) return;

    // Only once per day
    const lastMorningAlert = localStorage.getItem('lastMorningAlertDate');
    if (lastMorningAlert === today) return;

    if (!morningActivityDetected) {
        morningActivityDetected = true;
        localStorage.setItem('lastMorningAlertDate', today);

        console.log('[Morning] Atividade matinal detectada às', now.toLocaleTimeString());

        // Log timeline event
        logTimelineEvent('MORNING_ACTIVITY', {
            detectedAt: now.toISOString(),
            hour: hour
        });

        // Show notification to user
        showMorningActivityNotification();
    }
}

/**
 * Show morning activity notification
 */
function showMorningActivityNotification() {
    if (todayMorningAlertShown) return;
    todayMorningAlertShown = true;

    // Simple toast notification
    showToast('Bom dia! Detectamos que você acordou. Indo para o projeto?', 'info');
}

// =============================================
// TIMELINE EVENT LOGGING
// =============================================

/**
 * Log an event to the timeline
 * Types: MOVEMENT_START, MOVEMENT_STOP, LOCATION_UPDATE, MORNING_ACTIVITY,
 *        CHECKIN, CHECKOUT, LEFT_PROJECT_AREA, RETURNED_PROJECT_AREA
 */
async function logTimelineEvent(type, data = {}) {
    try {
        await initLocationDB();

        if (!locationDB) {
            console.log('[Timeline] IndexedDB não disponível');
            return;
        }

        const now = new Date();
        const event = {
            type,
            timestamp: now.toISOString(),
            date: now.toISOString().split('T')[0],
            hour: now.getHours(),
            data,
            synced: false
        };

        const transaction = locationDB.transaction([TIMELINE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(TIMELINE_STORE_NAME);
        store.add(event);

        console.log('[Timeline] Evento registrado:', type);
    } catch (error) {
        console.error('[Timeline] Erro ao registrar evento:', error);
    }
}

/**
 * Get timeline events for a specific date
 */
async function getTimelineForDate(dateStr) {
    try {
        await initLocationDB();
        if (!locationDB) return [];

        return new Promise((resolve) => {
            const transaction = locationDB.transaction([TIMELINE_STORE_NAME], 'readonly');
            const store = transaction.objectStore(TIMELINE_STORE_NAME);
            const index = store.index('date');
            const request = index.getAll(dateStr);

            request.onsuccess = () => {
                const events = request.result || [];
                // Sort by timestamp
                events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                resolve(events);
            };

            request.onerror = () => resolve([]);
        });
    } catch (error) {
        console.error('[Timeline] Erro ao buscar eventos:', error);
        return [];
    }
}

/**
 * Get today's timeline
 */
async function getTodayTimeline() {
    const today = new Date().toISOString().split('T')[0];
    return getTimelineForDate(today);
}

/**
 * Sync timeline events to server
 */
async function syncTimelineEvents() {
    try {
        await initLocationDB();
        if (!locationDB) return;

        const transaction = locationDB.transaction([TIMELINE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(TIMELINE_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async () => {
            const events = (request.result || []).filter(e => !e.synced);
            if (events.length === 0) return;

            const token = getAuthToken();
            if (!token) return;

            console.log(`[Timeline] Sincronizando ${events.length} eventos...`);

            try {
                const response = await fetch(`${API_URL}/api/mobile/location/timeline`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ events })
                });

                if (response.ok) {
                    // Mark events as synced
                    const updateTx = locationDB.transaction([TIMELINE_STORE_NAME], 'readwrite');
                    const updateStore = updateTx.objectStore(TIMELINE_STORE_NAME);

                    for (const event of events) {
                        event.synced = true;
                        updateStore.put(event);
                    }

                    console.log('[Timeline] Eventos sincronizados');
                }
            } catch (error) {
                console.log('[Timeline] Erro ao sincronizar:', error);
            }
        };
    } catch (error) {
        console.error('[Timeline] Erro:', error);
    }
}

/**
 * Clean up old timeline events (keep only last 7 days)
 */
async function cleanupOldTimelineEvents() {
    try {
        await initLocationDB();
        if (!locationDB) return;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

        const transaction = locationDB.transaction([TIMELINE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(TIMELINE_STORE_NAME);
        const index = store.index('date');

        const request = index.openCursor();
        let deletedCount = 0;

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.date < cutoffDate) {
                    cursor.delete();
                    deletedCount++;
                }
                cursor.continue();
            } else if (deletedCount > 0) {
                console.log(`[Timeline] ${deletedCount} eventos antigos removidos`);
            }
        };
    } catch (error) {
        console.error('[Timeline] Erro ao limpar eventos:', error);
    }
}

// =============================================
// AUTO-CHECKOUT WITH JUSTIFICATION
// =============================================

/**
 * Show leaving project modal with justification options
 */
function showLeavingProjectModal() {
    const modal = document.getElementById('leaving-project-modal');
    if (modal) {
        modal.classList.add('active');
    } else {
        // Create modal dynamically if doesn't exist
        createLeavingProjectModal();
    }

    // Log timeline event
    logTimelineEvent('LEFT_PROJECT_AREA', {
        projectId: currentProjectForCheckin,
        distance: currentDistanceToProject
    });
}

/**
 * Create leaving project modal dynamically
 */
function createLeavingProjectModal() {
    const modal = document.createElement('div');
    modal.id = 'leaving-project-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content leaving-modal">
            <div class="leaving-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
            </div>
            <h3>Saindo do projeto?</h3>
            <p>Detectamos que você se afastou da área do projeto.</p>

            <div class="leaving-options">
                <button class="leaving-option" onclick="justifyLeaving('COMPRA_MATERIAL')">
                    <span class="option-icon">🛒</span>
                    <span>Compra de Material</span>
                </button>
                <button class="leaving-option" onclick="justifyLeaving('ALMOCO')">
                    <span class="option-icon">🍽️</span>
                    <span>Almoço</span>
                </button>
                <button class="leaving-option" onclick="justifyLeaving('OUTRO_PROJETO')">
                    <span class="option-icon">🏗️</span>
                    <span>Indo para outro projeto</span>
                </button>
                <button class="leaving-option" onclick="justifyLeaving('EMERGENCIA')">
                    <span class="option-icon">🚨</span>
                    <span>Emergência</span>
                </button>
                <button class="leaving-option leaving-checkout" onclick="justifyLeaving('FIM_EXPEDIENTE')">
                    <span class="option-icon">🏠</span>
                    <span>Fim do expediente</span>
                </button>
            </div>

            <button class="btn-cancel-leaving" onclick="cancelLeavingModal()">
                Continuar trabalhando
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');
}

/**
 * Handle leaving justification
 */
async function justifyLeaving(reason) {
    const modal = document.getElementById('leaving-project-modal');
    if (modal) modal.classList.remove('active');

    // Log timeline event
    await logTimelineEvent('LEAVING_JUSTIFIED', {
        reason,
        projectId: currentProjectForCheckin,
        timestamp: new Date().toISOString()
    });

    switch (reason) {
        case 'COMPRA_MATERIAL':
            // Don't checkout - just pause and continue tracking
            showToast('Compra de material registrada. Boa compra!', 'info');
            break;

        case 'ALMOCO':
            // Start lunch break
            showToast('Hora do almoço! Bom apetite.', 'info');
            break;

        case 'OUTRO_PROJETO':
            // Checkout from current and prepare for next
            await doCheckoutWithReason('outro_projeto');
            showToast('Check-out realizado. Selecione o próximo projeto.', 'success');
            break;

        case 'EMERGENCIA':
            // Emergency - log but don't penalize
            await doCheckoutWithReason('emergencia');
            showToast('Emergência registrada. Cuide-se!', 'warning');
            break;

        case 'FIM_EXPEDIENTE':
            // End of work day - normal checkout
            await doCheckoutWithReason('fim_expediente');
            // Start accelerometer monitoring for trajectory home
            startAccelerometerMonitoring();
            break;

        default:
            // Unknown reason - do checkout anyway
            await doCheckoutWithReason('nao_justificado');
            break;
    }
}

/**
 * Cancel leaving modal - user is staying
 */
function cancelLeavingModal() {
    const modal = document.getElementById('leaving-project-modal');
    if (modal) modal.classList.remove('active');

    // Log timeline event
    logTimelineEvent('RETURNED_PROJECT_AREA', {
        projectId: currentProjectForCheckin
    });

    showToast('Voltando ao trabalho!', 'success');
}

/**
 * Do checkout with a specific reason
 */
async function doCheckoutWithReason(reason) {
    if (!activeCheckinId) return;

    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/mobile/checkins/${activeCheckinId}/checkout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                reason,
                latitude: lastMovementLocation?.latitude,
                longitude: lastMovementLocation?.longitude
            })
        });

        const data = await response.json();

        if (data.success) {
            isCheckedIn = false;
            activeCheckinId = null;
            pendingCheckoutReason = null; // Clear stale values
            updateCheckinUI(false);

            // Stop GPS background verification
            stopGPSBackgroundVerification();

            // Log timeline event
            await logTimelineEvent('CHECKOUT', {
                reason,
                hoursWorked: data.data?.hoursWorked
            });
        }
    } catch (error) {
        console.error('[Checkout] Erro:', error);
    }
}

// =============================================
// INITIALIZE MOVEMENT TRACKING
// =============================================

// Start accelerometer when app loads (if not checked in)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for auth to be established
    setTimeout(() => {
        if (!activeCheckinId) {
            startAccelerometerMonitoring();
        }
    }, 3000);

    // Cleanup old timeline events
    cleanupOldTimelineEvents();

    // Sync timeline when online
    if (isOnline) {
        setTimeout(syncTimelineEvents, 5000);
    }
});

// Start accelerometer when user checks out
window.addEventListener('checkout', () => {
    startAccelerometerMonitoring();
});

// Stop accelerometer when user checks in
window.addEventListener('checkin', () => {
    stopAccelerometerMonitoring();
});

// Sync timeline when coming back online
window.addEventListener('online', () => {
    setTimeout(syncTimelineEvents, 3000);
});

// Export functions for debugging
window.debugLocation = {
    getPending: getPendingLocationsFromIndexedDB,
    syncNow: syncPendingLocations,
    syncGPSLogs: syncGPSOffLogs,
    showGPSAlert: showGPSOffAlert,
    hideGPSAlert: hideGPSOffAlert
};

// Export movement tracking functions for debugging
window.debugMovement = {
    startAccelerometer: startAccelerometerMonitoring,
    stopAccelerometer: stopAccelerometerMonitoring,
    isMoving: () => isDeviceMoving,
    getTimeline: getTodayTimeline,
    syncTimeline: syncTimelineEvents,
    showLeavingModal: showLeavingProjectModal
};
